#!/usr/bin/env node
/**
 * TECHNOVOLT — Non-Destructive Rollback (R2 -> Legacy Supabase Storage URLs)
 *
 * SAFETY GUARANTEES:
 * - Runs in DRY-RUN mode by default.
 * - Real execution requires `--execute --confirm-rollback`.
 * - NEVER deletes R2 objects or Supabase Storage objects.
 */

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { rollbackMigratedMedia } from "../src/lib/media/migration.ts";

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

loadEnvLocal();

const args = process.argv.slice(2);
const dryRun = !(args.includes("--execute") && args.includes("--confirm-rollback"));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey || supabaseUrl.includes("placeholder")) {
  console.error("ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured in .env.local.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function restoreUrlInDomainTables(r2Url, legacyUrl) {
  if (!r2Url || !legacyUrl || r2Url === legacyUrl) return;

  const { data: settingsRows } = await supabase.from("company_settings").select("id, settings");
  for (const row of settingsRows || []) {
    if (!row.settings) continue;
    let changed = false;
    const nextSettings = { ...row.settings };
    if (nextSettings.logo_url === r2Url) {
      nextSettings.logo_url = legacyUrl;
      changed = true;
    }
    if (nextSettings.favicon_url === r2Url) {
      nextSettings.favicon_url = legacyUrl;
      changed = true;
    }
    if (changed) {
      await supabase.from("company_settings").update({ settings: nextSettings }).eq("id", row.id);
    }
  }

  const { data: serviceRows } = await supabase.from("services").select("id, cover_image, gallery");
  for (const srv of serviceRows || []) {
    const updates = {};
    if (srv.cover_image === r2Url) updates.cover_image = legacyUrl;
    if (Array.isArray(srv.gallery) && srv.gallery.includes(r2Url)) {
      updates.gallery = srv.gallery.map((u) => (u === r2Url ? legacyUrl : u));
    }
    if (Object.keys(updates).length > 0) {
      await supabase.from("services").update(updates).eq("id", srv.id);
    }
  }

  const { data: projectRows } = await supabase
    .from("projects")
    .select("id, cover_image, gallery, before_images, after_images");
  for (const proj of projectRows || []) {
    const updates = {};
    if (proj.cover_image === r2Url) updates.cover_image = legacyUrl;
    for (const col of ["gallery", "before_images", "after_images"]) {
      if (Array.isArray(proj[col]) && proj[col].includes(r2Url)) {
        updates[col] = proj[col].map((u) => (u === r2Url ? legacyUrl : u));
      }
    }
    if (Object.keys(updates).length > 0) {
      await supabase.from("projects").update(updates).eq("id", proj.id);
    }
  }

  const { data: woRows } = await supabase.from("work_orders").select("id, completion_photos");
  for (const wo of woRows || []) {
    if (Array.isArray(wo.completion_photos) && wo.completion_photos.includes(r2Url)) {
      await supabase
        .from("work_orders")
        .update({
          completion_photos: wo.completion_photos.map((u) => (u === r2Url ? legacyUrl : u)),
        })
        .eq("id", wo.id);
    }
  }

  await supabase.from("expenses").update({ receipt_url: legacyUrl }).eq("receipt_url", r2Url);
}

async function main() {
  console.log(`=== TECHNOVOLT R2 ROLLBACK (${dryRun ? "DRY-RUN MODE" : "LIVE ROLLBACK"}) ===`);

  const { data, error } = await supabase
    .from("media_assets")
    .select("id, public_url, file_url, legacy_public_url, legacy_storage_path, migration_status")
    .eq("migration_status", "verified")
    .not("legacy_public_url", "is", null);

  if (error) throw error;

  const records = (data || []).map((row) => ({
    id: row.id,
    publicUrl: row.public_url || row.file_url,
    legacyPublicUrl: row.legacy_public_url,
    legacyStoragePath: row.legacy_storage_path,
    migrationStatus: row.migration_status,
  }));

  const result = await rollbackMigratedMedia(
    records,
    {
      restoreAssetMetadata: async (rec) => {
        const { error: updErr } = await supabase
          .from("media_assets")
          .update({
            file_url: rec.legacyPublicUrl,
            public_url: rec.legacyPublicUrl,
            file_path: rec.legacyStoragePath || rec.legacyPublicUrl,
            storage_provider: "supabase",
            migration_status: "rolled_back",
          })
          .eq("id", rec.id);
        if (updErr) throw updErr;
      },
      restoreUrlReferences: restoreUrlInDomainTables,
    },
    { dryRun }
  );

  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error("Rollback failed:", err?.message || err);
  process.exit(1);
});
