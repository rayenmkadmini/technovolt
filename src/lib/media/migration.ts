import crypto from "node:crypto";
import {
  computeSha256Hex,
  generateSafeObjectKey,
  sanitizeMediaFolder,
  sanitizeOriginalFilename,
} from "../storage/validation.ts";

export type MigrationStatus =
  | "legacy"
  | "pending"
  | "verified"
  | "failed"
  | "skipped"
  | "native_r2"
  | "rolled_back";

export interface LegacyMediaCandidate {
  id?: string;
  bucket: string;
  storagePath: string;
  legacyPublicUrl: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes?: number | null;
  folder?: string;
  migrationStatus?: MigrationStatus;
  checksumSha256?: string | null;
  objectKey?: string | null;
  publicUrl?: string | null;
}

export interface MigrationItemOutcome {
  id?: string;
  bucket: string;
  storagePath: string;
  legacyPublicUrl: string;
  objectKey?: string;
  publicUrl?: string;
  checksumSha256?: string;
  sizeBytes?: number;
  status: "dry_run_eligible" | "verified" | "skipped" | "failed" | "deduplicated";
  reason?: string;
}

export interface MigrationReport {
  mode: "dry_run" | "execute";
  startedAt: string;
  finishedAt: string;
  totalDiscovered: number;
  eligibleCount: number;
  migratedVerifiedCount: number;
  deduplicatedCount: number;
  skippedCount: number;
  failedCount: number;
  missingCount: number;
  invalidCount: number;
  estimatedBytes: number;
  estimatedMegabytes: number;
  estimatedBatches: number;
  estimatedDurationSeconds: number;
  outcomes: MigrationItemOutcome[];
}

function isTransientError(err: unknown): boolean {
  const anyErr = err as { statusCode?: number; $metadata?: { httpStatusCode?: number }; name?: string; code?: string; message?: string };
  const status = anyErr?.statusCode ?? anyErr?.$metadata?.httpStatusCode;
  if (status === 429 || (typeof status === "number" && status >= 500)) {
    return true;
  }
  const msg = (anyErr?.message || "").toLowerCase();
  return (
    anyErr?.name === "TimeoutError" ||
    anyErr?.name === "AbortError" ||
    msg.includes("rate limit") ||
    msg.includes("429") ||
    msg.includes("timeout") ||
    msg.includes("econnreset") ||
    msg.includes("etimedout")
  );
}

async function withTransientRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  baseDelayMs: number = 50
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= maxRetries || !isTransientError(err)) {
        throw err;
      }
      const delay = baseDelayMs * Math.pow(2, attempt);
      attempt += 1;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

export interface MigrationAdapters {
  downloadFromSupabase: (bucket: string, path: string) => Promise<Buffer>;
  uploadToR2: (params: {
    objectKey: string;
    body: Buffer;
    contentType: string;
    originalFilename: string;
    checksumSha256Base64: string;
    metadata: Record<string, string>;
  }) => Promise<{ eTag?: string; publicUrl: string }>;
  headR2Object: (objectKey: string) => Promise<{
    exists: boolean;
    contentLength?: number;
    eTag?: string;
  }>;
  findVerifiedByChecksum: (
    checksumHex: string
  ) => Promise<{ id: string; objectKey?: string | null; publicUrl: string } | null>;
  persistVerifiedAsset: (params: {
    id?: string;
    bucket: string;
    storagePath: string;
    legacyPublicUrl: string;
    objectKey: string | null;
    publicUrl: string;
    originalFilename: string;
    mimeType: string;
    sizeBytes: number;
    checksumSha256: string;
    folder: string;
  }) => Promise<void>;
  markAssetFailed: (params: {
    id?: string;
    bucket: string;
    storagePath: string;
    legacyPublicUrl: string;
    reason: string;
  }) => Promise<void>;
  updateUrlReferences: (legacyUrl: string, newUrl: string) => Promise<void>;
}

const MIME_EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/svg+xml": "svg",
  "image/gif": "gif",
  "application/pdf": "pdf",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

function inferExtension(filename: string, mimeType: string): string {
  const fromName = filename.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (fromName && fromName.length <= 5) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }
  return MIME_EXT_MAP[(mimeType || "").toLowerCase()] || "bin";
}

/**
 * Resumable, batch-capable, checksum-verified legacy media migration engine.
 * Defaults strictly to `dryRun: true` unless explicitly invoked with `dryRun: false`.
 */
