# TECHNOVOLT — FINAL TECHNICAL AUDIT (CLOUDFLARE R2 MEDIA MIGRATION)

**Date:** 2026-11-11  
**Baseline Commit:** `38e59ea` (`fix(admin): resolve audit issues, repair workflows and integrate Supabase persistence`)  
**Repository:** `d:\technovolt`  
**Audit Scope:** Phases A–N (Implementation Security, Credentials & Connectivity, Schema Safety, Legacy Discovery, Dry-Run, Image Optimization, Browser E2E Readiness, Rollback, Quality & Chatbot Pre-Existing Failures, Cost Review, Production Cutover Gate)

---

## 1. Phase A — Architecture & Security Audit Results

Every file in the R2 media pipeline was independently re-inspected against the current git diff (`git status --short`, `git diff --stat`):

| Check | Status | Evidence / File Reference |
|---|---|---|
| Server-only R2 isolation | PASS | `src/lib/storage/r2.ts` enforces `if (typeof window !== "undefined") throw ...`; unit test scans all `"use client"` files for `@aws-sdk/`, `lib/storage/r2`, `R2_*`, and `SUPABASE_SERVICE_ROLE_KEY`. |
| Short-lived presigned PUT URLs | PASS | `src/app/api/media/presign/route.ts` calls `createPresignedPutUpload(..., expiresInSeconds: 300)` clamped between `[60, 300]` seconds, locking bucket, UUID key, `Content-Type`, and `Content-Length`. |
| Custom HTTPS domain enforcement | PASS | `validateR2PublicUrl` in `src/lib/storage/r2.ts` rejects `http://`, `.r2.dev`, and `.r2.cloudflarestorage.com`. |
| Byte-level upload validation | PASS | `validateImageMagicBytes` (`src/lib/storage/validation.ts`) inspects PNG/JPEG/WebP/AVIF magic bytes and rejects SVGs containing `<script>`, `on*=` attributes, `javascript:`, or `<foreignObject>`; `complete/route.ts` verifies R2 bytes after presigned `PUT` and deletes forged objects immediately. |
| Metadata persistence order | PASS | `src/app/api/media/complete/route.ts` and `src/lib/media/migration.ts` persist `media_assets` metadata and update entity URLs **only after** `HeadObject` size + magic-byte / checksum verification succeeds. |
| Legacy retention on deletion | PASS | `src/app/api/media/[id]/route.ts` resolves `object_key` strictly from DB `id` (never client input), soft-deletes DB metadata (`deleted_at`, `is_public = false`), never deletes legacy Supabase Storage objects, and only removes native R2 objects when `purgeR2=true` and `migration_status === "native_r2"`. |
| Server-side admin auth | PASS | All `/api/media*` routes and `uploadMediaAction` invoke `requireMediaAdmin()` verifying active `profiles.role` (`super_admin`, `owner`, `admin`, `manager`, `content_editor`) via Supabase Auth. |
| Image transformation origin & param safety | PASS | `buildCloudflareImageUrl` (`src/lib/media/imageUrl.ts`) restricts `/cdn-cgi/image/...` transformations to the configured media origin, validates `width` / `quality` against `NaN`/`Infinity`, clamps `[50..3840]` and `[10..100]`, validates `fit`/`format`, enforces `fit=scale-down` (no upscaling), supports both `NEXT_PUBLIC_MEDIA_URL` and `NEXT_PUBLIC_MEDIA_PUBLIC_URL`, and `OptimizedImage` sets `unoptimized` to prevent Next `/_next/image` double optimization. |
| PostgREST filter sanitization | PASS | Updated `src/app/api/media/route.ts` so `folder` query filters strip non-alphanumeric characters before `.or(...)` interpolation. |
| `.gitignore` & `.env.example` secret hygiene | WARN (Pre-Existing) | `.gitignore` ignores `.env*` (except `.env.example`). Added R2 lines (`48–67`) in `.env.example` contain placeholders only; however baseline commit `38e59ea` already contained non-placeholder Supabase URL/anon/service-role strings on lines `9–13` (recommended to rotate/scrub separately from R2 migration). |
| Pre-Migration `005` schema coupling | PASS (Dry-Run) / GATE A (API) | `scripts/migrate-supabase-to-r2.mjs` now queries `select("*")` without `.is("deleted_at", null)` so Phase 3 dry-run runs cleanly **before** Migration `005`. Runtime `/api/media*` routes filter `deleted_at` and write new R2 columns, so live `/api/media*` traffic requires **Gate A (`005_r2_media_migration.sql`)** to be applied first. |

---

## 2. Phase B & C — Environment & Cloudflare Configuration Status

