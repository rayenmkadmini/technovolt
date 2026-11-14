#!/usr/bin/env node
/**
 * TECHNOVOLT — Resumable Legacy Supabase Storage -> Cloudflare R2 Migration CLI
 *
 * SAFETY DEFAULTS:
 * - Runs in DRY-RUN mode by default.
 * - Real execution requires BOTH `--execute` AND `--confirm-migration`.
 * - NEVER deletes legacy Supabase Storage objects or legacy URLs.
 */

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import {
  getR2Config,
  headR2Object,
  isR2Configured,
  putR2Object,
} from "../src/lib/storage/r2.ts";
import { migrateMediaBatch } from "../src/lib/media/migration.ts";

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
const executeFlag = args.includes("--execute") && args.includes("--confirm-migration");
const dryRun = !executeFlag;
const batchSizeArg = args.find((a) => a.startsWith("--batch-size="));
const offsetArg = args.find((a) => a.startsWith("--offset="));
const batchSize = batchSizeArg ? Math.max(1, Number.parseInt(batchSizeArg.split("=")[1], 10) || 25) : 25;
const offset = offsetArg ? Math.max(0, Number.parseInt(offsetArg.split("=")[1], 10) || 0) : 0;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey || supabaseUrl.includes("placeholder")) {
  console.error("ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured in .env.local.");
  process.exit(1);
}

if (!dryRun && !isR2Configured()) {
  console.error("ERROR: Cloudflare R2 environment variables are incomplete. Aborting real migration.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function listBucketObjectsRecursive(bucket, prefix = "") {
  const collected = [];
  let pageOffset = 0;
  const limit = 100;

  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit,
      offset: pageOffset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) {
      console.warn(`Warning listing bucket "${bucket}" prefix "${prefix}": ${error.message}`);
      break;
    }
    if (!data || data.length === 0) break;

    for (const entry of data) {
      const fullPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (!entry.id) {
        // Folder entry
        const nested = await listBucketObjectsRecursive(bucket, fullPath);
        collected.push(...nested);
      } else {
        collected.push({
          bucket,
          storagePath: fullPath,
          name: entry.name,
          mimeType: entry.metadata?.mimetype || "application/octet-stream",
          sizeBytes: entry.metadata?.size || null,
        });
      }
    }

    if (data.length < limit) break;
    pageOffset += limit;
  }

  return collected;
}

async function replaceUrlInDomainTables(fromUrl, toUrl) {
  if (!fromUrl || !toUrl || fromUrl === toUrl) return;

  // 1. company_settings.settings.logo_url / favicon_url
  const { data: settingsRows } = await supabase.from("company_settings").select("id, settings");
  for (const row of settingsRows || []) {
    if (!row.settings) continue;
    let changed = false;
    const nextSettings = { ...row.settings };
    if (nextSettings.logo_url === fromUrl) {
      nextSettings.logo_url = toUrl;
      changed = true;
    }
    if (nextSettings.favicon_url === fromUrl) {
      nextSettings.favicon_url = toUrl;
      changed = true;
    }
    if (changed) {
      await supabase.from("company_settings").update({ settings: nextSettings }).eq("id", row.id);
    }
  }

  // 2. services
  const { data: serviceRows } = await supabase
    .from("services")
    .select("id, cover_image, gallery");
  for (const srv of serviceRows || []) {
    const updates = {};
    if (srv.cover_image === fromUrl) updates.cover_image = toUrl;
    if (Array.isArray(srv.gallery) && srv.gallery.includes(fromUrl)) {
      updates.gallery = srv.gallery.map((u) => (u === fromUrl ? toUrl : u));
    }
    if (Object.keys(updates).length > 0) {
      await supabase.from("services").update(updates).eq("id", srv.id);
    }
  }

  // 3. projects
  const { data: projectRows } = await supabase
    .from("projects")
    .select("id, cover_image, gallery, before_images, after_images");
  for (const proj of projectRows || []) {
    const updates = {};
    if (proj.cover_image === fromUrl) updates.cover_image = toUrl;
    for (const col of ["gallery", "before_images", "after_images"]) {
      if (Array.isArray(proj[col]) && proj[col].includes(fromUrl)) {
        updates[col] = proj[col].map((u) => (u === fromUrl ? toUrl : u));
      }
    }
    if (Object.keys(updates).length > 0) {
      await supabase.from("projects").update(updates).eq("id", proj.id);
    }
  }

  // 4. work_orders.completion_photos
  const { data: woRows } = await supabase.from("work_orders").select("id, completion_photos");
  for (const wo of woRows || []) {
    if (Array.isArray(wo.completion_photos) && wo.completion_photos.includes(fromUrl)) {
      await supabase
        .from("work_orders")
        .update({
          completion_photos: wo.completion_photos.map((u) => (u === fromUrl ? toUrl : u)),
        })
        .eq("id", wo.id);
    }
  }

  // 5. expenses.receipt_url
  await supabase.from("expenses").update({ receipt_url: toUrl }).eq("receipt_url", fromUrl);
}

