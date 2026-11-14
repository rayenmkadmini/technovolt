-- ============================================================================
-- Migration 005: Cloudflare R2 Media Storage & Zero-Loss Migration Support
-- ============================================================================
-- Extends existing public.media_assets table in-place without breaking
-- existing columns, IDs, or relationships.
-- ============================================================================

-- 1. Update has_content_access() to include super_admin alongside owner/admin/manager/content_editor
create or replace function public.has_content_access()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('super_admin', 'owner', 'admin', 'manager', 'content_editor')
      and is_active = true
  );
$$;

-- 2. Extend public.media_assets with R2, metadata, and migration tracking columns
alter table public.media_assets
  add column if not exists storage_provider text not null default 'supabase',
  add column if not exists object_key text,
  add column if not exists public_url text,
  add column if not exists original_filename text,
  add column if not exists size_bytes bigint,
  add column if not exists category text default 'general',
  add column if not exists sort_order int not null default 0,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists migration_status text not null default 'legacy',
  add column if not exists legacy_storage_path text,
  add column if not exists legacy_public_url text,
  add column if not exists legacy_bucket text,
  add column if not exists checksum_sha256 text,
  add column if not exists is_public boolean not null default true,
  add column if not exists migrated_at timestamptz,
  add column if not exists deleted_at timestamptz;

-- Backfill new columns safely for any existing rows (idempotent)
update public.media_assets
set
  original_filename = coalesce(original_filename, file_name),
  size_bytes = coalesce(size_bytes, file_size),
  public_url = coalesce(public_url, file_url),
  category = coalesce(category, folder, 'general'),
  legacy_storage_path = coalesce(legacy_storage_path, file_path),
  legacy_public_url = coalesce(legacy_public_url, file_url),
  legacy_bucket = coalesce(legacy_bucket, 'media')
where
  original_filename is null
  or public_url is null
  or legacy_storage_path is null
  or legacy_public_url is null;

-- Add check constraints idempotently
alter table public.media_assets
  drop constraint if exists media_assets_storage_provider_check;
alter table public.media_assets
  add constraint media_assets_storage_provider_check check (
    storage_provider in ('supabase', 'r2', 'local')
  );

alter table public.media_assets
  drop constraint if exists media_assets_migration_status_check;
alter table public.media_assets
  add constraint media_assets_migration_status_check check (
    migration_status in ('legacy', 'pending', 'verified', 'failed', 'skipped', 'native_r2', 'rolled_back')
  );

-- Unique index on R2 object_key when present (prevents duplicate key registrations)
create unique index if not exists idx_media_assets_object_key_unique
  on public.media_assets(object_key)
  where object_key is not null;

create index if not exists idx_media_assets_storage_provider on public.media_assets(storage_provider);
create index if not exists idx_media_assets_migration_status on public.media_assets(migration_status);
create index if not exists idx_media_assets_category on public.media_assets(category);
create index if not exists idx_media_assets_sort_order on public.media_assets(sort_order, created_at desc);
create index if not exists idx_media_assets_public_active on public.media_assets(is_public, deleted_at);

-- Attach updated_at trigger idempotently
drop trigger if exists set_updated_at on public.media_assets;
select public.create_updated_at_trigger('media_assets');

-- 3. Tighten RLS policies on public.media_assets
-- Public / non-content users can read only public, non-deleted media metadata.
-- Only authorized administrators / content editors can read all records and create, update, or delete.
drop policy if exists "media_assets_read_authenticated" on public.media_assets;
drop policy if exists "media_assets_read_public" on public.media_assets;
drop policy if exists "media_assets_manage_content" on public.media_assets;

create policy "media_assets_read_public"
  on public.media_assets for select
  to anon, authenticated
  using (
    (is_public = true and deleted_at is null)
    or public.has_content_access()
    or public.is_admin()
  );

create policy "media_assets_insert_authorized"
  on public.media_assets for insert
  to authenticated
  with check (
    public.has_content_access() or public.is_admin()
  );

create policy "media_assets_update_authorized"
  on public.media_assets for update
  to authenticated
  using (
    public.has_content_access() or public.is_admin()
  )
  with check (
    public.has_content_access() or public.is_admin()
  );

create policy "media_assets_delete_authorized"
  on public.media_assets for delete
  to authenticated
  using (
    public.has_content_access() or public.is_admin()
  );
