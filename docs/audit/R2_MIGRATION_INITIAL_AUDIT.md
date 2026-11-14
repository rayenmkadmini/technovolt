# TECHNOVOLT — CLOUDFLARE R2 MEDIA MIGRATION: INITIAL AUDIT

**Date:** 2026-11-11  
**Phase:** Phase 0 — Project Discovery & Baseline Audit  
**Repository:** `d:\technovolt`  
**Status:** Discovery Complete (Zero Files Modified Prior to Audit)

---

## 1. Framework, Runtime & Dependencies

- **Framework:** Next.js `16.4.3` (App Router, Turbopack)
- **React:** `19.3.0` (`react`, `react-dom`)
- **TypeScript:** `^5` (`strict: true`)
- **Internationalization:** `next-intl` `^4.14.9` (`fr`, `ar` RTL, `en`) via `src/middleware.ts` and `src/i18n/`
- **Database & Auth:** `@supabase/supabase-js` `^2.118.0`, `@supabase/ssr` `^0.12.7`
- **Validation:** `zod` `^3.25.76`
- **Node.js Runtime (local):** `v24.21.0`
- **Local Workspace State:**
  - `node_modules/` is not currently installed in `d:\technovolt`.
  - `.env.local` is not currently present in `d:\technovolt` (only `.env.example` exists).
  - Baseline `npm test` ran 50 tests: 46 passed, 4 failed (`src/tests/db_integration.test.mjs` failed immediately due to missing `node_modules/@supabase/supabase-js`; 3 bot tests failed in live/unconfigured conditions).
- **Missing R2 Dependencies (to be added in Phase 1):**
  - `@aws-sdk/client-s3`
  - `@aws-sdk/s3-request-presigner`

---

## 2. Existing Media & Upload Architecture

### 2.1 Server-Side Upload (`src/app/actions/adminActions.ts`)
- **`uploadMediaAction(formData: FormData)`** (lines 1222–1285):
  - Accepts `file`, `folder` (defaults to `"Chantiers"`), and `altFr`.
  - Validates `file.type` against `["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"]` (checks client-provided MIME string only; no magic-byte inspection or extension verification).
  - Enforces a 5 MB max file size (`5 * 1024 * 1024`).
  - Uses `createAdminClient()` (`SUPABASE_SERVICE_ROLE_KEY` or fallback anon key) to upload to Supabase Storage bucket `"media"` at `${folder.toLowerCase()}/${Date.now()}-${rand}.${ext}` with `upsert: true`.
  - **Silent fallback bug:** Initializes `publicUrl = /images/projects/${safeName}` and catches storage errors with `console.warn`, returning `success: true` with a non-existent local path if Supabase Storage fails.
  - **Metadata gap:** Does **not** insert or update rows in `public.media_assets`.
  - **Auth gap:** Does **not** verify the caller's Supabase Auth session or admin/content role on the server before using `createAdminClient()`.

### 2.2 Admin Media Gallery (`src/app/[locale]/admin/media/page.tsx`)
- Client component (`"use client"`) initialized with 4 hardcoded `initialMedia` entries (`/logo.jpg`, `technovolt-chantier-01.jpg`, `03.jpg`, `04.jpg`).
- Persists gallery state solely in browser `localStorage` under key `"technovolt_admin_media"` — does **not** load from or save to `public.media_assets` in Supabase.
- Supports single-file selection or drag-and-drop, calls `uploadMediaAction(fd)`, renders `<Image unoptimized />` thumbnails, allows copying URLs, filtering by 4 fixed folders (`Branding`, `Chantiers`, `Climatisation`, `Domotique`), and deleting from `localStorage` only (no storage or DB deletion).
- Lacks multi-file upload, upload progress, per-file retry, search, sorting, pagination, alt-text editing, image replacement, or server-backed deletion.

### 2.3 Company Logo & Branding Workflow (`src/app/[locale]/admin/settings/page.tsx`)
- Uploads logo via `uploadMediaAction(fd)` with `folder: "Branding"`, then calls `updateCompanySettingsAction({ logo_url: finalLogoUrl })` (`company_settings.settings` JSONB) and mirrors to `localStorage` (`"technovolt_company_logo"`).
- If `uploadMediaAction` fails or returns no URL, `finalLogoUrl` falls back to `logoPreview` (a `blob:` or `data:` URL) which breaks across sessions or gets persisted into `company_settings`.
- `Header.tsx` and `src/app/[locale]/admin/layout.tsx` read `"technovolt_company_logo"` from `localStorage` with fallback `/logo.png` (and `<Image unoptimized />`). `Footer.tsx`, login/register pages, and `about/page.tsx` hardcode `/logo.png`.

