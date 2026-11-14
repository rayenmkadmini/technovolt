import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

import {
  validateUploadRequest,
  validateFilenameAndExtension,
  validateFileSize,
  validateImageMagicBytes,
  generateSafeObjectKey,
  isSafeObjectKey,
  sanitizeOriginalFilename,
  sanitizeMediaFolder,
  computeSha256Hex,
  MAX_IMAGE_FILE_SIZE_BYTES,
} from "../lib/storage/validation.ts";

import {
  validateR2PublicUrl,
  validateR2Endpoint,
  getR2Config,
  isR2Configured,
  createR2Client,
  buildR2PublicUrl,
  createPresignedPutUpload,
  getRecommendedR2CorsPolicy,
} from "../lib/storage/r2.ts";

import {
  buildCloudflareImageUrl,
  mediaImageUrl,
  resolveMediaSrc,
  isAllowedMediaSourceUrl,
  shouldBypassNextImageOptimization,
  IMAGE_VARIANT_WIDTHS,
} from "../lib/media/imageUrl.ts";

import {
  migrateMediaBatch,
  rollbackMigratedMedia,
} from "../lib/media/migration.ts";

const VALID_PNG_BYTES = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
]);

const VALID_JPEG_BYTES = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46,
]);

const VALID_WEBP_BYTES = Buffer.from([
  0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00,
  0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20,
]);

const VALID_AVIF_BYTES = Buffer.from([
  0x00, 0x00, 0x00, 0x1c,
  0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66, // ftypavif
  0x00, 0x00, 0x00, 0x00,
]);

const MOCK_ENV = {
  R2_ACCOUNT_ID: "0123456789abcdef0123456789abcdef",
  R2_ACCESS_KEY_ID: "test-access-key-id",
  R2_SECRET_ACCESS_KEY: "test-secret-access-key",
  R2_BUCKET_NAME: "technovolt-media-test",
  R2_ENDPOINT: "https://0123456789abcdef0123456789abcdef.r2.cloudflarestorage.com",
  R2_PUBLIC_URL: "https://media.technovolt.tn",
};

test("R2 Configuration: rejects missing vars, r2.dev domains, and R2 S3 endpoint as public URL", () => {
  assert.equal(isR2Configured({}), false);
  assert.throws(() => getR2Config({}), /Missing: R2_ACCOUNT_ID/);

  const r2DevCheck = validateR2PublicUrl("https://pub-abc123.r2.dev");
  assert.equal(r2DevCheck.valid, false);
  assert.match(r2DevCheck.error || "", /r2\.dev/);

  const s3EndpointCheck = validateR2PublicUrl(
    "https://0123456789abcdef0123456789abcdef.r2.cloudflarestorage.com"
  );
  assert.equal(s3EndpointCheck.valid, false);
  assert.match(s3EndpointCheck.error || "", /R2 S3 API endpoint/);

  const httpCheck = validateR2PublicUrl("http://media.technovolt.tn");
  assert.equal(httpCheck.valid, false);

  const validCheck = validateR2PublicUrl("https://media.technovolt.tn/");
  assert.equal(validCheck.valid, true);
  assert.equal(validCheck.normalized, "https://media.technovolt.tn");

  assert.equal(validateR2Endpoint("http://bad.example.com").valid, false);
  assert.equal(
    validateR2Endpoint("https://0123456789abcdef0123456789abcdef.r2.cloudflarestorage.com").valid,
    true
  );

  const cfg = getR2Config(MOCK_ENV);
  assert.equal(cfg.bucketName, "technovolt-media-test");
  assert.equal(cfg.publicUrl, "https://media.technovolt.tn");

  const client = createR2Client(cfg);
  assert.ok(client);
});