async function discoverCandidates() {
  const { data: existingAssets, error: dbErr } = await supabase
    .from("media_assets")
    .select("*");

  if (dbErr) {
    throw new Error(`Failed to query public.media_assets: ${dbErr.message}`);
  }

  const byLegacyPath = new Map();
  const candidates = [];

  for (const row of existingAssets || []) {
    if (row.deleted_at) continue;
    const bucket = row.legacy_bucket || "media";
    const storagePath = row.legacy_storage_path || row.file_path;
    const legacyUrl = row.legacy_public_url || row.file_url;
    byLegacyPath.set(`${bucket}:${storagePath}`, row);

    candidates.push({
      id: row.id,
      bucket,
      storagePath,
      legacyPublicUrl: legacyUrl,
      originalFilename: row.original_filename || row.file_name,
      mimeType: row.mime_type || "image/jpeg",
      sizeBytes: row.size_bytes ?? row.file_size ?? null,
      folder: row.folder || row.category || "general",
      migrationStatus: row.migration_status || "legacy",
      checksumSha256: row.checksum_sha256,
      objectKey: row.object_key,
      publicUrl: row.public_url,
    });
  }

  // Discover objects directly in Supabase Storage buckets and check accessibility
  const { data: buckets, error: bucketsErr } = await supabase.storage.listBuckets();
  const bucketErrors = [];
  if (bucketsErr) {
    bucketErrors.push({ bucket: "*", error: bucketsErr.message });
  }

  const storageObjectMap = new Map();
  const bucketCounts = {};

  for (const b of buckets || []) {
    try {
      const objects = await listBucketObjectsRecursive(b.name);
      let bucketBytes = 0;
      for (const obj of objects) {
        const mapKey = `${b.name}:${obj.storagePath}`;
        storageObjectMap.set(mapKey, obj);
        bucketBytes += Number(obj.sizeBytes || 0);

        if (byLegacyPath.has(mapKey)) continue;

        const { data: pub } = supabase.storage.from(b.name).getPublicUrl(obj.storagePath);
        candidates.push({
          bucket: b.name,
          storagePath: obj.storagePath,
          legacyPublicUrl: pub?.publicUrl || "",
          originalFilename: obj.name,
          mimeType: obj.mimeType,
          sizeBytes: obj.sizeBytes,
          folder: obj.storagePath.includes("/") ? obj.storagePath.split("/")[0] : b.name,
          migrationStatus: "legacy",
        });
      }
      bucketCounts[b.name] = {
        objectCount: objects.length,
        totalBytes: bucketBytes,
        totalMegabytes: Number((bucketBytes / (1024 * 1024)).toFixed(2)),
      };
    } catch (err) {
      bucketErrors.push({ bucket: b.name, error: err?.message || String(err) });
      bucketCounts[b.name] = { objectCount: 0, totalBytes: 0, totalMegabytes: 0, error: true };
    }
  }

  // Detect DB records whose backing Supabase Storage object is missing/inaccessible
  const missingOrInaccessibleObjects = [];
  for (const c of candidates) {
    if (c.migrationStatus === "native_r2") continue;
    const mapKey = `${c.bucket}:${c.storagePath}`;
    if (!storageObjectMap.has(mapKey)) {
      missingOrInaccessibleObjects.push({
        id: c.id || null,
        bucket: c.bucket,
        storagePath: c.storagePath,
      });
    } else if (c.sizeBytes == null) {
      c.sizeBytes = storageObjectMap.get(mapKey)?.sizeBytes ?? null;
    }
  }

  // Potential duplicate detection (verified checksums if present, or filename + size heuristic)
  const checksumGroups = new Map();
  const nameSizeGroups = new Map();
  for (const c of candidates) {
    if (c.checksumSha256) {
      if (!checksumGroups.has(c.checksumSha256)) checksumGroups.set(c.checksumSha256, []);
      checksumGroups.get(c.checksumSha256).push(`${c.bucket}:${c.storagePath}`);
    }
    if (c.originalFilename && typeof c.sizeBytes === "number") {
      const sig = `${c.originalFilename.toLowerCase()}::${c.sizeBytes}`;
      if (!nameSizeGroups.has(sig)) nameSizeGroups.set(sig, []);
      nameSizeGroups.get(sig).push(`${c.bucket}:${c.storagePath}`);
    }
  }
  const exactChecksumDuplicates = Array.from(checksumGroups.values()).filter((g) => g.length > 1);
  const heuristicFilenameSizeDuplicates = Array.from(nameSizeGroups.values()).filter((g) => g.length > 1);

  // Discover media references in application domain tables for inventory/broken-link auditing
  const referencedUrls = new Map();
  const tableRefCounts = {
    company_settings: 0,
    services: 0,
    projects: 0,
    work_orders: 0,
    expenses: 0,
    profiles: 0,
  };
  const trackRef = (url, table, source) => {
    if (!url || typeof url !== "string") return;
    if (table in tableRefCounts) tableRefCounts[table] += 1;
    if (!referencedUrls.has(url)) referencedUrls.set(url, []);
    referencedUrls.get(url).push(source);
  };

  const { data: settingsRef } = await supabase.from("company_settings").select("id, settings");
  for (const r of settingsRef || []) {
    trackRef(r.settings?.logo_url, "company_settings", `company_settings:${r.id}:logo_url`);
    trackRef(r.settings?.favicon_url, "company_settings", `company_settings:${r.id}:favicon_url`);
  }
  const { data: srvRef } = await supabase.from("services").select("id, cover_image, gallery");
  for (const s of srvRef || []) {
    trackRef(s.cover_image, "services", `services:${s.id}:cover_image`);
    for (const u of s.gallery || []) trackRef(u, "services", `services:${s.id}:gallery`);
  }
  const { data: projRef } = await supabase
    .from("projects")
    .select("id, cover_image, gallery, before_images, after_images");
  for (const p of projRef || []) {
    trackRef(p.cover_image, "projects", `projects:${p.id}:cover_image`);
    for (const col of ["gallery", "before_images", "after_images"]) {
      for (const u of p[col] || []) trackRef(u, "projects", `projects:${p.id}:${col}`);
    }
  }
  const { data: woRef } = await supabase.from("work_orders").select("id, completion_photos");
  for (const w of woRef || []) {
    for (const u of w.completion_photos || []) {
      trackRef(u, "work_orders", `work_orders:${w.id}:completion_photos`);
    }
  }
  const { data: expRef } = await supabase.from("expenses").select("id, receipt_url");
  for (const e of expRef || []) {
    trackRef(e.receipt_url, "expenses", `expenses:${e.id}:receipt_url`);
  }
  const { data: profRef } = await supabase.from("profiles").select("id, avatar_url");
  for (const pr of profRef || []) {
    trackRef(pr.avatar_url, "profiles", `profiles:${pr.id}:avatar_url`);
  }

  const candidateUrls = new Set(candidates.map((c) => c.legacyPublicUrl).filter(Boolean));
  const unreferencedCount = candidates.filter((c) => c.legacyPublicUrl && !referencedUrls.has(c.legacyPublicUrl)).length;
  const externalOrLocalRefs = Array.from(referencedUrls.keys()).filter((u) => !candidateUrls.has(u));

  const totalStorageBytes = candidates.reduce((acc, c) => acc + Number(c.sizeBytes || 0), 0);
  const migratableCount = candidates.filter(
    (c) => c.migrationStatus !== "verified" && c.migrationStatus !== "native_r2"
  ).length;

  return {
    candidates,
    bucketCount: (buckets || []).length,
    inventorySummary: {
      totalDiscoveredObjects: candidates.length,
      totalStorageBytes,
      totalStorageMegabytes: Number((totalStorageBytes / (1024 * 1024)).toFixed(2)),
      bucketCounts,
      bucketErrors,
      missingOrInaccessibleCount: missingOrInaccessibleObjects.length,
      missingOrInaccessibleSample: missingOrInaccessibleObjects.slice(0, 25),
      duplicateSummary: {
        exactChecksumDuplicateGroups: exactChecksumDuplicates.length,
        heuristicFilenameSizeDuplicateGroups: heuristicFilenameSizeDuplicates.length,
        heuristicDuplicateSample: heuristicFilenameSizeDuplicates.slice(0, 10),
      },
      databaseReferences: {
        distinctReferencedUrls: referencedUrls.size,
        referencesByTable: tableRefCounts,
        unreferencedStorageCandidates: unreferencedCount,
        localOrExternalOnlyReferences: externalOrLocalRefs.length,
        localOrExternalSample: externalOrLocalRefs.slice(0, 25),
      },
      estimatedR2Usage: {
        migratableObjectCount: migratableCount,
        estimatedPutObjectClassAOps: migratableCount,
        estimatedHeadObjectClassBOps: migratableCount,
        estimatedStorageMegabytes: Number((totalStorageBytes / (1024 * 1024)).toFixed(2)),
      },
    },
  };
}