### 2.4 Services, Projects & Public Showcase Galleries
- **Static Public Assets (`public/`):**
  - 74 worksite photos at `public/images/projects/technovolt-chantier-01.jpg` through `technovolt-chantier-74.jpg` (cataloged in `src/lib/data/galleryPhotos.ts` as `ALL_CHANTIER_PHOTOS`).
  - Logos & icons: `public/logo.png`, `public/logo.jpg`, `public/images/logo.jpg`, `public/icon.png`, `public/icon.svg`, `public/apple-icon.png`, `public/icon-192.png`, `public/icon-512.png`, `public/favicon.ico`.
- **Public Gallery (`src/components/projects/ProjectsGallery.tsx`):**
  - Renders `ALL_CHANTIER_PHOTOS` (24 items per load-more batch) with `next/image` (`fill`, `loading="lazy"`, `sizes`) and a lightbox modal.
- **Projects Management (`src/app/[locale]/admin/projects/AdminProjectsClient.tsx`):**
  - Uses `ALL_CHANTIER_PHOTOS` picker or manual URL input for `cover_image`, synced via `createProjectAction` / `deleteProjectAction` and `localStorage` (`"technovolt_admin_projects"`). Note: editing a project currently updates React state/`localStorage` only.
- **Services (`src/lib/data/services.ts`, `src/app/[locale]/services/**`):**
  - Reads `cover_image` and `gallery` from `public.services`.

### 2.5 Next.js Image Strategy (`next.config.ts`)
- Currently configures `images.remotePatterns: [{ protocol: "https", hostname: "**" }]` (overly permissive wildcard).
- Admin gallery (`admin/media/page.tsx`), settings (`admin/settings/page.tsx`), `Header.tsx`, and `admin/layout.tsx` pass `unoptimized` on `<Image>`, whereas public pages (`page.tsx`, `projects/page.tsx`, `services/page.tsx`, `ProjectsGallery.tsx`) rely on default Next.js `/_next/image` optimization.
- When migrating to Cloudflare R2 + Cloudflare Images Transformations, Next.js `/_next/image` must **not** double-optimize already Cloudflare-transformed URLs (custom loader or `unoptimized` with responsive Cloudflare variant URLs).

---

## 3. Existing Supabase Storage Buckets & Object Counts

Defined in `supabase/migrations/001_initial_schema.sql` (lines 2133–2255):

| Bucket | Public | Size Limit | Allowed MIME Types | Code Usage Found | Live Object Count |
|---|---|---|---|---|---|
| `media` | `true` | 50 MB (`52428800`) | `image/jpeg`, `image/png`, `image/webp`, `image/svg+xml`, `image/gif`, `application/pdf`, `video/mp4`, `video/webm` | `uploadMediaAction` in `adminActions.ts`; `db_integration.test.mjs` | **Not accessible locally** (`.env.local` & `node_modules` absent) |
| `documents` | `false` | 20 MB (`20971520`) | PDF, DOC/DOCX, XLS/XLSX, JPEG, PNG | None in `src/` | **Not accessible locally** |
| `lead-photos` | `false` | 10 MB (`10485760`) | JPEG, PNG, WebP | None in `src/` | **Not accessible locally** |
| `work-orders` | `false` | 10 MB (`10485760`) | JPEG, PNG, WebP | None in `src/` | **Not accessible locally** |
| `receipts` | `false` | 10 MB (`10485760`) | JPEG, PNG, PDF | None in `src/` | **Not accessible locally** |

*Note:* Live bucket enumeration and exact object counts must be collected via the migration discovery script once `.env.local` (with `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`) and `npm install` are available.

---

## 4. Existing Database Metadata Tables & Image References

### 4.1 Central Media Table: `public.media_assets` (`001_initial_schema.sql` lines 423–451)
Existing columns:
- `id` (`uuid primary key default gen_random_uuid()`)
- `file_name` (`text not null`)
- `file_path` (`text not null`)
- `file_url` (`text not null`)
- `file_type` (`text not null`, check `'image' | 'document' | 'video'`)
- `mime_type` (`text`)
- `file_size` (`bigint`)
- `width` (`int`), `height` (`int`)
- `alt_text_fr` (`text`), `alt_text_ar` (`text`), `alt_text_en` (`text`)
- `folder` (`text default 'general'`)
- `uploaded_by` (`uuid references auth.users(id) on delete set null`)
- `created_at` (`timestamptz not null default now()`)

Existing RLS Policies on `public.media_assets`:
- `media_assets_read_authenticated`: `SELECT` for `authenticated` when `public.is_active_user()`
- `media_assets_read_public`: `SELECT` for `anon` (`using (true)`)
- `media_assets_manage_content`: `ALL` for `authenticated` when `public.has_content_access() or public.is_admin()`