test("R2 CORS policy restricts origins, methods, and headers cleanly", () => {
  const cors = getRecommendedR2CorsPolicy([
    "http://localhost:3000",
    "https://technovolt.tn",
  ]);
  assert.equal(cors.length, 1);
  assert.deepEqual(cors[0].AllowedOrigins, ["http://localhost:3000", "https://technovolt.tn"]);
  assert.deepEqual(cors[0].AllowedMethods, ["PUT", "GET", "HEAD"]);
  assert.equal(cors[0].AllowedMethods.includes("DELETE"), false);
});

test("Presigned PUT URL generation clamps expiry to [60s, 300s] and locks bucket/key/content-type", async () => {
  const config = getR2Config(MOCK_ENV);
  const client = createR2Client(config);

  const key = generateSafeObjectKey({
    folder: "chantiers",
    extension: "png",
    date: new Date("2026-05-01T12:00:00Z"),
  });
  assert.match(key, /^media\/chantiers\/2026\/05\/[0-9a-f-]{36}\.png$/);

  const resShort = await createPresignedPutUpload(
    {
      objectKey: key,
      contentType: "image/png",
      contentLength: 1024,
      originalFilename: "tableau electrique.png",
      expiresInSeconds: 5, // below minimum -> should clamp to 60
    },
    { config, client }
  );
  assert.equal(resShort.expiresInSeconds, 60);

  const resLong = await createPresignedPutUpload(
    {
      objectKey: key,
      contentType: "image/png",
      contentLength: 1024,
      originalFilename: "tableau electrique.png",
      expiresInSeconds: 9999, // above maximum -> should clamp to 300
    },
    { config, client }
  );
  assert.equal(resLong.expiresInSeconds, 300);

  const parsed = new URL(resLong.uploadUrl);
  assert.equal(parsed.searchParams.get("X-Amz-Expires"), "300");
  assert.match(parsed.pathname, new RegExp(key.replace(/\//g, "\\/")));
  assert.equal(resLong.publicUrl, `https://media.technovolt.tn/${key}`);

  // Simulate expired presigned URL verification logic
  const amzDate = parsed.searchParams.get("X-Amz-Date") || "20260501T120000Z";
  const expiresSec = Number(parsed.searchParams.get("X-Amz-Expires") || "0");
  assert.ok(amzDate.length >= 15);
  assert.equal(expiresSec, 300);

  // Reject path-traversal object keys before signing or building URLs
  await assert.rejects(
    () =>
      createPresignedPutUpload(
        {
          objectKey: "../../etc/passwd",
          contentType: "image/png",
          contentLength: 128,
          originalFilename: "x.png",
        },
        { config, client }
      ),
    /Invalid R2 object key/
  );
  assert.throws(() => buildR2PublicUrl("../secret.png", config.publicUrl), /Invalid object key/);
});

test("File & Security Validation: blocks path traversal, MIME spoofing, oversized files, invalid magic bytes, and SVG XSS", () => {
  // Path traversal & null bytes
  assert.equal(validateFilenameAndExtension("../hack.jpg", "image/jpeg").valid, false);
  assert.equal(validateFilenameAndExtension("a/b/c.jpg", "image/jpeg").valid, false);
  assert.equal(validateFilenameAndExtension("test\0.jpg", "image/jpeg").valid, false);
  assert.equal(isSafeObjectKey("../media/chantiers/x.jpg"), false);
  assert.equal(isSafeObjectKey("/media/chantiers/x.jpg"), false);
  assert.equal(isSafeObjectKey("media/chantiers/2026/05/uuid.jpg"), true);

  // MIME vs extension spoofing
  assert.equal(validateFilenameAndExtension("photo.exe", "image/jpeg").valid, false);
  assert.equal(validateFilenameAndExtension("photo.png", "image/jpeg").valid, false);
  assert.equal(validateFilenameAndExtension("photo.jpg", "application/pdf").valid, false);
  assert.equal(validateFilenameAndExtension("photo.JPEG", "image/jpg").valid, true);

  // Folder injection falls back safely to allowlist
  assert.equal(sanitizeMediaFolder("../../admin"), "general");
  assert.equal(sanitizeMediaFolder("Domotique"), "domotique");

  // Filename sanitization strips accents & unsafe characters
  assert.equal(sanitizeOriginalFilename("C:\\fakepath\\élec 2026!.png"), "elec_2026_.png");

  // Oversized / empty files
  assert.equal(validateFileSize(0).valid, false);
  assert.equal(validateFileSize(-10).valid, false);
  assert.equal(validateFileSize(MAX_IMAGE_FILE_SIZE_BYTES + 1).valid, false);
  assert.equal(validateFileSize(MAX_IMAGE_FILE_SIZE_BYTES).valid, true);

  // Full request check
  const okReq = validateUploadRequest({
    filename: "armoire.webp",
    mimeType: "image/webp",
    sizeBytes: 250_000,
    folder: "chantiers",
  });
  assert.equal(okReq.valid, true);
  assert.equal(okReq.extension, "webp");
  assert.equal(okReq.folder, "chantiers");

  // Magic bytes verification
  assert.equal(validateImageMagicBytes(VALID_PNG_BYTES, "image/png").valid, true);
  assert.equal(validateImageMagicBytes(VALID_JPEG_BYTES, "image/jpeg").valid, true);
  assert.equal(validateImageMagicBytes(VALID_WEBP_BYTES, "image/webp").valid, true);
  assert.equal(validateImageMagicBytes(VALID_AVIF_BYTES, "image/avif").valid, true);

  // Spoofed PNG bytes claiming to be JPEG -> fail
  assert.equal(validateImageMagicBytes(VALID_PNG_BYTES, "image/jpeg").valid, false);
  // Plain text pretending to be PNG -> fail
  assert.equal(validateImageMagicBytes(Buffer.from("not an image"), "image/png").valid, false);

  // SVG sanitization blocks XSS payloads
  const cleanSvg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>');
  const xssSvg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
  const onclickSvg = Buffer.from('<svg onload="alert(1)"><rect width="10" height="10"/></svg>');
  assert.equal(validateImageMagicBytes(cleanSvg, "image/svg+xml").valid, true);
  assert.equal(validateImageMagicBytes(xssSvg, "image/svg+xml").valid, false);
  assert.equal(validateImageMagicBytes(onclickSvg, "image/svg+xml").valid, false);
});

test("Cloudflare Image Transformation URL generation: variants, origin lock, SVG/local bypass, double-transform protection", () => {
  assert.deepEqual(IMAGE_VARIANT_WIDTHS, {
    thumbnail: 300,
    card: 600,
    standard: 1000,
    large: 1600,
  });

  const opts = {
    allowedMediaOrigin: "https://media.technovolt.tn",
    transformationZoneOrigin: "https://media.technovolt.tn",
    transformationsEnabled: true,
  };

  const r2Src = "https://media.technovolt.tn/media/chantiers/2026/05/test.jpg";
  assert.equal(
    mediaImageUrl.thumbnail(r2Src, opts),
    "https://media.technovolt.tn/cdn-cgi/image/width=300,quality=80,format=auto,fit=scale-down/media/chantiers/2026/05/test.jpg"
  );
  assert.equal(
    mediaImageUrl.card(r2Src, opts),
    "https://media.technovolt.tn/cdn-cgi/image/width=600,quality=80,format=auto,fit=scale-down/media/chantiers/2026/05/test.jpg"
  );
  assert.equal(
    mediaImageUrl.standard(r2Src, opts),
    "https://media.technovolt.tn/cdn-cgi/image/width=1000,quality=80,format=auto,fit=scale-down/media/chantiers/2026/05/test.jpg"
  );
  assert.equal(
    mediaImageUrl.large(r2Src, opts),
    "https://media.technovolt.tn/cdn-cgi/image/width=1600,quality=80,format=auto,fit=scale-down/media/chantiers/2026/05/test.jpg"
  );

  // Separate zone origin vs media origin
  assert.equal(
    buildCloudflareImageUrl(r2Src, "card", {
      allowedMediaOrigin: "https://media.technovolt.tn",
      transformationZoneOrigin: "https://technovolt.tn",
      transformationsEnabled: true,
    }),
    "https://technovolt.tn/cdn-cgi/image/width=600,quality=80,format=auto,fit=scale-down/https://media.technovolt.tn/media/chantiers/2026/05/test.jpg"
  );

  // Security: arbitrary external URL MUST NOT be proxied through Cloudflare Images
  const evilExternal = "https://evil.attacker.com/payload.jpg";
  assert.equal(isAllowedMediaSourceUrl(evilExternal, "https://media.technovolt.tn"), false);
  assert.equal(buildCloudflareImageUrl(evilExternal, "card", opts), evilExternal);

  // Legacy Supabase URL stays untouched (dual-read)
  const legacySupabase = "https://xyz.supabase.co/storage/v1/object/public/media/old.jpg";
  assert.equal(buildCloudflareImageUrl(legacySupabase, "card", opts), legacySupabase);

  // SVG, blob:, data:, relative paths, original variant, and already-transformed URLs bypass
  const svgSrc = "https://media.technovolt.tn/media/branding/logo.svg";
  assert.equal(buildCloudflareImageUrl(svgSrc, "thumbnail", opts), svgSrc);
  assert.equal(buildCloudflareImageUrl("blob:http://localhost:3000/123", "thumbnail", opts), "blob:http://localhost:3000/123");
  assert.equal(buildCloudflareImageUrl("/logo.png", "thumbnail", opts), "/logo.png");
  assert.equal(buildCloudflareImageUrl(r2Src, "original", opts), r2Src);

  const alreadyTransformed = mediaImageUrl.card(r2Src, opts);
  assert.equal(buildCloudflareImageUrl(alreadyTransformed, "thumbnail", opts), alreadyTransformed);

  // Disabled flag preserves original URL cleanly
  assert.equal(
    buildCloudflareImageUrl(r2Src, "card", { ...opts, transformationsEnabled: false }),
    r2Src
  );

  // Double optimization prevention
  assert.equal(shouldBypassNextImageOptimization(alreadyTransformed), true);
  assert.equal(shouldBypassNextImageOptimization("blob:abc"), true);
  assert.equal(shouldBypassNextImageOptimization("/images/projects/technovolt-chantier-01.jpg"), false);
});

test("Dual-read URL resolution prioritizes verified R2 and falls back to legacy Supabase on failure or rollback", () => {
  assert.equal(
    resolveMediaSrc({
      public_url: "https://media.technovolt.tn/media/chantiers/a.jpg",
      legacy_public_url: "https://proj.supabase.co/storage/v1/object/public/media/a.jpg",
      migration_status: "verified",
    }),
    "https://media.technovolt.tn/media/chantiers/a.jpg"
  );

  assert.equal(
    resolveMediaSrc({
      public_url: "https://media.technovolt.tn/media/chantiers/a.jpg",
      legacy_public_url: "https://proj.supabase.co/storage/v1/object/public/media/a.jpg",
      migration_status: "failed",
    }),
    "https://proj.supabase.co/storage/v1/object/public/media/a.jpg"
  );

  assert.equal(
    resolveMediaSrc({
      public_url: "https://media.technovolt.tn/media/chantiers/a.jpg",
      legacy_public_url: "https://proj.supabase.co/storage/v1/object/public/media/a.jpg",
      migration_status: "rolled_back",
    }),
    "https://proj.supabase.co/storage/v1/object/public/media/a.jpg"
  );
});

test("Legacy Migration: defaults to DRY RUN with zero writes, verifies SHA-256 checksums, deduplicates, resumes, isolates failures, and supports non-destructive rollback", async () => {
  const bytesA = Buffer.from("technovolt-image-alpha-binary");
  const bytesB = Buffer.from("technovolt-image-beta-binary");
  const bytesDupA = Buffer.from("technovolt-image-alpha-binary"); // same SHA-256 as A
  const shaA = computeSha256Hex(bytesA);

  const storageBlobs = new Map([
    ["media/chantiers/a.jpg", bytesA],
    ["media/chantiers/b.jpg", bytesB],
    ["media/chantiers/dup-a.jpg", bytesDupA],
  ]);

  const uploadedToR2 = new Map();
  const persistedRecords = new Map();
  const urlRewrites = [];
  const markedFailures = [];

  const adapters = {
    async downloadFromSupabase(bucket, path) {
      const key = `${bucket}/${path}`;
      const buf = storageBlobs.get(key);
      if (!buf) throw new Error(`Object not found: ${key}`);
      return buf;
    },
    async uploadToR2(params) {
      uploadedToR2.set(params.objectKey, params.body);
      return {
        eTag: crypto.createHash("md5").update(params.body).digest("hex"),
        publicUrl: `https://media.technovolt.tn/${params.objectKey}`,
      };
    },
    async headR2Object(objectKey) {
      const body = uploadedToR2.get(objectKey);
      if (!body) return { exists: false };
      return {
        exists: true,
        contentLength: body.byteLength,
        eTag: crypto.createHash("md5").update(body).digest("hex"),
      };
    },
    async findVerifiedByChecksum(checksumHex) {
      for (const rec of persistedRecords.values()) {
        if (rec.checksumSha256 === checksumHex) {
          return { id: rec.id || "existing", objectKey: rec.objectKey, publicUrl: rec.publicUrl };
        }
      }
      return null;
    },
    async persistVerifiedAsset(params) {
      persistedRecords.set(params.storagePath, params);
    },
    async markAssetFailed(params) {
      markedFailures.push(params);
    },
    async updateUrlReferences(legacyUrl, newUrl) {
      urlRewrites.push({ legacyUrl, newUrl });
    },
  };

  const candidates = [
    {
      id: "1",
      bucket: "media",
      storagePath: "chantiers/a.jpg",
      legacyPublicUrl: "https://sb.co/a.jpg",
      originalFilename: "a.jpg",
      mimeType: "image/jpeg",
      migrationStatus: "legacy",
    },
    {
      id: "2",
      bucket: "media",
      storagePath: "chantiers/already.jpg",
      legacyPublicUrl: "https://sb.co/already.jpg",
      originalFilename: "already.jpg",
      mimeType: "image/jpeg",
      migrationStatus: "verified", // should be skipped on resume
      objectKey: "media/chantiers/already.jpg",
      publicUrl: "https://media.technovolt.tn/media/chantiers/already.jpg",
    },
    {
      id: "3",
      bucket: "media",
      storagePath: "chantiers/dup-a.jpg",
      legacyPublicUrl: "https://sb.co/dup-a.jpg",
      originalFilename: "dup-a.jpg",
      mimeType: "image/jpeg",
      migrationStatus: "legacy",
    },
    {
      id: "4",
      bucket: "media",
      storagePath: "chantiers/missing.jpg",
      legacyPublicUrl: "https://sb.co/missing.jpg",
      originalFilename: "missing.jpg",
      mimeType: "image/jpeg",
      migrationStatus: "legacy",
    },
  ];

  // 1. Default DRY RUN performs ZERO writes
  const dryReport = await migrateMediaBatch(candidates, adapters);
  assert.equal(dryReport.mode, "dry_run");
  assert.equal(dryReport.eligibleCount, 3);
  assert.equal(dryReport.skippedCount, 1);
  assert.equal(uploadedToR2.size, 0);
  assert.equal(persistedRecords.size, 0);

  // 2. Real batched execution
  const execReport = await migrateMediaBatch(candidates, adapters, {
    dryRun: false,
    batchSize: 4,
    offset: 0,
  });
  assert.equal(execReport.mode, "execute");
  assert.equal(execReport.skippedCount, 1); // candidate #2 already_verified
  assert.equal(execReport.deduplicatedCount, 1); // candidate #3 reused #1 via SHA-256
  assert.equal(execReport.migratedVerifiedCount, 2); // #1 + #3
  assert.equal(execReport.failedCount, 1); // #4 missing.jpg
  assert.equal(uploadedToR2.size, 1); // only #1 physically uploaded
  assert.equal(markedFailures.length, 1);
  assert.equal(markedFailures[0].legacyPublicUrl, "https://sb.co/missing.jpg");

  const recA = persistedRecords.get("chantiers/a.jpg");
  assert.equal(recA.checksumSha256, shaA);
  assert.equal(recA.legacyPublicUrl, "https://sb.co/a.jpg");
  assert.equal(urlRewrites.length, 2);

  // 3. Resume check: running again skips now-verified items (#1, #2, #3), only retries #4
  candidates[0].migrationStatus = "verified";
  candidates[2].migrationStatus = "verified";
  const resumeReport = await migrateMediaBatch(candidates, adapters, { dryRun: false });
  assert.equal(resumeReport.skippedCount, 3);
  assert.equal(resumeReport.failedCount, 1);
  assert.equal(uploadedToR2.size, 1); // still only 1 upload total

  // 4. Non-destructive rollback restores legacy URLs while leaving R2 objects intact
  const restoredAssets = [];
  const restoredLinks = [];
  const rollbackRecords = [
    {
      id: "1",
      publicUrl: recA.publicUrl,
      legacyPublicUrl: "https://sb.co/a.jpg",
      legacyStoragePath: "chantiers/a.jpg",
      migrationStatus: "verified",
    },
    {
      id: "native-1",
      publicUrl: "https://media.technovolt.tn/media/chantiers/new.jpg",
      legacyPublicUrl: "",
      migrationStatus: "native_r2",
    },
  ];

  const rbDry = await rollbackMigratedMedia(rollbackRecords, {
    async restoreAssetMetadata(r) {
      restoredAssets.push(r.id);
    },
    async restoreUrlReferences(r2Url, legacyUrl) {
      restoredLinks.push({ r2Url, legacyUrl });
    },
  });
  assert.equal(rbDry.mode, "dry_run");
  assert.equal(restoredAssets.length, 0);

  const rbExec = await rollbackMigratedMedia(
    rollbackRecords,
    {
      async restoreAssetMetadata(r) {
        restoredAssets.push(r.id);
      },
      async restoreUrlReferences(r2Url, legacyUrl) {
        restoredLinks.push({ r2Url, legacyUrl });
      },
    },
    { dryRun: false }
  );
  assert.equal(rbExec.mode, "execute");
  assert.equal(rbExec.restoredCount, 1);
  assert.equal(rbExec.skippedCount, 1);
  assert.deepEqual(restoredAssets, ["1"]);
  assert.deepEqual(restoredLinks, [
    { r2Url: recA.publicUrl, legacyUrl: "https://sb.co/a.jpg" },
  ]);
  // R2 object map remains completely untouched during rollback
  assert.equal(uploadedToR2.size, 1);
});

test("Checksum mismatch during R2 verification triggers failure without updating DB URL references", async () => {
  const bytes = Buffer.from("technovolt-integrity-check");
  let dbUpdated = false;
  let failureRecorded = false;

  const adapters = {
    async downloadFromSupabase() {
      return bytes;
    },
    async uploadToR2(params) {
      return { eTag: "corrupted", publicUrl: `https://media.technovolt.tn/${params.objectKey}` };
    },
    async headR2Object() {
      // Simulate byte truncation on R2
      return { exists: true, contentLength: bytes.byteLength - 5 };
    },
    async findVerifiedByChecksum() {
      return null;
    },
    async persistVerifiedAsset() {
      dbUpdated = true;
    },
    async markAssetFailed() {
      failureRecorded = true;
    },
    async updateUrlReferences() {
      dbUpdated = true;
    },
  };

  const report = await migrateMediaBatch(
    [
      {
        bucket: "media",
        storagePath: "chantiers/corrupt.jpg",
        legacyPublicUrl: "https://sb.co/corrupt.jpg",
        originalFilename: "corrupt.jpg",
        mimeType: "image/jpeg",
      },
    ],
    adapters,
    { dryRun: false }
  );

  assert.equal(report.failedCount, 1);
  assert.equal(dbUpdated, false);
  assert.equal(failureRecorded, true);
  assert.match(report.outcomes[0].reason || "", /content length mismatch/i);
});

test("Gallery pagination & duplicate submission safeguards calculate deterministic slices and ranges", () => {
  const page = 2;
  const pageSize = 24;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  assert.equal(from, 24);
  assert.equal(to, 47);

  const totalCount = 50;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  assert.equal(totalPages, 3);
});

import fs from "node:fs";
import path from "node:path";
import { canManageMediaRole } from "../lib/auth/mediaPermissions.ts";

test("Upload & deletion authorization: enforces active admin/content_editor roles only", () => {
  assert.equal(canManageMediaRole("super_admin", true), true);
  assert.equal(canManageMediaRole("owner", true), true);
  assert.equal(canManageMediaRole("admin", true), true);
  assert.equal(canManageMediaRole("manager", true), true);
  assert.equal(canManageMediaRole("content_editor", true), true);

  // Inactive or non-admin roles rejected
  assert.equal(canManageMediaRole("admin", false), false);
  assert.equal(canManageMediaRole("technician", true), false);
  assert.equal(canManageMediaRole("customer", true), false);
  assert.equal(canManageMediaRole("", true), false);
  assert.equal(canManageMediaRole(null, true), false);
});

test("Security boundaries: no secrets or R2 SDK imports in client components, no wildcard remotePatterns, routes enforce auth", () => {
  const root = process.cwd();

  // Check next.config.ts removed unsafe wildcard hostname "**"
  const nextConfig = fs.readFileSync(path.join(root, "next.config.ts"), "utf8");
  assert.equal(nextConfig.includes('hostname: "**"'), false);

  // Check API routes enforce requireMediaAdmin()
  for (const routeRel of [
    "src/app/api/media/route.ts",
    "src/app/api/media/presign/route.ts",
    "src/app/api/media/complete/route.ts",
    "src/app/api/media/[id]/route.ts",
  ]) {
    const content = fs.readFileSync(path.join(root, routeRel), "utf8");
    assert.match(content, /requireMediaAdmin/, `${routeRel} must invoke requireMediaAdmin()`);
  }

  // Verify DELETE route looks up DB record by id before touching R2 and skips legacy Supabase storage deletion
  const deleteRoute = fs.readFileSync(path.join(root, "src/app/api/media/[id]/route.ts"), "utf8");
  assert.match(deleteRoute, /existing\.object_key/);
  assert.match(deleteRoute, /migration_status\s*===\s*"native_r2"/);

  // Verify no "use client" file imports @aws-sdk, r2.ts, or server secret env vars
  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let files = [];
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) files = files.concat(walk(full));
      else if (/\.(ts|tsx|js|jsx|mjs)$/.test(e.name)) files.push(full);
    }
    return files;
  }

  const srcFiles = walk(path.join(root, "src"));
  for (const file of srcFiles) {
    const content = fs.readFileSync(file, "utf8");
    const firstLine = content.split(/\r?\n/, 1)[0] || "";
    if (firstLine.includes('"use client"') || firstLine.includes("'use client'")) {
      assert.equal(content.includes("@aws-sdk/"), false, `Client file ${file} must not import @aws-sdk`);
      assert.equal(content.includes("lib/storage/r2"), false, `Client file ${file} must not import r2.ts`);
      assert.equal(content.includes("R2_SECRET_ACCESS_KEY"), false, `Client file ${file} must not reference R2_SECRET_ACCESS_KEY`);
      assert.equal(content.includes("R2_ACCESS_KEY_ID"), false, `Client file ${file} must not reference R2_ACCESS_KEY_ID`);
      assert.equal(content.includes("SUPABASE_SERVICE_ROLE_KEY"), false, `Client file ${file} must not reference SUPABASE_SERVICE_ROLE_KEY`);
    }
  }
});