export async function migrateMediaBatch(
  candidates: LegacyMediaCandidate[],
  adapters: MigrationAdapters,
  options: {
    dryRun?: boolean;
    batchSize?: number;
    offset?: number;
  } = {}
): Promise<MigrationReport> {
  const dryRun = options.dryRun !== false; // Default MUST be DRY RUN
  const batchSize = Math.max(1, options.batchSize ?? candidates.length ?? 25);
  const offset = Math.max(0, options.offset ?? 0);
  const startedAt = new Date().toISOString();

  const slice = candidates.slice(offset, offset + batchSize);
  const outcomes: MigrationItemOutcome[] = [];

  let eligibleCount = 0;
  let migratedVerifiedCount = 0;
  let deduplicatedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  let missingCount = 0;
  let invalidCount = 0;
  let estimatedBytes = 0;

  for (const item of slice) {
    // 1. Skip already verified or native R2 records safely (resumable behavior)
    if (item.migrationStatus === "verified" || item.migrationStatus === "native_r2") {
      skippedCount += 1;
      outcomes.push({
        id: item.id,
        bucket: item.bucket,
        storagePath: item.storagePath,
        legacyPublicUrl: item.legacyPublicUrl,
        objectKey: item.objectKey || undefined,
        publicUrl: item.publicUrl || undefined,
        status: "skipped",
        reason: "already_verified",
      });
      continue;
    }

    if (!item.storagePath || !item.legacyPublicUrl) {
      missingCount += 1;
      skippedCount += 1;
      outcomes.push({
        id: item.id,
        bucket: item.bucket,
        storagePath: item.storagePath,
        legacyPublicUrl: item.legacyPublicUrl,
        status: "skipped",
        reason: "missing_legacy_path_or_url",
      });
      continue;
    }

    eligibleCount += 1;
    if (typeof item.sizeBytes === "number" && Number.isFinite(item.sizeBytes) && item.sizeBytes > 0) {
      estimatedBytes += item.sizeBytes;
    }
    if (typeof item.sizeBytes === "number" && item.sizeBytes > 50 * 1024 * 1024) {
      invalidCount += 1;
    }
    const folder = sanitizeMediaFolder(item.folder || item.storagePath.split("/")[0] || "general");
    const safeFilename = sanitizeOriginalFilename(
      item.originalFilename || item.storagePath.split("/").pop() || "asset"
    );
    const ext = inferExtension(safeFilename, item.mimeType);
    const plannedKey = generateSafeObjectKey({
      folder,
      extension: ext,
      prefix: item.bucket === "media" ? "media" : `legacy/${item.bucket}`,
    });

    // 2. Dry-run preview mode: no writes to R2 or DB
    if (dryRun) {
      outcomes.push({
        id: item.id,
        bucket: item.bucket,
        storagePath: item.storagePath,
        legacyPublicUrl: item.legacyPublicUrl,
        objectKey: plannedKey,
        sizeBytes: item.sizeBytes ?? undefined,
        status: "dry_run_eligible",
      });
      continue;
    }

    // 3. Execute verified migration for this item
    try {
      const buffer = await withTransientRetry(() =>
        adapters.downloadFromSupabase(item.bucket, item.storagePath)
      );
      if (!buffer || buffer.byteLength === 0) {
        invalidCount += 1;
        throw new Error("Downloaded legacy file is empty.");
      }

      const checksumHex = computeSha256Hex(buffer);
      const checksumBase64 = crypto.createHash("sha256").update(buffer).digest("base64");
      const md5Hex = crypto.createHash("md5").update(buffer).digest("hex");

      // Avoid duplicate uploads when identical binary already verified in R2
      const existingByChecksum = await adapters.findVerifiedByChecksum(checksumHex);
      if (existingByChecksum) {
        await adapters.persistVerifiedAsset({
          id: item.id,
          bucket: item.bucket,
          storagePath: item.storagePath,
          legacyPublicUrl: item.legacyPublicUrl,
          objectKey: null,
          publicUrl: existingByChecksum.publicUrl,
          originalFilename: safeFilename,
          mimeType: item.mimeType || "application/octet-stream",
          sizeBytes: buffer.byteLength,
          checksumSha256: checksumHex,
          folder,
        });
        await adapters.updateUrlReferences(item.legacyPublicUrl, existingByChecksum.publicUrl);

        deduplicatedCount += 1;
        migratedVerifiedCount += 1;
        outcomes.push({
          id: item.id,
          bucket: item.bucket,
          storagePath: item.storagePath,
          legacyPublicUrl: item.legacyPublicUrl,
          objectKey: existingByChecksum.objectKey || undefined,
          publicUrl: existingByChecksum.publicUrl,
          checksumSha256: checksumHex,
          sizeBytes: buffer.byteLength,
          status: "deduplicated",
          reason: "reused_verified_r2_object_by_sha256",
        });
        continue;
      }

      const uploaded = await withTransientRetry(() =>
        adapters.uploadToR2({
          objectKey: plannedKey,
          body: buffer,
          contentType: item.mimeType || "application/octet-stream",
          originalFilename: safeFilename,
          checksumSha256Base64: checksumBase64,
          metadata: {
            "legacy-bucket": item.bucket,
            "legacy-storage-path": item.storagePath,
          },
        })
      );

      const head = await withTransientRetry(() => adapters.headR2Object(plannedKey));
      if (!head.exists) {
        throw new Error("R2 verification failed: uploaded object not found.");
      }
      if (typeof head.contentLength === "number" && head.contentLength !== buffer.byteLength) {
        throw new Error(
          `R2 content length mismatch: expected ${buffer.byteLength}, got ${head.contentLength}.`
        );
      }
      if (head.eTag && !head.eTag.includes("-") && head.eTag.toLowerCase() !== md5Hex) {
        throw new Error(`R2 ETag/MD5 mismatch: expected ${md5Hex}, got ${head.eTag}.`);
      }

      // Only after verification, update DB metadata & references (keeping legacy fields intact)
      await adapters.persistVerifiedAsset({
        id: item.id,
        bucket: item.bucket,
        storagePath: item.storagePath,
        legacyPublicUrl: item.legacyPublicUrl,
        objectKey: plannedKey,
        publicUrl: uploaded.publicUrl,
        originalFilename: safeFilename,
        mimeType: item.mimeType || "application/octet-stream",
        sizeBytes: buffer.byteLength,
        checksumSha256: checksumHex,
        folder,
      });
      await adapters.updateUrlReferences(item.legacyPublicUrl, uploaded.publicUrl);

      migratedVerifiedCount += 1;
      outcomes.push({
        id: item.id,
        bucket: item.bucket,
        storagePath: item.storagePath,
        legacyPublicUrl: item.legacyPublicUrl,
        objectKey: plannedKey,
        publicUrl: uploaded.publicUrl,
        checksumSha256: checksumHex,
        sizeBytes: buffer.byteLength,
        status: "verified",
      });
    } catch (err: any) {
      const reason = err?.message || "Unknown migration error";
      failedCount += 1;
      // Leave legacy URL active in DB
      await adapters
        .markAssetFailed({
          id: item.id,
          bucket: item.bucket,
          storagePath: item.storagePath,
          legacyPublicUrl: item.legacyPublicUrl,
          reason,
        })
        .catch(() => {});

      outcomes.push({
        id: item.id,
        bucket: item.bucket,
        storagePath: item.storagePath,
        legacyPublicUrl: item.legacyPublicUrl,
        status: "failed",
        reason,
      });
    }
  }

  const effectiveBatchSize = Math.max(1, Math.min(batchSize, 25));
  const estimatedBatches = eligibleCount > 0 ? Math.ceil(eligibleCount / effectiveBatchSize) : 0;
  const estimatedDurationSeconds = Math.ceil(eligibleCount * 0.6);

  return {
    mode: dryRun ? "dry_run" : "execute",
    startedAt,
    finishedAt: new Date().toISOString(),
    totalDiscovered: candidates.length,
    eligibleCount,
    migratedVerifiedCount,
    deduplicatedCount,
    skippedCount,
    failedCount,
    missingCount,
    invalidCount,
    estimatedBytes,
    estimatedMegabytes: Math.round((estimatedBytes / (1024 * 1024)) * 100) / 100,
    estimatedBatches,
    estimatedDurationSeconds,
    outcomes,
  };
}