**Recommended Schema Strategy (Phase 3):** Reuse `public.media_assets` via an additive `ALTER TABLE` migration (`005_r2_media_migration.sql`) to add R2 and migration-tracking columns (`storage_provider`, `object_key`, `public_url`, `original_filename`, `category`, `sort_order`, `updated_at`, `migration_status`, `legacy_storage_path`, `legacy_public_url`, `legacy_bucket`, `checksum_sha256`, `is_public`, `migrated_at`, `deleted_at`) without breaking existing columns or foreign keys, plus tightening public `SELECT` RLS to only public/non-deleted assets (`is_public = true and deleted_at is null`) while keeping admin/content management restricted to authorized staff.

### 4.2 Other Tables Referencing Media URLs
- `public.company_settings`: `settings` JSONB (`logo_url`, `favicon_url`)
- `public.services`: `cover_image text`, `gallery text[]`
- `public.projects`: `cover_image text`, `gallery text[]`, `before_images text[]`, `after_images text[]`
- `public.work_orders`: `completion_photos text[]`
- `public.leads`: `photos` (present in `src/types/database.ts`, verify live column in migration)
- `public.expenses`: `receipt_url text`
- `public.profiles`: `avatar_url text`

---

## 5. Authentication & Authorization Architecture

- **Supabase Auth** via `@supabase/ssr` (`src/lib/supabase/server.ts`, `src/lib/supabase/client.ts`) and `public.profiles`.
- **Roles (`003_add_roles_and_superadmin.sql`):** `super_admin`, `owner`, `admin`, `manager`, `technician`, `accountant`, `content_editor`, `client`.
- **SQL Helpers:**
  - `public.is_admin()` checks `role in ('super_admin', 'owner', 'admin', 'manager')` and `is_active = true`.
  - `public.has_content_access()` in `001_initial_schema.sql` checks `role in ('owner', 'admin', 'manager', 'content_editor')` and `is_active = true` (missing `super_admin` in that function, though RLS on `media_assets` checks `has_content_access() or is_admin()`).
- **Client vs. Server Enforcement:**
  - `src/app/[locale]/admin/layout.tsx` enforces admin role client-side and redirects unauthorized users to `/admin/login`.
  - Server Actions in `src/app/actions/adminActions.ts` currently lack server-side session verification. All new media/R2 API routes and Server Actions must verify `supabase.auth.getUser()` and check `profiles.role` + `profiles.is_active` on the server before generating presigned URLs, mutating `media_assets`, or deleting objects.

---

## 6. Affected Components & Files

### Files Requiring Creation or Modification
1. **Environment & Config:**
   - `.env.example` (document `R2_*` and `NEXT_PUBLIC_MEDIA_CDN_URL` / Cloudflare Image transformation configuration without secrets)
   - `package.json` / `package-lock.json` (add `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`)
   - `next.config.ts` (tighten `images.remotePatterns` to configured R2/Cloudflare & Supabase domains; configure custom loader or explicit unoptimized handling for Cloudflare-transformed URLs)
2. **Server-Only R2 & Media Security Modules (New):**
   - `src/lib/storage/r2.ts` (server-only S3-compatible R2 client, presigned PUT URL generation, object head/get/put/delete with timeouts, bucket restriction, never imported client-side)
   - `src/lib/storage/validation.ts` (MIME whitelist, magic-byte signature verification, safe UUID key generation, filename sanitization / path-traversal prevention, size validation)
   - `src/lib/auth/adminAuth.ts` (server-side session + active admin/content-editor role guard for API routes and Server Actions)
3. **Cloudflare Image Optimization & Dual-Read Helpers (New):**
   - `src/lib/media/imageUrl.ts` (Cloudflare `/cdn-cgi/image/...` URL builder for `thumbnail` 300px, `card` 600px, `standard` 1000px, `large` 1600px, quality ~80, `format=auto`, `fit=scale-down` to prevent upscaling, origin allowlist, dual-read fallback for legacy `/images/...` and Supabase Storage URLs)
   - `src/components/media/OptimizedImage.tsx` (or helper wrapper preserving `width`, `height`, `alt`, `loading`, `sizes`, avoiding double optimization)
4. **API Routes & Server Actions:**
   - `src/app/api/media/presign/route.ts` (authenticated admin endpoint to issue short-lived presigned PUT URLs + register/validate pending upload token)
   - `src/app/api/media/complete/route.ts` (verifies object in R2 via `HeadObject` + magic bytes/size if needed, persists metadata to `public.media_assets`, prevents duplicates)
   - `src/app/api/media/route.ts` & `src/app/api/media/[id]/route.ts` (paginated search/filter/sort listing, alt text/category update, replace, safe soft-delete/R2 delete using DB-resolved `object_key` only)
   - `src/app/actions/adminActions.ts` (update `uploadMediaAction` to use R2 + `media_assets` with server auth check while keeping legacy fallback compatibility)
