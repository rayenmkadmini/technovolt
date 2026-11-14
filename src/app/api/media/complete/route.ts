import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireMediaAdmin } from "@/lib/auth/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildR2PublicUrl,
  deleteR2Object,
  getR2ObjectBytes,
  headR2Object,
  isR2Configured,
} from "@/lib/storage/r2";
import {
  computeSha256Hex,
  isSafeObjectKey,
  MAX_IMAGE_FILE_SIZE_BYTES,
  sanitizeMediaFolder,
  sanitizeOriginalFilename,
  validateFilenameAndExtension,
  validateImageMagicBytes,
} from "@/lib/storage/validation";
import { buildCloudflareImageUrl } from "@/lib/media/imageUrl";

const completeSchema = z.object({
  objectKey: z.string().min(5).max(300),
  originalFilename: z.string().min(1).max(255),
  mimeType: z.string().min(3).max(100),
  sizeBytes: z.number().int().positive().max(MAX_IMAGE_FILE_SIZE_BYTES),
  folder: z.string().max(64).optional(),
  altTextFr: z.string().max(300).optional(),
  altTextAr: z.string().max(300).optional(),
  altTextEn: z.string().max(300).optional(),
  width: z.number().int().positive().max(20000).optional().nullable(),
  height: z.number().int().positive().max(20000).optional().nullable(),
  checksumSha256: z
    .string()
    .regex(/^[a-f0-9]{64}$/i)
    .optional(),
  replaceMediaId: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireMediaAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }

  if (!isR2Configured()) {
    return NextResponse.json(
      { error: "Stockage Cloudflare R2 non configuré." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête JSON invalide." }, { status: 400 });
  }

  const parsed = completeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données de finalisation invalides.", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  if (!isSafeObjectKey(data.objectKey)) {
    return NextResponse.json({ error: "Clé d'objet invalide." }, { status: 400 });
  }

  const nameValidation = validateFilenameAndExtension(data.originalFilename, data.mimeType);
  if (!nameValidation.valid || !nameValidation.normalizedMime) {
    return NextResponse.json({ error: nameValidation.error }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    // Idempotency: if this object_key was already registered, return it
    const { data: existingByKey } = await supabase
      .from("media_assets")
      .select("*")
      .eq("object_key", data.objectKey)
      .maybeSingle();

    if (existingByKey) {
      return NextResponse.json({
        success: true,
        duplicate: true,
        asset: {
          ...existingByKey,
          thumbnailUrl: buildCloudflareImageUrl(
            existingByKey.public_url || existingByKey.file_url,
            "thumbnail"
          ),
        },
      });
    }

    // 1. Verify object exists in R2 and check size/content-type
    const head = await headR2Object(data.objectKey);
    if (!head.exists) {
      return NextResponse.json(
        { error: "Objet introuvable dans R2. Le téléversement n'a pas abouti." },
        { status: 400 }
      );
    }

    const actualSize = head.contentLength ?? data.sizeBytes;
    if (actualSize <= 0 || actualSize > MAX_IMAGE_FILE_SIZE_BYTES) {
      await deleteR2Object(data.objectKey).catch(() => {});
      return NextResponse.json(
        { error: "La taille du fichier dans R2 dépasse la limite autorisée." },
        { status: 400 }
      );
    }

    // 2. Verify actual binary magic bytes from R2 (and SVG safety)
    const sampleBytes = await getR2ObjectBytes(data.objectKey, {
      maxBytes: nameValidation.normalizedMime === "image/svg+xml" ? 65536 : 4096,
    });
    const magicCheck = validateImageMagicBytes(sampleBytes, nameValidation.normalizedMime);
    if (!magicCheck.valid) {
      // Purge forged/malicious file immediately
      await deleteR2Object(data.objectKey).catch(() => {});
      return NextResponse.json(
        { error: magicCheck.error || "Contenu binaire du fichier rejeté." },
        { status: 400 }
      );
    }

    const sanitizedName = sanitizeOriginalFilename(data.originalFilename);
    const safeFolder = sanitizeMediaFolder(data.folder);
    const publicUrl = buildR2PublicUrl(data.objectKey);

    let computedChecksum = data.checksumSha256?.toLowerCase() || null;
    if (!computedChecksum && actualSize <= MAX_IMAGE_FILE_SIZE_BYTES) {
      const fullBytes =
        actualSize <= sampleBytes.length ? sampleBytes : await getR2ObjectBytes(data.objectKey);
      computedChecksum = computeSha256Hex(fullBytes);
    }

    if (data.replaceMediaId) {
      const { data: targetRow } = await supabase
        .from("media_assets")
        .select("*")
        .eq("id", data.replaceMediaId)
        .maybeSingle();

      if (!targetRow) {
        return NextResponse.json({ error: "Média à remplacer introuvable." }, { status: 404 });
      }

      const { data: updated, error: updateErr } = await supabase
        .from("media_assets")
        .update({
          file_name: sanitizedName,
          original_filename: sanitizedName,
          file_path: data.objectKey,
          object_key: data.objectKey,
          file_url: publicUrl,
          public_url: publicUrl,
          mime_type: nameValidation.normalizedMime,
          file_size: actualSize,
          size_bytes: actualSize,
          width: data.width ?? targetRow.width,
          height: data.height ?? targetRow.height,
          alt_text_fr: data.altTextFr?.trim() || targetRow.alt_text_fr || sanitizedName,
          alt_text_ar: data.altTextAr?.trim() ?? targetRow.alt_text_ar ?? "",
          alt_text_en: data.altTextEn?.trim() ?? targetRow.alt_text_en ?? "",
          folder: safeFolder,
          category: safeFolder,
          storage_provider: "r2",
          migration_status: "native_r2",
          checksum_sha256: computedChecksum,
          // Preserve legacy rollback fields if this row originated from Supabase Storage
          legacy_storage_path: targetRow.legacy_storage_path || targetRow.file_path,
          legacy_public_url: targetRow.legacy_public_url || targetRow.file_url,
        })
        .eq("id", data.replaceMediaId)
        .select()
        .single();

      if (updateErr) throw updateErr;

      return NextResponse.json({
        success: true,
        replaced: true,
        asset: {
          ...updated,
          thumbnailUrl: buildCloudflareImageUrl(publicUrl, "thumbnail"),
        },
      });
    }

    const { data: inserted, error: insertErr } = await supabase
      .from("media_assets")
      .insert({
        file_name: sanitizedName,
        original_filename: sanitizedName,
        file_path: data.objectKey,
        object_key: data.objectKey,
        file_url: publicUrl,
        public_url: publicUrl,
        file_type: "image",
        mime_type: nameValidation.normalizedMime,
        file_size: actualSize,
        size_bytes: actualSize,
        width: data.width ?? null,
        height: data.height ?? null,
        alt_text_fr: data.altTextFr?.trim() || sanitizedName,
        alt_text_ar: data.altTextAr?.trim() || "",
        alt_text_en: data.altTextEn?.trim() || "",
        folder: safeFolder,
        category: safeFolder,
        storage_provider: "r2",
        migration_status: "native_r2",
        checksum_sha256: computedChecksum,
        uploaded_by: auth.userId || null,
        is_public: true,
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    return NextResponse.json({
      success: true,
      asset: {
        ...inserted,
        thumbnailUrl: buildCloudflareImageUrl(publicUrl, "thumbnail"),
      },
    });
  } catch (err) {
    console.error("Complete R2 upload error:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json(
      { error: "Erreur lors de la validation et de l'enregistrement du média." },
      { status: 500 }
    );
  }
}
