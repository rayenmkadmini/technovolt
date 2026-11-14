# TECHNOVOLT — ARCHITECTURAL DECISION RECORDS (ADR)

**Project:** TECHNOVOLT Media Migration  
**Target:** Cloudflare R2 & Cloudflare Images Transformations  
**Canonical Website:** `https://technovolt.tn`  
**WWW Website:** `https://www.technovolt.tn`  
**Media Delivery Domain:** `https://media.technovolt.tn`  
**Status:** Approved & Implemented

---

### ADR-001: Cloudflare R2 as Primary Object Storage with Dedicated Media Domain

- **Context:** Supabase Storage charges egress fees and enforces upload limits that become restrictive as the high-resolution chantier photo gallery scales.
- **Decision:** Migrate all public media assets to Cloudflare R2 using bucket `technovolt-media` bound to dedicated custom delivery domain `https://media.technovolt.tn`. The official website remains canonical `https://technovolt.tn` and `https://www.technovolt.tn`.
- **Consequences:** Zero egress bandwidth costs, faster global CDN delivery via Cloudflare's edge network, clear separation between web application and static media delivery, and zero exposure of internal `.r2.dev` domains.

---

### ADR-002: Direct Browser-to-R2 Upload via Presigned PUT URLs

- **Context:** Routing multi-megabyte image uploads through the Next.js API or Server Actions consumes server memory, incurs CPU overhead, and hits Vercel’s 4.5 MB serverless payload limit.
- **Decision:** Implement a two-phase upload flow:
  1. Client requests a short-lived presigned PUT URL from `/api/media/presign` (valid 60–300s).
  2. Client uploads file directly to R2 via XHR, supporting native upload progress tracking.
  3. Client calls `/api/media/complete` where the server verifies object existence and metadata before saving to the database.
- **Consequences:** Eliminates server payload bottlenecks, provides real-time progress bars to admins, and strictly verifies uploaded assets before database persistence.

---

### ADR-003: Additive Database Schema Evolution (`public.media_assets`)

- **Context:** Existing database schemas already include `public.media_assets` and multiple foreign relationships. Replacing or dropping tables risks breaking existing functionality.
- **Decision:** Author `supabase/migrations/005_r2_media_migration.sql` as a strictly additive migration (`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`).
- **Consequences:** Zero downtime, 100% backward compatibility with existing columns, and clear columns for tracking migration status (`storage_provider`, `object_key`, `legacy_storage_path`, `checksum_sha256`).

---

### ADR-004: Strict Server-Side Role-Based Access Control (RBAC)

- **Context:** Legacy Server Actions lacked server-side role validation, relying on client-side routing guards.
- **Decision:** Enforce server-side session authentication via `@supabase/ssr` across all `/api/media*` endpoints and server actions using `requireMediaAdmin()`. Restrict access to `super_admin`, `owner`, `admin`, `manager`, and `content_editor`.
- **Consequences:** Unauthenticated or unauthorized requests are rejected with HTTP 401 or 403 before any storage or database operation occurs.

---

### ADR-005: Magic-Byte Binary Verification & SVG Security Screening

- **Context:** File extensions and client MIME headers can be easily spoofed to upload malicious binaries or executable scripts masquerading as images.
- **Decision:** Validate binary magic-byte signatures for JPEG, PNG, WebP, and AVIF. For SVGs, parse and screen contents to reject `<script>`, `on*` event handlers, `<foreignObject>`, and `javascript:` URIs.
- **Consequences:** Protects the platform and visitors against stored XSS attacks and arbitrary file upload vulnerabilities.

---

### ADR-006: Dual-Read Image URL Resolution & Non-Destructive Retention

- **Context:** Migrating media in production must never cause broken image links or data loss if an asset is not yet migrated or if rollback is needed.
- **Decision:** Implement dual-read logic in `src/lib/media/imageUrl.ts` and retain all legacy Supabase Storage objects indefinitely during and after migration.
- **Consequences:** Any legacy Supabase Storage URL continues to resolve normally. Rollback is instantaneous by pointing URLs back without re-uploading.

---

### ADR-007: Cloudflare Images Transformations with Next.js Optimization Bypass

- **Context:** Standard `<Image />` tags in Next.js route external images through `/_next/image` for resizing, causing double compression, higher latency, and increased Vercel compute costs.
- **Decision:** Generate Cloudflare `/cdn-cgi/image/...` URLs on `media.technovolt.tn` for predefined responsive variants (`thumbnail`, `card`, `standard`, `large`), and configure `OptimizedImage.tsx` with `unoptimized={true}` for these URLs.
- **Consequences:** Image resizing and format conversion (WebP/AVIF) are handled entirely at the Cloudflare edge with zero Vercel serverless image optimization overhead.

---

### ADR-008: Soft-Deletion and Server-Authoritative Key Resolution

- **Context:** Allowing clients to supply raw file keys or paths to delete endpoints exposes the system to path traversal and arbitrary object deletion.
- **Decision:** The deletion endpoint (`DELETE /api/media/[id]`) resolves the storage object key strictly from the database record matching the provided UUID. Deletions perform a soft-delete in the database (`deleted_at = now()`, `is_public = false`) and never purge legacy storage.
- **Consequences:** Prevents deletion of arbitrary objects and provides an audit trail with rollback capability.

---

### ADR-009: Restrictive CORS Policy for R2 Media Direct Uploads

- **Context:** Direct browser uploads to S3-compatible endpoints require cross-origin resource sharing headers. Permissive CORS (`*` or wildcard methods) introduces cross-origin data exposure or unauthorized PUT requests.
- **Decision:** Restrict R2 bucket CORS allowed origins strictly to `https://technovolt.tn`, `https://www.technovolt.tn`, and `http://localhost:3000`. Exclude `DELETE` method from CORS (deletions remain server-authoritative). Exclude non-production preview domains unless specifically requested for a deployment.
- **Consequences:** Tightens cross-origin security while allowing legitimate admin users to execute direct presigned uploads from both local development and production portals.