5. **Database Migration:**
   - `supabase/migrations/005_r2_media_migration.sql` (extend `public.media_assets`, add migration tracking columns, indexes, `updated_at` trigger, tighten RLS, update `has_content_access()` to include `super_admin`)
6. **Legacy Migration & Rollback Tooling (New):**
   - `scripts/migrate-supabase-to-r2.mjs` (resumable, batched, dry-run-by-default migration script from Supabase Storage + `media_assets` / referenced tables to R2 with SHA-256 verification and dual-read preservation)
   - `scripts/rollback-r2-to-supabase.mjs` (non-destructive rollback restoring `legacy_public_url` / `legacy_storage_path` in DB metadata while preserving R2 copies)
7. **Admin UI & Public Consumers:**
   - `src/app/[locale]/admin/media/page.tsx` (preserve existing TECHNOVOLT UI while upgrading to DB-backed gallery, multi-file drag-and-drop presigned uploads with progress & retry, search/filter/sort/pagination, alt-text edit, replace, safe delete, Cloudflare 300px thumbnails)
   - `src/app/[locale]/admin/settings/page.tsx` (ensure logo upload uses presigned R2 or authenticated server upload and never persists `blob:` URLs)
   - `src/app/[locale]/admin/projects/AdminProjectsClient.tsx` (support choosing from `media_assets` or uploading via R2 alongside existing 74 worksite photos, use Cloudflare thumbnail variants)
   - `src/components/projects/ProjectsGallery.tsx`, `src/app/[locale]/page.tsx`, `src/app/[locale]/projects/page.tsx`, `src/app/[locale]/services/page.tsx`, `src/app/[locale]/services/[slug]/page.tsx`, `src/components/layout/Header.tsx`, `src/components/layout/Footer.tsx` (preserve layout/SEO/alt text while routing R2 URLs through Cloudflare Images transformations without double optimization)
8. **Tests & Audit Docs:**
   - `src/tests/r2_media.test.mjs` (unit & integration tests for R2 config, presigned URLs, auth, validation, transformation URLs, migration dry-run, checksum verification, resume, duplicate prevention, rollback, pagination)
   - `docs/audit/R2_MIGRATION_PLAN.md`, `docs/audit/R2_MIGRATION_REPORT.md`, `docs/audit/R2_ROLLBACK_GUIDE.md`

---

## 7. Risks & Dependencies

1. **Missing Local Dependencies & Credentials:**
   - `node_modules` is not installed (`npm install` required before running TypeScript, ESLint, Next build, or AWS/Supabase SDK tests).
   - `.env.local` is absent; neither Supabase live credentials nor Cloudflare R2 credentials (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_ENDPOINT`, `R2_PUBLIC_URL`) are configured locally yet.
2. **Cloudflare Dashboard Prerequisites (Manual User Actions Required):**
   - Create R2 bucket and API token with Object Read & Write permissions scoped only to the bucket.
   - Bind custom media domain (e.g., `media.technovolt.tn`) to the R2 bucket (never use `r2.dev` or S3 API endpoint in production).
   - Enable **Cloudflare Images Transformations** on the zone and restrict allowed source origins to the configured media domain.
   - Configure R2 bucket **CORS policy** for exact local (`http://localhost:3000`) and production origins (`https://technovolt.tn`, `https://technovolt.vercel.app`) allowing only `PUT`, `GET`, `HEAD` and required upload headers (`Content-Type`, `Content-Length`).
3. **Double Optimization Risk:**
   - Feeding Cloudflare `/cdn-cgi/image/...` URLs into Next.js `/_next/image` causes double compression and extra latency. Must route Cloudflare-transformed URLs with `unoptimized` or a custom Next.js image loader.
4. **Silent Legacy Fallback Masking Errors:**
   - Current `uploadMediaAction` returns a fake `/images/projects/...` URL if storage fails, and `AdminMediaPage` relies on `localStorage`. Migrating to DB-backed `media_assets` must preserve existing `localStorage` items gracefully or clearly distinguish persisted vs. legacy records without breaking admin workflows.
5. **Server Action Authorization Gap:**
   - `adminActions.ts` currently lacks server-side auth checks. All new R2 presign/complete/delete/migration routes must strictly verify admin/content roles server-side.
6. **Zero-Loss Rollback Requirement:**
   - Existing Supabase Storage objects and legacy URLs (`legacy_public_url`, `legacy_storage_path`) must remain untouched and readable until migration is verified and explicitly approved.