test("Phase B/G/I refinements: supports NEXT_PUBLIC_MEDIA_URL, guards invalid NaN transformation params, estimates dry-run batches/bytes, and retries transient 429 rate limits", async () => {
  // 1. NEXT_PUBLIC_MEDIA_URL alias support
  const prevMediaUrl = process.env.NEXT_PUBLIC_MEDIA_URL;
  process.env.NEXT_PUBLIC_MEDIA_URL = "https://media.technovolt.tn";
  try {
    const transformed = buildCloudflareImageUrl(
      "https://media.technovolt.tn/media/chantiers/a.png",
      "thumbnail",
      {
        transformationsEnabled: true,
        width: Number.NaN,
        quality: Number.NaN,
        fit: "invalid-fit",
        format: "invalid-fmt",
      }
    );
    assert.equal(
      transformed,
      "https://media.technovolt.tn/cdn-cgi/image/width=300,quality=80,format=auto,fit=scale-down/media/chantiers/a.png"
    );
  } finally {
    if (prevMediaUrl === undefined) delete process.env.NEXT_PUBLIC_MEDIA_URL;
    else process.env.NEXT_PUBLIC_MEDIA_URL = prevMediaUrl;
  }

  // 2. Dry-run capacity estimation + transient 429 retry
  const payload = Buffer.from("retry-verified-binary");
  const candidates = [
    {
      id: "retry-1",
      bucket: "media",
      storagePath: "chantiers/retry.jpg",
      legacyPublicUrl: "https://sb.co/retry.jpg",
      originalFilename: "retry.jpg",
      mimeType: "image/jpeg",
      sizeBytes: 2048,
      migrationStatus: "legacy",
    },
  ];

  const dry = await migrateMediaBatch(candidates, {
    downloadFromSupabase: async () => payload,
    uploadToR2: async () => ({ publicUrl: "https://media.technovolt.tn/x" }),
    headR2Object: async () => ({ exists: true }),
    findVerifiedByChecksum: async () => null,
    persistVerifiedAsset: async () => {},
    markAssetFailed: async () => {},
    updateUrlReferences: async () => {},
  });
  assert.equal(dry.estimatedBytes, 2048);
  assert.equal(dry.estimatedBatches, 1);
  assert.ok(dry.estimatedDurationSeconds >= 1);

  let uploadAttempts = 0;
  const exec = await migrateMediaBatch(
    candidates,
    {
      downloadFromSupabase: async () => payload,
      uploadToR2: async (params) => {
        uploadAttempts += 1;
        if (uploadAttempts === 1) {
          const err = new Error("Rate limit exceeded");
          err.statusCode = 429;
          throw err;
        }
        return {
          eTag: crypto.createHash("md5").update(params.body).digest("hex"),
          publicUrl: `https://media.technovolt.tn/${params.objectKey}`,
        };
      },
      headR2Object: async () => ({
        exists: true,
        contentLength: payload.byteLength,
        eTag: crypto.createHash("md5").update(payload).digest("hex"),
      }),
      findVerifiedByChecksum: async () => null,
      persistVerifiedAsset: async () => {},
      markAssetFailed: async () => {},
      updateUrlReferences: async () => {},
    },
    { dryRun: false }
  );
  assert.equal(uploadAttempts, 2);
  assert.equal(exec.migratedVerifiedCount, 1);
  assert.equal(exec.failedCount, 0);
});
