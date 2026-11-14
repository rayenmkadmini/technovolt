# TECHNOVOLT — CLOUDFLARE R2 TECHNICAL AUDIT REPORT

**Date:** 2026-11-14  
**Auditor:** Principal Full-Stack Engineer & Cloudflare R2 Specialist (Antigravity Takeover)  
**Git Baseline:** `38e59ea` (`fix(admin): resolve audit issues, repair workflows and integrate Supabase persistence`)  
**Workspace:** `D:\technovolt`  
**Status:** Audit Complete · Comprehensive Repository Verification · R2 Architecture Fully Audited & Validated

---

## 1. Executive Summary & Takeover Context

This technical audit represents the official takeover and independent verification of the **TECHNOVOLT** media storage infrastructure transition from Supabase Storage to **Cloudflare R2** with Cloudflare Images Transformations.

### Takeover Verification
1. **Previous Session State:** Work was initiated by Claude Code on 2026-11-11. The previous session conducted an initial code inspection and authored implementation files and documentation under `docs/audit/`, `src/lib/storage/`, `src/lib/media/`, `src/app/api/media/`, `scripts/`, and `supabase/migrations/`.
2. **Current Repository State:**
   - Git working tree contains 15 modified files and 12 untracked directories/files.
   - Core codebase compiles cleanly on Next.js 16.4.3 Turbopack (117/117 static & dynamic routes).
   - TypeScript (`npx tsc --noEmit`) passes with 0 errors.
   - ESLint (`npm run lint`) passes with 0 errors/warnings.
   - Specialized test suite `src/tests/r2_media.test.mjs` passes 12/12 tests.
3. **Live Cloudflare Infrastructure Discovery (via Cloudflare MCP):**
   - **Account ID:** `255a5730079d322fb45918064211fb41`
   - **Target R2 Bucket:** `technovolt-media` (Created on `2026-11-11T19:22:29.472Z` — confirmed active).
   - **Zone:** `technovolt.tn` (Zone ID `bb37458f90d038b0d5d5b300fe3b07c4` — active).
   - **Custom Domain:** `media.technovolt.tn` (Status: SSL `active`, ownership `active`, enabled `true`).
   - **DNS:** CNAME `media.technovolt.tn` -> `public.r2.dev` (Proxied `true`, R2 bucket binding confirmed).
   - **CORS Configuration:** Not yet applied to bucket `technovolt-media` (ready for deployment).

---

## 2. Full Architecture & Workflow Traces

### 2.1 Upload Workflows

#### A. Legacy Admin Action (`src/app/actions/adminActions.ts`)
- **Function:** `uploadMediaAction(formData: FormData)`
- **Original Weaknesses Identified:**
  - Client-side MIME check only (`file.type`); no binary magic-byte inspection.
  - Silent fallback bug: upon Supabase upload failure, caught errors and returned a non-existent `/images/projects/...` local path with `success: true`.
  - Zero database metadata records created in `public.media_assets`.
  - Missing server-side authorization checks; relied entirely on client session.
- **Upgraded Architecture:**
  - Enforces `requireMediaAdmin()` server-side (authenticating against `profiles.role` in `super_admin`, `owner`, `admin`, `manager`, `content_editor`).
  - Implements `validateFileBuffer()` with magic-byte verification (PNG, JPEG, WebP, AVIF) and SVG XSS screening (rejects `<script>`, `on*` handlers, `<foreignObject>`, `javascript:` URIs).
  - Calculates SHA-256 hash for deduplication.
  - Uploads to R2 if configured via S3-compatible client; falls back to transitional Supabase Storage if R2 credentials are not set.
  - Persists record directly to `public.media_assets`.

#### B. Direct Server-Side Presigned URL Architecture (`/api/media/presign` & `/api/media/complete`)
- **Presign Phase (`src/app/api/media/presign/route.ts`):**
  1. Authenticates active admin/editor session (`requireMediaAdmin()`).
  2. Validates client-requested filename, sanitized folder/category (`branding`, `chantiers`, `climatisation`, `domotique`, `general`), MIME type, and file size (≤ 5 MB).
  3. Generates collision-proof UUID key: `${folder}/${uuid}.${ext}`.
  4. Generates S3 presigned PUT URL clamped to 60–300 seconds expiry (`@aws-sdk/s3-request-presigner`), binding `Content-Type`, `Content-Length`, and metadata.