async function main() {
  console.log(`=== TECHNOVOLT R2 MEDIA MIGRATION (${dryRun ? "DRY-RUN MODE" : "LIVE EXECUTION"}) ===`);
  const { candidates, bucketCount, inventorySummary } = await discoverCandidates();
  console.log(`Discovered ${candidates.length} media candidate(s) across ${bucketCount} Supabase bucket(s).`);
  console.log("Inventory Summary:", JSON.stringify(inventorySummary, null, 2));

  const r2Config = dryRun ? null : getR2Config();

  const report = await migrateMediaBatch(
    candidates,
    {
      downloadFromSupabase: async (bucket, storagePath) => {
        const { data, error } = await supabase.storage.from(bucket).download(storagePath);
        if (error || !data) {
          throw new Error(`Supabase download failed (${bucket}/${storagePath}): ${error?.message || "empty"}`);
        }
        return Buffer.from(await data.arrayBuffer());
      },
      uploadToR2: async (params) => {
        return putR2Object(params, { config: r2Config });
      },
      headR2Object: async (objectKey) => {
        return headR2Object(objectKey, { config: r2Config });
      },
      findVerifiedByChecksum: async (checksumHex) => {
        const { data } = await supabase
          .from("media_assets")
          .select("id, object_key, public_url, file_url")
          .eq("checksum_sha256", checksumHex)
          .in("migration_status", ["verified", "native_r2"])
          .is("deleted_at", null)
          .limit(1)
          .maybeSingle();
        if (!data) return null;
        return {
          id: data.id,
          objectKey: data.object_key,
          publicUrl: data.public_url || data.file_url,
        };
      },
      persistVerifiedAsset: async (params) => {
        const payload = {
          file_name: params.originalFilename,
          original_filename: params.originalFilename,
          file_path: params.objectKey || params.storagePath,
          object_key: params.objectKey,
          file_url: params.publicUrl,
          public_url: params.publicUrl,
          file_type: params.mimeType.startsWith("video/")
            ? "video"
            : params.mimeType === "application/pdf"
            ? "document"
            : "image",
          mime_type: params.mimeType,
          file_size: params.sizeBytes,
          size_bytes: params.sizeBytes,
          folder: params.folder,
          category: params.folder,
          storage_provider: "r2",
          migration_status: "verified",
          legacy_bucket: params.bucket,
          legacy_storage_path: params.storagePath,
          legacy_public_url: params.legacyPublicUrl,
          checksum_sha256: params.checksumSha256,
          migrated_at: new Date().toISOString(),
          is_public: params.bucket === "media",
        };

        if (params.id) {
          const { error } = await supabase.from("media_assets").update(payload).eq("id", params.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("media_assets").insert(payload);
          if (error) throw error;
        }
      },
      markAssetFailed: async (params) => {
        if (!params.id) return;
        await supabase
          .from("media_assets")
          .update({
            migration_status: "failed",
            file_url: params.legacyPublicUrl,
            public_url: params.legacyPublicUrl,
            storage_provider: "supabase",
          })
          .eq("id", params.id);
      },
      updateUrlReferences: replaceUrlInDomainTables,
    },
    { dryRun, batchSize, offset }
  );

  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error("Migration failed:", err?.message || err);
  process.exit(1);
});
