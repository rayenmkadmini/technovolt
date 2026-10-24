-- ============================================================================
-- Migration 004: Fix Privilege Escalation & Secure Customer/Lead RLS Policies
-- ============================================================================

-- 1. Default role on profiles must be 'client', not staff/technician
alter table public.profiles alter column role set default 'client';

-- 2. Trigger function to prevent non-admins from changing their role or active status
create or replace function public.protect_profile_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Prevent privilege escalation: only administrators can change role or is_active
  if (old.role is distinct from new.role or old.is_active is distinct from new.is_active) then
    if not public.is_admin() then
      raise exception 'Unauthorized: Only platform administrators can modify user roles or active status.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists tr_protect_profile_privileged_fields on public.profiles;
create trigger tr_protect_profile_privileged_fields
  before update on public.profiles
  for each row
  execute function public.protect_profile_privileged_fields();

-- 3. Update public.handle_new_user() to default to 'client'
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role, is_active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', ''),
    'client',
    true
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 4. Secure Customers RLS (restrict reads to admins, accountants, or the customer themselves)
drop policy if exists "customers_read_authenticated" on public.customers;
create policy "customers_read_staff_or_own"
  on public.customers for select
  to authenticated
  using (
    public.is_admin()
    or public.has_financial_access()
    or (created_by = auth.uid())
    or (email = (select auth.jwt()->>'email'))
  );

-- 5. Secure Leads RLS (restrict reads to admins, assigned technicians, or the lead email owner)
drop policy if exists "leads_read_authenticated" on public.leads;
create policy "leads_read_staff_or_own"
  on public.leads for select
  to authenticated
  using (
    public.is_admin()
    or assigned_to = auth.uid()
    or (email = (select auth.jwt()->>'email'))
    or exists (
      select 1 from public.customers c
      where c.id = leads.customer_id
        and (c.created_by = auth.uid() or c.email = (select auth.jwt()->>'email'))
    )
  );

-- 6. Secure Appointments RLS
drop policy if exists "appointments_read_authenticated" on public.appointments;
create policy "appointments_read_staff_or_own"
  on public.appointments for select
  to authenticated
  using (
    public.is_admin()
    or assigned_to = auth.uid()
    or created_by = auth.uid()
    or exists (
      select 1 from public.customers c
      where c.id = appointments.customer_id
        and (c.created_by = auth.uid() or c.email = (select auth.jwt()->>'email'))
    )
  );
