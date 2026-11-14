import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireMediaAdmin } from "@/lib/auth/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createPresignedPutUpload,
  isR2Configured,
} from "@/lib/storage/r2";
import {
  generateSafeObjectKey,
  MAX_IMAGE_FILE_SIZE_BYTES,
  validateUploadRequest,
} from "@/lib/storage/validation";

const presignSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(3).max(100),
  sizeBytes: z.number().int().positive().max(MAX_IMAGE_FILE_SIZE_BYTES),
  folder: z.string().max(64).optional(),
  checksumSha256: z
    .string()
    .regex(/^[a-f0-9]{64}$/i)
    .optional(),
  allowDuplicate: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireMediaAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }

  if (!isR2Configured()) {
    return NextResponse.json(
      {
        error:
          "Stockage Cloudflare R2 non configuré sur le serveur. Veuillez renseigner les variables R2_*.",
      },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête JSON invalide." }, { status: 400 });
  }

  const parsed = presignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Paramètres de téléversement invalides.",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const validation = validateUploadRequest({
    filename: parsed.data.filename,
    mimeType: parsed.data.mimeType,
    sizeBytes: parsed.data.sizeBytes,
    folder: parsed.data.folder,
  });

  if (!validation.valid || !validation.normalizedMime || !validation.extension) {
    return NextResponse.json({ error: validation.error || "Fichier invalide." }, { status: 400 });
  }

  try {
    // Prevent duplicate uploads when SHA-256 checksum matches an existing active R2 asset
    if (parsed.data.checksumSha256 && !parsed.data.allowDuplicate) {
      const supabase = createAdminClient();
      const { data: existing } = await supabase
        .from("media_assets")
        .select("*")
        .eq("checksum_sha256", parsed.data.checksumSha256.toLowerCase())
        .is("deleted_at", null)
        .limit(1)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({
          duplicate: true,
          asset: existing,
        });
      }
    }

    const objectKey = generateSafeObjectKey({
      folder: validation.folder,
      extension: validation.extension,
    });

    const presigned = await createPresignedPutUpload({
      objectKey,
      contentType: validation.normalizedMime,
      contentLength: parsed.data.sizeBytes,
      originalFilename: validation.sanitizedFilename || parsed.data.filename,
      expiresInSeconds: 300,
    });

    return NextResponse.json({
      duplicate: false,
      uploadUrl: presigned.uploadUrl,
      objectKey: presigned.objectKey,
      publicUrl: presigned.publicUrl,
      expiresInSeconds: presigned.expiresInSeconds,
      requiredHeaders: presigned.requiredHeaders,
      folder: validation.folder,
      sanitizedFilename: validation.sanitizedFilename,
      normalizedMime: validation.normalizedMime,
    });
  } catch (err) {
    console.error("Presign R2 upload error:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json(
      { error: "Impossible de préparer le téléversement sécurisé vers R2." },
      { status: 500 }
    );
  }
}