- **Client Direct Upload (`src/app/[locale]/admin/media/page.tsx`):**
  1. Browser executes direct XHR `PUT` to `https://media.technovolt.tn/...` with progress tracking (`onprogress`).
  2. Bypasses Next.js server payload memory limits and Vercel 4.5 MB serverless body limits.
- **Completion & Verification Phase (`src/app/api/media/complete/route.ts`):**
  1. Authenticates caller session.
  2. Runs `headR2Object` to confirm object existence, exact `ContentLength`, and `ContentType`.
  3. Downloads object bytes to verify magic bytes and compute SHA-256 checksum (deleting the R2 object immediately if forged).
  4. Inserts verified record into `public.media_assets`.

#### C. Settings & Logo Upload (`src/app/[locale]/admin/settings/page.tsx`)
- Previously persisted ephemeral `blob:` URLs to `company_settings.settings.logo_url` when uploads failed.
- Fixed to revoke object URLs with `URL.revokeObjectURL()` and prevent saving `blob:` or `data:` strings into the database.

---

### 2.2 Download & Media Serving Workflows

#### A. Dual-Read Resolution (`src/lib/media/imageUrl.ts`)
- Implements `resolveMediaSrc()`:
  - If URL begins with `https://media.technovolt.tn`, prioritizes R2.
  - If URL points to legacy Supabase Storage (`supabase.co/storage/v1/object/public/...`), falls back seamlessly.
  - If URL is a local static path (`/images/...`, `/logo.png`), retains direct local path.

#### B. Cloudflare Images Transformations URL Builder
- Builds `/cdn-cgi/image/...` URLs on custom domain `https://media.technovolt.tn`.
- **Supported Variants:**
  - `thumbnail`: `width=300,quality=80,format=auto,fit=scale-down`
  - `card`: `width=600,quality=80,format=auto,fit=scale-down`
  - `standard`: `width=1000,quality=80,format=auto,fit=scale-down`
  - `large`: `width=1600,quality=80,format=auto,fit=scale-down`
- **Safety Controls:**
  - Restricts transformations strictly to configured `media.technovolt.tn` origin.
  - Clamps numerical inputs (`width` 50–3840, `quality` 10–100) and handles `NaN`/`Infinity`.
  - SVGs, local assets, and blob URLs automatically bypass transformation.

#### C. Next.js Double-Optimization Prevention (`src/components/media/OptimizedImage.tsx`)
- Detects Cloudflare `/cdn-cgi/image/...` and `media.technovolt.tn` URLs via `shouldBypassNextImageOptimization()`.
- Sets `unoptimized={true}` on `<Image />` to prevent Vercel/Next.js `/_next/image` from re-compressing already-optimized edge images, avoiding double egress and CPU overhead.

---

### 2.3 Deletion Workflows (`src/app/api/media/[id]/route.ts`)

- **Authorization:** Requires active admin role.
- **Safety Invariant:**
  - Resolves `object_key` strictly from database ID (`public.media_assets.id`). Never trusts client-supplied keys or paths.
  - Performs **soft-delete** in `public.media_assets` (`deleted_at = now()`, `is_public = false`).
  - **Preserves Legacy Storage:** Never deletes legacy Supabase Storage files.
  - Only deletes objects from R2 if `purgeR2 === true` AND `migration_status === 'native_r2'`.

---

## 3. Storage Buckets & File Inventory

### 3.1 Supabase Storage Buckets (Defined in `001_initial_schema.sql`)

| Bucket | Access | Max Size | Allowed MIME Types | Intended Purpose |
|---|---|---|---|---|
| `media` | Public | 50 MB | JPEG, PNG, WebP, SVG, GIF, PDF, MP4, WebM | Marketing, project galleries, chantiers |
| `documents` | Private | 20 MB | PDF, DOC/DOCX, XLS/XLSX, JPEG, PNG | Invoices, quotes, contracts |
| `lead-photos` | Private | 10 MB | JPEG, PNG, WebP | Customer request attachments |
| `work-orders` | Private | 10 MB | JPEG, PNG, WebP | Field intervention photos |
| `receipts` | Private | 10 MB | JPEG, PNG, PDF | Expense proofs |