Local `.env*` inspection found **only `.env.example`** (no `.env.local`). Current OS environment status (values hidden):
- `R2_ACCOUNT_ID`: MISSING
- `R2_ACCESS_KEY_ID`: MISSING
- `R2_SECRET_ACCESS_KEY`: MISSING
- `R2_BUCKET_NAME`: MISSING (expected: `technovolt-media`)
- `R2_ENDPOINT`: MISSING (expected: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`)
- `R2_PUBLIC_URL`: MISSING (expected: `https://media.technovolt.tn`)
- `NEXT_PUBLIC_MEDIA_URL` / `NEXT_PUBLIC_MEDIA_PUBLIC_URL`: MISSING (expected: `https://media.technovolt.tn`)
- `NEXT_PUBLIC_CLOUDFLARE_IMAGES_ENABLED`: MISSING
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`: MISSING

Live connectivity probe script [`scripts/verify-r2-connectivity.mjs`](file:///d:/technovolt/scripts/verify-r2-connectivity.mjs) was added and run; it cleanly reported all 8 missing variables and exited without modifying anything.

---

## 3. Phase D — Database Migration Safety Preview (`005_r2_media_migration.sql`)

Verified against `supabase/migrations/001_initial_schema.sql`, `003_add_roles_and_superadmin.sql`, and `004_fix_rls_and_privilege_escalation.sql`:
- **Tables Affected:** `public.media_assets` (100% additive `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`; no tables or columns dropped; existing UUIDs and `uploaded_by` FK untouched).
- **Functions Affected:** `public.has_content_access()` updated to include `'super_admin'` alongside `'owner'`, `'admin'`, `'manager'`, `'content_editor'`.
- **Policies Affected (`public.media_assets`):** Replaces `media_assets_read_public`, `media_assets_read_authenticated`, `media_assets_manage_content` with:
  - `SELECT` for `anon, authenticated`: `(is_public = true and deleted_at is null) or public.has_content_access() or public.is_admin()`
  - `INSERT` / `UPDATE` / `DELETE` for `authenticated`: `public.has_content_access() or public.is_admin()`
- **Compatibility Risk:** Low. Backfills `original_filename`, `size_bytes`, `public_url`, `category`, `legacy_storage_path`, `legacy_public_url`, and `legacy_bucket` cleanly. Live Postgres execution remains gated on user approval (Approval Gate A).

---

## 4. Phase E & F — Discovery, Dry Run & Inventory Summary

Static repository discovery confirmed:
- 74 worksite JPEG images in `public/images/projects/technovolt-chantier-01.jpg`..`74.jpg` referenced by `src/lib/data/galleryPhotos.ts` and `AdminProjectsClient.tsx`
- Brand assets in `public/` (`logo.png`, `logo.jpg`, `images/logo.jpg`, icons)
- 5 configured Supabase Storage buckets in schema (`media`, `documents`, `lead-photos`, `work-orders`, `receipts`)
- DB tables referencing media URLs: `company_settings`, `services`, `projects`, `work_orders`, `expenses`, `profiles`, and `media_assets`.

Live dry run (`node --experimental-strip-types scripts/migrate-supabase-to-r2.mjs`, without `--execute`) was executed and exited cleanly before any reads/writes because `.env.local` is not configured. Once `.env.local` is provided, the script discovers both `media_assets` rows, raw Supabase bucket objects, and entity-table references (`inventorySummary`), and prints all Phase 3 pre-migration report metrics with zero writes:
- Total objects & total storage size (`totalDiscoveredObjects`, `totalStorageBytes`, `totalStorageMegabytes`)
- Per-bucket object counts & byte totals + error tracking (`bucketCounts`, `bucketErrors`)
- Missing/inaccessible backing storage objects (`missingOrInaccessibleCount`, `missingOrInaccessibleSample`)
- Potential duplicates (`duplicateSummary`: exact SHA-256 and filename+size heuristics)
- Database references across `company_settings`, `services`, `projects`, `work_orders`, `expenses`, and `profiles`
- Estimated batch count, estimated duration (`estimatedDurationSeconds` at `batchSize=25`), and estimated R2 Class A/Class B/storage usage (`estimatedR2Usage`).

---

## 5. Phase J — Admin Gallery Manual Test Plan & Browser E2E Readiness

- **Playwright Status:** Not installed in `package.json` (`dependencies` or `devDependencies`); therefore automated Playwright browser E2E was **not executed**.
- **Safe Non-Destructive Admin Gallery Test Plan (Use Disposable Test Images Only — Never Delete Real Media):**
  1. **Authorization check:** Attempt `/api/media`, `/api/media/presign`, `/api/media/complete`, and `DELETE /api/media/<id>` while logged out (`401`) and as non-admin (`403`); then log in at `/fr/admin/login` as active admin (`super_admin`/`admin`/`owner`/`content_editor`).
  2. **Single image upload:** Upload 1 small disposable PNG/JPG via file picker on `/fr/admin/media`; verify `POST /api/media/presign` (`200`), direct `PUT` to R2 custom-domain/presigned endpoint (`200`), and `POST /api/media/complete` (`200`).
  3. **Multiple image upload:** Drag-and-drop 3 disposable test images simultaneously; verify all appear in gallery cleanly without UI freeze or orphaned blob URLs (`URL.revokeObjectURL` cleanup).
  4. **Upload progress:** Throttle browser network in DevTools (Fast 3G) and observe per-file XHR upload percentage bars reaching `100%`.
  5. **Upload failure & retry:** Force offline/blocked request in DevTools during upload, verify clear error banner and per-file retry button succeeds after re-enabling network without duplicating completed uploads; also confirm spoofed/oversized (>5 MB) rejection.
  6. **Image preview:** Verify gallery thumbnails, preview lightbox modal, and zero console errors / zero double optimization (`/_next/image`).
  7. **Editing alt text (FR / AR / EN):** Edit French, Arabic (RTL), and English `alt_text_*` on a disposable test asset via modal, save (`PATCH /api/media/<id>`), and reload page to confirm DB persistence.
  8. **Filtering & pagination:** Filter by category/folder, search by filename/alt text, change sort order, and step through pagination controls confirming accurate server-paginated queries.
  9. **Image replacement (`replaceMediaId`):** Trigger replace action on the disposable test image, upload a second disposable image, and verify metadata/entity reference updates cleanly.
  10. **Deletion authorization & safe soft-delete:** Soft-delete **only the disposable test image** uploaded during this test (never real project/service/logo media); confirm DB sets `deleted_at`/`is_public=false` and any legacy Supabase Storage object remains untouched.
  11. **Legacy image display & responsive delivery:** Load `/fr`, `/fr/services`, `/fr/projects`, and header brand logo; verify legacy Supabase/local `/images/projects/...` items render identically with responsive `sizes` / `srcSet` (or clean `R2_PUBLIC_URL` when `NEXT_PUBLIC_CLOUDFLARE_IMAGES_ENABLED=false`, and `/cdn-cgi/image/width=300|600|1000|1600,quality=80,format=auto,fit=scale-down/...` after Gate C).

---

## 6. Phase L — Pre-Existing Chatbot Test Failure Root-Cause Analysis

- `git diff HEAD -- src/lib/bot src/tests/bot.test.mjs` is **empty** — zero chatbot code or test assertions were modified.
- Shell inspection confirmed `OPENROUTER_API_KEY` is set in the current OS environment. Because `executeBotQuery()` in `src/lib/bot/provider.ts` (lines 557–574) attempts live OpenRouter calls whenever `OPENROUTER_API_KEY` is present, its returned payload omits `isPriceEstimate: true` (lines 568–573) and varies Arabic wording instead of hitting the deterministic `generateDomainKnowledgeAnswer()` fallback tested by `src/tests/bot.test.mjs` lines 92, 158, and 169.
- **Classification:** All 3 failures are **pre-existing baseline failures** (`58 passed, 5 skipped, 3 failed` across 66 total tests).

---

## 7. Phase M — Cloudflare Official Pricing & Cost Review

Based on official Cloudflare R2 and Cloudflare Images Transformations documentation (no paid plan enabled automatically):

| Resource | Monthly Free Tier | Pay-As-You-Go Beyond Free Tier | Estimated TECHNOVOLT Initial Impact |
|---|---|---|---|
| **R2 Standard Storage** | 10 GB-month / month | `$0.015` / GB-month | Expect < 1 GB initially (well within 10 GB free tier) |
| **R2 Class A Ops** (`PutObject`, `List`) | 1,000,000 requests / month | `$4.50` / million requests | Initial migration + monthly admin uploads ≪ 1M free tier |
| **R2 Class B Ops** (`GetObject`, `HeadObject`) | 10,000,000 requests / month | `$0.36` / million requests | Edge-cached CDN + reads ≪ 10M free tier |
| **R2 Egress Bandwidth** | Free (unlimited) | `$0.00` | `$0.00` egress |
| **Cloudflare Images Transformations** | 5,000 **unique** transformations / month *(cached repeats free)* | `$0.50` / 1,000 unique transformations / month *(paid plan only; Free tier returns HTTP error `9422` above 5,000 instead of auto-billing)* | 4 variants (`300`, `600`, `1000`, `1600`) × ~100–300 images ≈ 400–1,200 unique transformations/mo (well inside 5,000 free tier; cached edge hits do not recount) |

> Storage and transformations are subject to account usage quotas; monitor usage in the Cloudflare Dashboard after cutover rather than assuming unlimited free capacity.

---

## 8. Phase N — Production Cutover Approval Gates (STOP)

No production mutation has been run. Before proceeding to live cutover, explicit approval is required independently for each gate:

- **Gate A:** Apply `supabase/migrations/005_r2_media_migration.sql` to production Supabase database.
- **Gate B:** Configure `.env.local`/production secrets, validate via `scripts/verify-r2-connectivity.mjs`, review dry-run counts, and execute batched `scripts/migrate-supabase-to-r2.mjs --execute --confirm-migration --batch-size=25`.
- **Gate C:** Enable Cloudflare Images Transformations on the production zone and set `NEXT_PUBLIC_CLOUDFLARE_IMAGES_ENABLED=true`.
- **Gate D:** Switch production media delivery defaults to R2 (retaining all legacy Supabase Storage objects intact for non-destructive rollback).
- **Gate E:** Delete any original Supabase Storage object (remains permanently blocked without separate explicit approval after prolonged production stability verification).
