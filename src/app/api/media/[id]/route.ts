import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireMediaAdmin } from "@/lib/auth/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteR2Object, isR2Configured } from "@/lib/storage/r2";
import {
  isSafeObjectKey,
  sanitizeMediaFolder,
  sanitizeOriginalFilename,
} from "@/lib/storage/validation";

const uuidSchema = z.string().uuid();

const patchSchema = z.object({
  altTextFr: z.string().max(300).optional(),
  altTextAr: z.string().max(300).optional(),
  altTextEn: z.string().max(300).optional(),
  folder: z.string().max(64).optional(),
  category: z.string().max(64).optional(),
  sortOrder: z.number().int().min(0).max(100000).optional(),
  fileName: z.string().min(1).max(255).optional(),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireMediaAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }

  const { id } = await context.params;
  if (!uuidSchema.safeParse(id).success) {
    return NextResponse.json({ error: "Identifiant média invalide." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Champs de mise à jour invalides.", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const supabase = createAdminClient();
    const updatePayload: Record<string, unknown> = {};

    if (parsed.data.altTextFr !== undefined) {
      updatePayload.alt_text_fr = parsed.data.altTextFr.trim();
    }
    if (parsed.data.altTextAr !== undefined) {
      updatePayload.alt_text_ar = parsed.data.altTextAr.trim();
    }
    if (parsed.data.altTextEn !== undefined) {
      updatePayload.alt_text_en = parsed.data.altTextEn.trim();
    }
    if (parsed.data.folder !== undefined || parsed.data.category !== undefined) {
      const safeFolder = sanitizeMediaFolder(parsed.data.category ?? parsed.data.folder);
      updatePayload.folder = safeFolder;
      updatePayload.category = safeFolder;
    }
    if (parsed.data.sortOrder !== undefined) {
      updatePayload.sort_order = parsed.data.sortOrder;
    }
    if (parsed.data.fileName !== undefined) {
      updatePayload.file_name = sanitizeOriginalFilename(parsed.data.fileName);
    }

    const { data: updated, error } = await supabase
      .from("media_assets")
      .update(updatePayload)
      .eq("id", id)
      .is("deleted_at", null)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!updated) {
      return NextResponse.json({ error: "Média introuvable." }, { status: 404 });
    }

    return NextResponse.json({ success: true, asset: updated });
  } catch (err) {
    console.error("Update media error:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "Erreur lors de la mise à jour." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireMediaAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }

  const { id } = await context.params;
  if (!uuidSchema.safeParse(id).success) {
    return NextResponse.json({ error: "Identifiant média invalide." }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    // Always fetch object_key from DB; never trust any client-supplied object key
    const { data: existing, error: fetchErr } = await supabase
      .from("media_assets")
      .select("id, object_key, storage_provider, migration_status, deleted_at")
      .eq("id", id)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!existing) {
      return NextResponse.json({ error: "Média introuvable." }, { status: 404 });
    }

    // Soft delete metadata first so public access is revoked immediately while preserving audit/rollback history
    const { error: softDeleteErr } = await supabase
      .from("media_assets")
      .update({
        deleted_at: new Date().toISOString(),
        is_public: false,
      })
      .eq("id", id);

    if (softDeleteErr) throw softDeleteErr;

    // Never delete legacy Supabase Storage objects.
    // Only delete native R2 object when explicitly requested via ?purgeR2=true and safe object key is DB-verified.
    const purgeR2 = req.nextUrl.searchParams.get("purgeR2") === "true";
    if (
      purgeR2 &&
      existing.storage_provider === "r2" &&
      existing.migration_status === "native_r2" &&
      existing.object_key &&
      isSafeObjectKey(existing.object_key) &&
      isR2Configured()
    ) {
      await deleteR2Object(existing.object_key);
    }

    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error("Delete media error:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "Erreur lors de la suppression du média." }, { status: 500 });
  }
}