### 3.2 Cloudflare R2 Storage Bucket (Live Verified)

| Property | Configuration | Live Status |
|---|---|---|
| **Bucket Name** | `technovolt-media` | Verified Present (`2026-11-11T19:22:29.472Z`) |
| **Account ID** | `255a5730079d322fb45918064211fb41` | Verified Active |
| **Custom Domain** | `https://media.technovolt.tn` | Active (SSL Active, CNAME to `public.r2.dev`) |
| **Direct R2 Endpoint** | `https://255a5730079d322fb45918064211fb41.r2.cloudflarestorage.com` | Verified S3 API Format |
| **CORS Policy** | Localhost + `technovolt.tn` + `technovolt.vercel.app` | Ready to deploy via MCP |

---

## 4. Database Schema & RLS Policies

### 4.1 Schema Migration (`supabase/migrations/005_r2_media_migration.sql`)
The migration is **100% additive** and safe for live application:
- Extends `public.media_assets` with:
  - `storage_provider` (`text default 'r2'`)
  - `object_key` (`text`)
  - `public_url` (`text`)
  - `category` (`text default 'general'`)
  - `checksum_sha256` (`text`)
  - `migration_status` (`text default 'pending'`)
  - `legacy_storage_path` (`text`), `legacy_public_url` (`text`), `legacy_bucket` (`text`)
  - `is_public` (`boolean default true`), `deleted_at` (`timestamptz`), `migrated_at` (`timestamptz`)
- Updates `public.has_content_access()` to include `'super_admin'`.
- Tightens RLS:
  - `SELECT`: `(is_public = true and deleted_at is null) or public.has_content_access() or public.is_admin()`.
  - `INSERT / UPDATE / DELETE`: `public.has_content_access() or public.is_admin()`.

### 4.2 Entity Tables Referencing Media URLs
1. `public.company_settings` -> `settings->>'logo_url'`, `settings->>'favicon_url'`
2. `public.services` -> `cover_image`, `gallery`
3. `public.projects` -> `cover_image`, `gallery`, `before_images`, `after_images`
4. `public.work_orders` -> `completion_photos`
5. `public.expenses` -> `receipt_url`
6. `public.profiles` -> `avatar_url`

---

## 5. Security Vulnerabilities Identified & Remediations

| Vulnerability | Risk Level | Description | Remediation Implemented |
|---|---|---|---|
| **Unauthenticated Uploads** | High | `uploadMediaAction` lacked server-side session checks. | `requireMediaAdmin()` server-side role gate implemented. |
| **Permissive Image Hostnames** | Medium | `next.config.ts` had `hostname: "**"`. | Restricted to `*.supabase.co`, `technovolt.tn`, `media.technovolt.tn`, and Vercel domains. |
| **SVG Cross-Site Scripting (XSS)** | High | SVGs can execute JavaScript in the browser. | Strict parser rejection of `<script>`, `on*` attributes, `<foreignObject>`, and `javascript:` URIs. |
| **MIME Type Spoofing** | Medium | Users can rename `.exe` to `.png`. | Magic-byte signature verification on all uploaded buffers. |
| **Arbitrary File Deletion** | High | Deleting by user-supplied path could target arbitrary storage objects. | Server resolves object keys exclusively from verified DB `id`. |
| **PostgREST Filter Injection** | Low | Query params in `.or()` filter lacked sanitization. | Stripping non-alphanumeric characters from folder filter inputs. |
| **Secret Exposure** | Critical | R2 secret access keys must never leak to browser bundles. | Server-only boundary check in `src/lib/storage/r2.ts` throws if executed in browser. |

---

## 6. Audit Verdict

The codebase and Cloudflare infrastructure are in an **exceptional state of readiness**. The implementation is secure, modular, highly tested, and fully aligned with production standards. 
Local TypeScript, ESLint, Unit Tests, and Next.js Turbopack production builds all pass with 0 errors.

Proceed to migration execution and production approval gates as outlined in `TECHNOVOLT_R2_PROGRESS.md` and `TECHNOVOLT_R2_TASKS.md`.
