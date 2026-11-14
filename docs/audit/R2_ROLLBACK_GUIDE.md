# TECHNOVOLT — CLOUDFLARE R2 NON-DESTRUCTIVE ROLLBACK GUIDE

**Date:** 2026-11-11  
**Policy:** Zero-Loss Non-Destructive Rollback  
**Guarantee:** Never deletes R2 objects or Supabase Storage objects during rollback.

---

## 1. Rollback Principles

- **Dual-Read Safety:** Legacy Supabase URLs (`legacy_public_url`, `legacy_storage_path`, `legacy_bucket`) are preserved on every migrated `public.media_assets` row and original binaries remain untouched in Supabase Storage buckets.
- **No Destructive Storage Calls:** `scripts/rollback-r2-to-supabase.mjs` performs **metadata restoration only** (updates `public.media_assets` and referencing content tables back to `legacy_public_url`) and leaves both Cloudflare R2 objects and Supabase Storage objects intact.
- **Instant Runtime Fallback:** Setting `NEXT_PUBLIC_CLOUDFLARE_IMAGES_ENABLED=false` immediately stops generating `/cdn-cgi/image/...` URLs without requiring database changes, while `resolveMediaSrc()` automatically selects `legacy_public_url` whenever `migration_status` is `'failed'` or `'rolled_back'`.

---

## 2. Emergency Level 1 — Disable Cloudflare Image Transformations Only

Use this if R2 custom domain delivery works, but Cloudflare `/cdn-cgi/image/...` transformations show issues (e.g., billing/zone propagation delay or misconfigured allowed origins):

1. Set environment variable:
   ```dotenv
   NEXT_PUBLIC_CLOUDFLARE_IMAGES_ENABLED=false
   ```
2. Redeploy or restart Next.js so client & server components pick up the flag.
3. **Result:** `<OptimizedImage />` and `buildCloudflareImageUrl()` bypass `/cdn-cgi/image/...` and serve direct `https://media.technovolt.tn/...` URLs immediately.

---

## 3. Emergency Level 2 — Restore Legacy Supabase URLs in Metadata (Dry-Run First)

Use this to revert migrated records (`migration_status = 'verified'`) and referencing tables (`company_settings`, `services`, `projects`, `work_orders`, `expenses`, `profiles`) back to their original Supabase Storage URLs.

### Step 3.1 — Preview Rollback Scope (Dry Run — Default)
```bash
node --experimental-strip-types scripts/rollback-r2-to-supabase.mjs
```
Review output JSON/logs confirming how many records will be restored and verifying that `native_r2` items (newly uploaded directly to R2 with no Supabase copy) are reported cleanly and skipped rather than broken.

### Step 3.2 — Execute Non-Destructive Rollback
```bash
node --experimental-strip-types scripts/rollback-r2-to-supabase.mjs --execute --confirm-rollback
```

What this script does cleanly:
1. Updates `public.media_assets` rows that have `legacy_public_url` (and are not `native_r2`):
   - Sets `public_url = legacy_public_url`
   - Sets `file_url = legacy_public_url`
   - Sets `file_path = coalesce(legacy_storage_path, file_path)`
   - Sets `storage_provider = 'supabase'`
   - Sets `migration_status = 'rolled_back'`
   - Keeps `object_key` and `checksum_sha256` intact in R2 for forensic inspection or future re-cutover.
2. Replaces matching R2 `public_url` strings back with `legacy_public_url` across:
   - `public.company_settings` (`settings.logo_url`, `settings.favicon_url`)
   - `public.services` (`cover_image`, `gallery`)
   - `public.projects` (`cover_image`, `gallery`, `before_images`, `after_images`)
   - `public.work_orders` (`completion_photos`)
   - `public.expenses` (`receipt_url`)
   - `public.profiles` (`avatar_url`)

---

## 4. Post-Rollback Verification Procedure

1. **Database Check (Supabase SQL Editor):**
   ```sql
   SELECT migration_status, storage_provider, count(*)
   FROM public.media_assets
   GROUP BY migration_status, storage_provider;
   ```
   Confirm zero rows intended for rollback remain stuck without `legacy_public_url`.
2. **Storage Non-Destruction Check:**
   - Confirm Supabase Storage buckets still hold all original files (`count` unchanged).
   - Confirm R2 bucket still retains copies for inspection.
3. **Public & Admin UI Check:**
   - Verify homepage (`/fr`), `/fr/services`, `/fr/projects`, company logo header, and `/fr/admin/media` load images from legacy URLs with HTTP `200 OK` and zero console/broken image errors.
4. **Next.js Cache Revalidation:**
   - If ISR or CDN cached responses hold old R2 URLs, purge Cloudflare cache / trigger Vercel redeploy after rollback.