export interface RollbackRecord {
  id: string;
  publicUrl: string;
  legacyPublicUrl: string;
  legacyStoragePath?: string | null;
  migrationStatus: string;
}

export interface RollbackResult {
  mode: "dry_run" | "execute";
  totalCandidates: number;
  restoredCount: number;
  skippedCount: number;
  failedCount: number;
  details: Array<{ id: string; status: "dry_run" | "restored" | "skipped" | "failed"; reason?: string }>;
}

/**
 * Non-destructive rollback: restores legacy Supabase URLs in metadata and entity tables
 * while keeping both R2 and Supabase objects intact.
 */
export async function rollbackMigratedMedia(
  records: RollbackRecord[],
  adapters: {
    restoreAssetMetadata: (record: RollbackRecord) => Promise<void>;
    restoreUrlReferences: (r2Url: string, legacyUrl: string) => Promise<void>;
  },
  options: { dryRun?: boolean } = {}
): Promise<RollbackResult> {
  const dryRun = options.dryRun !== false;
  let restoredCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  const details: RollbackResult["details"] = [];

  for (const rec of records) {
    if (!rec.legacyPublicUrl || rec.migrationStatus === "native_r2") {
      skippedCount += 1;
      details.push({
        id: rec.id,
        status: "skipped",
        reason: rec.migrationStatus === "native_r2" ? "native_r2_no_legacy" : "missing_legacy_url",
      });
      continue;
    }

    if (dryRun) {
      restoredCount += 1;
      details.push({ id: rec.id, status: "dry_run" });
      continue;
    }

    try {
      await adapters.restoreAssetMetadata(rec);
      if (rec.publicUrl && rec.publicUrl !== rec.legacyPublicUrl) {
        await adapters.restoreUrlReferences(rec.publicUrl, rec.legacyPublicUrl);
      }
      restoredCount += 1;
      details.push({ id: rec.id, status: "restored" });
    } catch (err: any) {
      failedCount += 1;
      details.push({
        id: rec.id,
        status: "failed",
        reason: err?.message || "Rollback error",
      });
    }
  }

  return {
    mode: dryRun ? "dry_run" : "execute",
    totalCandidates: records.length,
    restoredCount,
    skippedCount,
    failedCount,
    details,
  };
}
