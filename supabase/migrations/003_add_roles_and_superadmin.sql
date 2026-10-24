-- ============================================================================
-- Migration 003: Expand roles to include super_admin and client
-- ============================================================================

-- 1. Update user_roles check constraint
alter table public.user_roles drop constraint if exists user_roles_name_check;

alter table public.user_roles add constraint user_roles_name_check check (
  name in ('super_admin', 'owner', 'admin', 'manager', 'technician', 'accountant', 'content_editor', 'client')
);

-- 2. Update profiles check constraint
alter table public.profiles drop constraint if exists profiles_role_check;

alter table public.profiles add constraint profiles_role_check check (
  role in ('super_admin', 'owner', 'admin', 'manager', 'technician', 'accountant', 'content_editor', 'client')
);

-- 3. Update public.is_admin() to recognize super_admin
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('super_admin', 'owner', 'admin', 'manager')
      and is_active = true
  );
$$;

-- 4. Seed super_admin and client roles
insert into public.user_roles (name, description, permissions)
values 
  ('super_admin', 'Super Administrator with complete unrestricted platform authority', '{"all": true}'::jsonb),
  ('client', 'Registered client with customer portal access to quotes, invoices, and requests', '{"client_portal": true}'::jsonb)
on conflict (name) do update set
  description = excluded.description,
  permissions = excluded.permissions;
