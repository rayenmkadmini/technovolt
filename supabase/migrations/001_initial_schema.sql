-- ============================================================================
-- TECHNOVOLT Platform - Initial Database Schema Migration
-- ============================================================================
-- Description: Complete production-ready PostgreSQL schema for the TECHNOVOLT
--              electrical services platform. Includes auth profiles, CMS,
--              services, CRM, invoicing, inventory, and all supporting tables.
-- Currency:    Tunisian Dinar (TND) - 3 decimal places (millimes)
-- Locales:     fr (French), ar (Arabic), en (English)
-- ============================================================================

-- ============================================================================
-- 0. EXTENSIONS & UTILITY FUNCTIONS
-- ============================================================================

-- Enable required extensions
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- Auto-update updated_at timestamp trigger function
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.handle_updated_at() is
  'Trigger function that automatically sets updated_at to current timestamp on row update.';

-- Helper: create updated_at trigger on a table
create or replace function public.create_updated_at_trigger(table_name text)
returns void
language plpgsql
as $$
begin
  execute format(
    'create trigger set_updated_at before update on public.%I for each row execute function public.handle_updated_at();',
    table_name
  );
end;
$$;

-- ============================================================================
-- 1. SEQUENCES FOR REFERENCE NUMBERS
-- ============================================================================

create sequence if not exists public.lead_reference_seq start with 1000 increment by 1;
create sequence if not exists public.customer_reference_seq start with 1000 increment by 1;
create sequence if not exists public.appointment_reference_seq start with 1000 increment by 1;
create sequence if not exists public.quotation_number_seq start with 1000 increment by 1;
create sequence if not exists public.invoice_number_seq start with 1000 increment by 1;
create sequence if not exists public.job_number_seq start with 1000 increment by 1;
create sequence if not exists public.payment_reference_seq start with 1000 increment by 1;
create sequence if not exists public.expense_reference_seq start with 1000 increment by 1;

-- ============================================================================
-- 2. AUTH & USERS
-- ============================================================================

-- 2a. User Roles (lookup table)
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  permissions jsonb default '{}',
  created_at timestamptz not null default now(),

  constraint user_roles_name_check check (
    name in ('owner', 'admin', 'manager', 'technician', 'accountant', 'content_editor')
  )
);

comment on table public.user_roles is
  'Role definitions for platform users. Each role has a name and optional JSONB permissions map.';

-- Seed default roles
insert into public.user_roles (name, description, permissions) values
  ('owner',          'Full platform owner with unrestricted access',                 '{"all": true}'),
  ('admin',          'Administrator with near-full access',                          '{"all": true}'),
  ('manager',        'Operations manager with CRM and financial access',             '{"crm": true, "finance": true, "content": true, "inventory": true}'),
  ('technician',     'Field technician with limited access to work orders',          '{"work_orders": true, "appointments": true}'),
  ('accountant',     'Financial access for invoicing, payments, and expenses',       '{"finance": true, "invoices": true, "payments": true, "expenses": true}'),
  ('content_editor', 'CMS access for managing website content',                     '{"content": true, "media": true, "seo": true}')
on conflict (name) do nothing;

-- 2b. Role Permissions (granular)
create table if not exists public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.user_roles(id) on delete cascade,
  resource text not null,
  action text not null,
  created_at timestamptz not null default now(),

  constraint role_permissions_action_check check (
    action in ('create', 'read', 'update', 'delete')
  ),
  constraint role_permissions_unique unique (role_id, resource, action)
);

comment on table public.role_permissions is
  'Granular CRUD permissions per role and resource type.';

create index if not exists idx_role_permissions_role_id on public.role_permissions(role_id);

-- 2c. Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  phone text,
  role text not null default 'technician',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_role_check check (
    role in ('owner', 'admin', 'manager', 'technician', 'accountant', 'content_editor')
  )
);

comment on table public.profiles is
  'User profiles extending Supabase auth.users. Every authenticated user has a corresponding profile.';

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_is_active on public.profiles(is_active);

select public.create_updated_at_trigger('profiles');

-- Auto-create profile on new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', '')
  );
  return new;
end;
$$;

-- Trigger on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ============================================================================
-- 3. COMPANY SETTINGS (singleton)
-- ============================================================================

create table if not exists public.company_settings (
  id uuid primary key default gen_random_uuid(),
  settings jsonb not null default '{
    "company_name": "TECHNOVOLT",
    "tagline": "",
    "phone": "",
    "whatsapp": "",
    "email": "",
    "address": "",
    "city": "",
    "country": "Tunisia",
    "opening_hours": {},
    "logo_url": "",
    "favicon_url": "",
    "social_links": {},
    "registration_info": {},
    "tax_config": { "default_rate": 19.00 },
    "currency": "TND",
    "default_language": "fr",
    "meta_defaults": {}
  }',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.company_settings is
  'Singleton table for global company configuration. Should contain exactly one row.';

select public.create_updated_at_trigger('company_settings');

-- Ensure only one row can exist
create unique index if not exists idx_company_settings_singleton
  on public.company_settings ((true));

-- Seed default row
insert into public.company_settings (settings)
select '{
  "company_name": "TECHNOVOLT",
  "tagline": "Solutions Électriques Professionnelles",
  "phone": "",
  "whatsapp": "",
  "email": "",
  "address": "",
  "city": "",
  "country": "Tunisia",
  "opening_hours": {},
  "logo_url": "",
  "favicon_url": "",
  "social_links": {},
  "registration_info": {},
  "tax_config": { "default_rate": 19.00 },
  "currency": "TND",
  "default_language": "fr",
  "meta_defaults": {}
}'::jsonb
where not exists (select 1 from public.company_settings);

-- ============================================================================
-- 4. CMS CONTENT
-- ============================================================================

-- 4a. Pages
create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  page_type text not null,
  status text not null default 'draft',
  content jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,

  constraint pages_page_type_check check (
    page_type in ('home', 'about', 'contact', 'privacy', 'terms')
  ),
  constraint pages_status_check check (
    status in ('draft', 'published')
  )
);

comment on table public.pages is
  'CMS pages with structured JSON content and support for translations.';

create index if not exists idx_pages_slug on public.pages(slug);
create index if not exists idx_pages_status on public.pages(status);
create index if not exists idx_pages_page_type on public.pages(page_type);
create index if not exists idx_pages_created_by on public.pages(created_by);

select public.create_updated_at_trigger('pages');

-- 4b. Page Translations
create table if not exists public.page_translations (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages(id) on delete cascade,
  locale text not null,
  title text,
  meta_title text,
  meta_description text,
  content jsonb default '{}',
  is_complete boolean not null default false,

  constraint page_translations_locale_check check (locale in ('fr', 'ar', 'en')),
  constraint page_translations_unique unique (page_id, locale)
);

create index if not exists idx_page_translations_page_id on public.page_translations(page_id);
create index if not exists idx_page_translations_locale on public.page_translations(locale);

-- 4c. Content Blocks
create table if not exists public.content_blocks (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages(id) on delete cascade,
  block_type text not null,
  sort_order int not null default 0,
  content jsonb default '{}',
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_content_blocks_page_id on public.content_blocks(page_id);
create index if not exists idx_content_blocks_sort_order on public.content_blocks(page_id, sort_order);

select public.create_updated_at_trigger('content_blocks');

-- 4d. Content Block Translations
create table if not exists public.content_block_translations (
  id uuid primary key default gen_random_uuid(),
  block_id uuid not null references public.content_blocks(id) on delete cascade,
  locale text not null,
  content jsonb default '{}',

  constraint content_block_translations_locale_check check (locale in ('fr', 'ar', 'en')),
  constraint content_block_translations_unique unique (block_id, locale)
);

create index if not exists idx_content_block_translations_block_id on public.content_block_translations(block_id);

-- ============================================================================
-- 5. SERVICES
-- ============================================================================

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  category text,
  cover_image text,
  gallery text[] default '{}',
  icon text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  price_from decimal(12,3),
  price_to decimal(12,3),
  show_price boolean not null default false,
  estimated_duration text,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,

  constraint services_status_check check (
    status in ('draft', 'published', 'archived')
  ),
  constraint services_price_check check (
    price_from is null or price_to is null or price_from <= price_to
  )
);

comment on table public.services is
  'Electrical services offered by TECHNOVOLT with pricing, media, and status management.';

create index if not exists idx_services_slug on public.services(slug);
create index if not exists idx_services_status on public.services(status);
create index if not exists idx_services_category on public.services(category);
create index if not exists idx_services_is_active on public.services(is_active);
create index if not exists idx_services_sort_order on public.services(sort_order);
create index if not exists idx_services_created_by on public.services(created_by);

select public.create_updated_at_trigger('services');

-- Service Translations
create table if not exists public.service_translations (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  locale text not null,
  title text,
  slug text,
  short_description text,
  full_description text,
  scope_of_work text[] default '{}',
  benefits text[] default '{}',
  meta_title text,
  meta_description text,

  constraint service_translations_locale_check check (locale in ('fr', 'ar', 'en')),
  constraint service_translations_unique unique (service_id, locale)
);

create index if not exists idx_service_translations_service_id on public.service_translations(service_id);
create index if not exists idx_service_translations_locale on public.service_translations(locale);

-- ============================================================================
-- 6. PROJECTS / PORTFOLIO
-- ============================================================================

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references public.services(id) on delete set null,
  cover_image text,
  gallery text[] default '{}',
  before_images text[] default '{}',
  after_images text[] default '{}',
  completion_date date,
  location text,
  is_featured boolean not null default false,
  status text not null default 'draft',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,

  constraint projects_status_check check (
    status in ('draft', 'published')
  )
);

comment on table public.projects is
  'Portfolio projects showcasing completed work, with before/after images.';

create index if not exists idx_projects_service_id on public.projects(service_id);
create index if not exists idx_projects_status on public.projects(status);
create index if not exists idx_projects_is_featured on public.projects(is_featured);
create index if not exists idx_projects_sort_order on public.projects(sort_order);
create index if not exists idx_projects_created_by on public.projects(created_by);

select public.create_updated_at_trigger('projects');

-- Project Translations
create table if not exists public.project_translations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  locale text not null,
  title text,
  description text,
  location_label text,
  meta_title text,
  meta_description text,

  constraint project_translations_locale_check check (locale in ('fr', 'ar', 'en')),
  constraint project_translations_unique unique (project_id, locale)
);

create index if not exists idx_project_translations_project_id on public.project_translations(project_id);
create index if not exists idx_project_translations_locale on public.project_translations(locale);

-- ============================================================================
-- 7. MEDIA ASSETS
-- ============================================================================

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  file_path text not null,
  file_url text not null,
  file_type text not null,
  mime_type text,
  file_size bigint,
  width int,
  height int,
  alt_text_fr text,
  alt_text_ar text,
  alt_text_en text,
  folder text default 'general',
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),

  constraint media_assets_file_type_check check (
    file_type in ('image', 'document', 'video')
  )
);

comment on table public.media_assets is
  'Central media library for all uploaded files (images, documents, videos).';

create index if not exists idx_media_assets_file_type on public.media_assets(file_type);
create index if not exists idx_media_assets_folder on public.media_assets(folder);
create index if not exists idx_media_assets_uploaded_by on public.media_assets(uploaded_by);
create index if not exists idx_media_assets_created_at on public.media_assets(created_at desc);

-- ============================================================================
-- 8. TESTIMONIALS
-- ============================================================================

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_role text,
  rating int not null default 5,
  is_verified boolean not null default false,
  is_featured boolean not null default false,
  status text not null default 'pending',
  service_id uuid references public.services(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint testimonials_rating_check check (rating >= 1 and rating <= 5),
  constraint testimonials_status_check check (
    status in ('pending', 'approved', 'rejected')
  )
);

comment on table public.testimonials is
  'Customer testimonials and reviews with moderation workflow.';

create index if not exists idx_testimonials_status on public.testimonials(status);
create index if not exists idx_testimonials_is_featured on public.testimonials(is_featured);
create index if not exists idx_testimonials_service_id on public.testimonials(service_id);

select public.create_updated_at_trigger('testimonials');

-- Testimonial Translations
create table if not exists public.testimonial_translations (
  id uuid primary key default gen_random_uuid(),
  testimonial_id uuid not null references public.testimonials(id) on delete cascade,
  locale text not null,
  content text,
  customer_name text,

  constraint testimonial_translations_locale_check check (locale in ('fr', 'ar', 'en')),
  constraint testimonial_translations_unique unique (testimonial_id, locale)
);

create index if not exists idx_testimonial_translations_testimonial_id on public.testimonial_translations(testimonial_id);

-- ============================================================================
-- 9. FAQs
-- ============================================================================

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references public.services(id) on delete set null,
  page_id uuid references public.pages(id) on delete set null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.faqs is
  'Frequently asked questions, optionally linked to a service or page.';

create index if not exists idx_faqs_service_id on public.faqs(service_id);
create index if not exists idx_faqs_page_id on public.faqs(page_id);
create index if not exists idx_faqs_is_active on public.faqs(is_active);
create index if not exists idx_faqs_sort_order on public.faqs(sort_order);

select public.create_updated_at_trigger('faqs');

-- FAQ Translations
create table if not exists public.faq_translations (
  id uuid primary key default gen_random_uuid(),
  faq_id uuid not null references public.faqs(id) on delete cascade,
  locale text not null,
  question text,
  answer text,

  constraint faq_translations_locale_check check (locale in ('fr', 'ar', 'en')),
  constraint faq_translations_unique unique (faq_id, locale)
);

create index if not exists idx_faq_translations_faq_id on public.faq_translations(faq_id);

-- ============================================================================
-- 10. SUPPLIERS (needed before products and expenses)
-- ============================================================================

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_person text,
  phone text,
  email text,
  address text,
  notes text,
  outstanding_amount decimal(12,3) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.suppliers is
  'Supplier/vendor directory for procurement and inventory management.';

create index if not exists idx_suppliers_is_active on public.suppliers(is_active);

select public.create_updated_at_trigger('suppliers');

-- ============================================================================
-- 11. CUSTOMERS
-- ============================================================================

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  reference_number text not null unique default ('CUS-' || lpad(nextval('public.customer_reference_seq')::text, 6, '0')),
  full_name text not null,
  phone text,
  email text,
  company_name text,
  tax_id text,
  notes text,
  is_active boolean not null default true,
  total_spent decimal(12,3) not null default 0,
  outstanding_balance decimal(12,3) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

comment on table public.customers is
  'Customer records for CRM, invoicing, and project tracking.';

create index if not exists idx_customers_reference_number on public.customers(reference_number);
create index if not exists idx_customers_full_name on public.customers(full_name);
create index if not exists idx_customers_phone on public.customers(phone);
create index if not exists idx_customers_email on public.customers(email);
create index if not exists idx_customers_is_active on public.customers(is_active);
create index if not exists idx_customers_created_by on public.customers(created_by);

select public.create_updated_at_trigger('customers');

-- Customer Addresses
create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  label text,
  address_line1 text,
  address_line2 text,
  city text,
  governorate text,
  postal_code text,
  country text not null default 'Tunisia',
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_customer_addresses_customer_id on public.customer_addresses(customer_id);

-- ============================================================================
-- 12. CRM - LEADS
-- ============================================================================

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  reference_number text not null unique default ('LD-' || lpad(nextval('public.lead_reference_seq')::text, 6, '0')),
  full_name text not null,
  phone text,
  email text,
  service_id uuid references public.services(id) on delete set null,
  source text not null default 'website',
  message text,
  address text,
  preferred_date timestamptz,
  preferred_time text,
  preferred_contact text default 'phone',
  photos text[] default '{}',
  status text not null default 'new',
  assigned_to uuid references auth.users(id) on delete set null,
  follow_up_date date,
  customer_id uuid references public.customers(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint leads_source_check check (
    source in ('website', 'phone', 'whatsapp', 'referral', 'other')
  ),
  constraint leads_preferred_contact_check check (
    preferred_contact is null or preferred_contact in ('phone', 'whatsapp', 'email')
  ),
  constraint leads_status_check check (
    status in ('new', 'contacted', 'qualified', 'quotation_sent', 'won', 'lost')
  )
);

comment on table public.leads is
  'Sales leads and inquiries from various sources. Part of the CRM pipeline.';

create index if not exists idx_leads_reference_number on public.leads(reference_number);
create index if not exists idx_leads_status on public.leads(status);
create index if not exists idx_leads_source on public.leads(source);
create index if not exists idx_leads_assigned_to on public.leads(assigned_to);
create index if not exists idx_leads_service_id on public.leads(service_id);
create index if not exists idx_leads_customer_id on public.leads(customer_id);
create index if not exists idx_leads_follow_up_date on public.leads(follow_up_date);
create index if not exists idx_leads_created_at on public.leads(created_at desc);

select public.create_updated_at_trigger('leads');

-- Lead Notes
create table if not exists public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  note text not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists idx_lead_notes_lead_id on public.lead_notes(lead_id);
create index if not exists idx_lead_notes_created_by on public.lead_notes(created_by);

-- ============================================================================
-- 13. APPOINTMENTS
-- ============================================================================

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  reference_number text not null unique default ('APT-' || lpad(nextval('public.appointment_reference_seq')::text, 6, '0')),
  customer_id uuid not null references public.customers(id) on delete restrict,
  lead_id uuid references public.leads(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  scheduled_date date not null,
  scheduled_time time not null,
  estimated_duration interval,
  address text,
  assigned_to uuid references auth.users(id) on delete set null,
  status text not null default 'requested',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,

  constraint appointments_status_check check (
    status in ('requested', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled')
  )
);

comment on table public.appointments is
  'Scheduled appointments for site visits, inspections, and service calls.';

create index if not exists idx_appointments_reference_number on public.appointments(reference_number);
create index if not exists idx_appointments_customer_id on public.appointments(customer_id);
create index if not exists idx_appointments_lead_id on public.appointments(lead_id);
create index if not exists idx_appointments_service_id on public.appointments(service_id);
create index if not exists idx_appointments_assigned_to on public.appointments(assigned_to);
create index if not exists idx_appointments_scheduled_date on public.appointments(scheduled_date);
create index if not exists idx_appointments_status on public.appointments(status);
create index if not exists idx_appointments_created_by on public.appointments(created_by);

select public.create_updated_at_trigger('appointments');

-- ============================================================================
-- 14. PRODUCTS & INVENTORY
-- ============================================================================

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  name_fr text,
  name_ar text,
  name_en text,
  category text,
  purchase_cost decimal(12,3),
  sale_price decimal(12,3),
  quantity decimal(10,3) not null default 0,
  low_stock_threshold decimal(10,3) not null default 5,
  unit text not null default 'unit',
  supplier_id uuid references public.suppliers(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.products is
  'Products and materials used in electrical services, with inventory tracking.';

create index if not exists idx_products_sku on public.products(sku);
create index if not exists idx_products_category on public.products(category);
create index if not exists idx_products_supplier_id on public.products(supplier_id);
create index if not exists idx_products_is_active on public.products(is_active);

select public.create_updated_at_trigger('products');

-- Inventory Movements
create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  movement_type text not null,
  quantity decimal(10,3) not null,
  reference_type text,
  reference_id uuid,
  reason text,
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,

  constraint inventory_movements_type_check check (
    movement_type in ('purchase', 'consumption', 'adjustment', 'return')
  )
);

comment on table public.inventory_movements is
  'Audit trail of all inventory changes (purchases, usage, adjustments, returns).';

create index if not exists idx_inventory_movements_product_id on public.inventory_movements(product_id);
create index if not exists idx_inventory_movements_movement_type on public.inventory_movements(movement_type);
create index if not exists idx_inventory_movements_created_at on public.inventory_movements(created_at desc);
create index if not exists idx_inventory_movements_created_by on public.inventory_movements(created_by);
create index if not exists idx_inventory_movements_reference on public.inventory_movements(reference_type, reference_id);

-- ============================================================================
-- 15. QUOTATIONS
-- ============================================================================

create table if not exists public.quotations (
  id uuid primary key default gen_random_uuid(),
  quotation_number text not null unique default ('QT-' || lpad(nextval('public.quotation_number_seq')::text, 6, '0')),
  customer_id uuid not null references public.customers(id) on delete restrict,
  lead_id uuid references public.leads(id) on delete set null,
  work_order_id uuid, -- FK added after work_orders table creation
  issue_date date not null default current_date,
  valid_until date,
  subtotal decimal(12,3) not null default 0,
  tax_rate decimal(5,2) not null default 19.00,
  tax_amount decimal(12,3) not null default 0,
  discount_amount decimal(12,3) not null default 0,
  discount_type text default 'fixed',
  total decimal(12,3) not null default 0,
  currency text not null default 'TND',
  terms text,
  internal_notes text,
  customer_notes text,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,

  constraint quotations_discount_type_check check (
    discount_type is null or discount_type in ('fixed', 'percentage')
  ),
  constraint quotations_status_check check (
    status in ('draft', 'sent', 'accepted', 'rejected', 'expired', 'converted')
  )
);

comment on table public.quotations is
  'Price quotations / estimates sent to customers before work begins.';

create index if not exists idx_quotations_quotation_number on public.quotations(quotation_number);
create index if not exists idx_quotations_customer_id on public.quotations(customer_id);
create index if not exists idx_quotations_lead_id on public.quotations(lead_id);
create index if not exists idx_quotations_status on public.quotations(status);
create index if not exists idx_quotations_issue_date on public.quotations(issue_date desc);
create index if not exists idx_quotations_created_by on public.quotations(created_by);

select public.create_updated_at_trigger('quotations');

-- Quotation Items
create table if not exists public.quotation_items (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotations(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  description text not null,
  quantity decimal(10,3) not null default 1,
  unit text,
  unit_price decimal(12,3) not null default 0,
  discount decimal(12,3) not null default 0,
  tax_rate decimal(5,2) not null default 0,
  total decimal(12,3) not null default 0,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_quotation_items_quotation_id on public.quotation_items(quotation_id);
create index if not exists idx_quotation_items_service_id on public.quotation_items(service_id);
create index if not exists idx_quotation_items_product_id on public.quotation_items(product_id);

-- ============================================================================
-- 16. WORK ORDERS
-- ============================================================================

create table if not exists public.work_orders (
  id uuid primary key default gen_random_uuid(),
  job_number text not null unique default ('WO-' || lpad(nextval('public.job_number_seq')::text, 6, '0')),
  customer_id uuid not null references public.customers(id) on delete restrict,
  appointment_id uuid references public.appointments(id) on delete set null,
  quotation_id uuid references public.quotations(id) on delete set null,
  description text,
  assigned_to uuid references auth.users(id) on delete set null,
  status text not null default 'pending',
  start_date date,
  completion_date date,
  labor_hours decimal(6,2),
  labor_rate decimal(12,3),
  additional_costs decimal(12,3) not null default 0,
  total_cost decimal(12,3),
  notes text,
  completion_notes text,
  completion_photos text[] default '{}',
  customer_signature text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,

  constraint work_orders_status_check check (
    status in ('pending', 'in_progress', 'completed', 'on_hold', 'cancelled')
  )
);

comment on table public.work_orders is
  'Work orders tracking jobs from assignment through completion, with labor and cost tracking.';

create index if not exists idx_work_orders_job_number on public.work_orders(job_number);
create index if not exists idx_work_orders_customer_id on public.work_orders(customer_id);
create index if not exists idx_work_orders_appointment_id on public.work_orders(appointment_id);
create index if not exists idx_work_orders_quotation_id on public.work_orders(quotation_id);
create index if not exists idx_work_orders_assigned_to on public.work_orders(assigned_to);
create index if not exists idx_work_orders_status on public.work_orders(status);
create index if not exists idx_work_orders_start_date on public.work_orders(start_date);
create index if not exists idx_work_orders_created_by on public.work_orders(created_by);

select public.create_updated_at_trigger('work_orders');

-- Add the deferred FK from quotations -> work_orders
alter table public.quotations
  add constraint quotations_work_order_id_fkey
  foreign key (work_order_id) references public.work_orders(id)
  on delete set null;

create index if not exists idx_quotations_work_order_id on public.quotations(work_order_id);

-- Work Order Items
create table if not exists public.work_order_items (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  description text,
  quantity decimal(10,3) not null default 1,
  unit_price decimal(12,3) not null default 0,
  total decimal(12,3) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_work_order_items_work_order_id on public.work_order_items(work_order_id);
create index if not exists idx_work_order_items_product_id on public.work_order_items(product_id);

-- ============================================================================
-- 17. INVOICES
-- ============================================================================

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique default ('INV-' || lpad(nextval('public.invoice_number_seq')::text, 6, '0')),
  quotation_id uuid references public.quotations(id) on delete set null,
  work_order_id uuid references public.work_orders(id) on delete set null,
  customer_id uuid not null references public.customers(id) on delete restrict,
  issue_date date not null default current_date,
  due_date date,
  subtotal decimal(12,3) not null default 0,
  tax_rate decimal(5,2) not null default 19.00,
  tax_amount decimal(12,3) not null default 0,
  discount_amount decimal(12,3) not null default 0,
  total decimal(12,3) not null default 0,
  amount_paid decimal(12,3) not null default 0,
  balance_due decimal(12,3) not null default 0,
  currency text not null default 'TND',
  payment_terms text,
  internal_notes text,
  customer_notes text,
  status text not null default 'draft',
  issued_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,

  constraint invoices_status_check check (
    status in ('draft', 'issued', 'partially_paid', 'paid', 'overdue', 'cancelled', 'credited')
  )
);

comment on table public.invoices is
  'Customer invoices with line items, tax calculations, and payment status tracking.';

create index if not exists idx_invoices_invoice_number on public.invoices(invoice_number);
create index if not exists idx_invoices_customer_id on public.invoices(customer_id);
create index if not exists idx_invoices_quotation_id on public.invoices(quotation_id);
create index if not exists idx_invoices_work_order_id on public.invoices(work_order_id);
create index if not exists idx_invoices_status on public.invoices(status);
create index if not exists idx_invoices_issue_date on public.invoices(issue_date desc);
create index if not exists idx_invoices_due_date on public.invoices(due_date);
create index if not exists idx_invoices_created_by on public.invoices(created_by);

select public.create_updated_at_trigger('invoices');

-- Invoice Items
create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  description text not null,
  quantity decimal(10,3) not null default 1,
  unit text,
  unit_price decimal(12,3) not null default 0,
  discount decimal(12,3) not null default 0,
  tax_rate decimal(5,2) not null default 0,
  total decimal(12,3) not null default 0,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_invoice_items_invoice_id on public.invoice_items(invoice_id);
create index if not exists idx_invoice_items_service_id on public.invoice_items(service_id);
create index if not exists idx_invoice_items_product_id on public.invoice_items(product_id);

-- ============================================================================
-- 18. PAYMENTS
-- ============================================================================

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  payment_reference text not null unique default ('PAY-' || lpad(nextval('public.payment_reference_seq')::text, 6, '0')),
  customer_id uuid references public.customers(id) on delete set null,
  amount decimal(12,3) not null,
  currency text not null default 'TND',
  payment_date date not null default current_date,
  payment_method text not null default 'cash',
  receipt_reference text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,

  constraint payments_method_check check (
    payment_method in ('cash', 'bank_transfer', 'card', 'other')
  ),
  constraint payments_amount_positive check (amount > 0)
);

comment on table public.payments is
  'Payment records received from customers, allocated against invoices.';

create index if not exists idx_payments_payment_reference on public.payments(payment_reference);
create index if not exists idx_payments_customer_id on public.payments(customer_id);
create index if not exists idx_payments_payment_date on public.payments(payment_date desc);
create index if not exists idx_payments_payment_method on public.payments(payment_method);
create index if not exists idx_payments_created_by on public.payments(created_by);

select public.create_updated_at_trigger('payments');

-- Payment Allocations (links payments to invoices)
create table if not exists public.payment_allocations (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete restrict,
  amount decimal(12,3) not null,
  created_at timestamptz not null default now(),

  constraint payment_allocations_amount_positive check (amount > 0)
);

create index if not exists idx_payment_allocations_payment_id on public.payment_allocations(payment_id);
create index if not exists idx_payment_allocations_invoice_id on public.payment_allocations(invoice_id);

-- ============================================================================
-- 19. EXPENSES
-- ============================================================================

-- Expense Categories
create table if not exists public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_fr text,
  name_ar text,
  name_en text,
  icon text,
  is_system boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.expense_categories is
  'Categories for expense classification (materials, fuel, tools, etc.).';

create index if not exists idx_expense_categories_is_active on public.expense_categories(is_active);

-- Seed default expense categories
insert into public.expense_categories (name, name_fr, name_ar, name_en, icon, is_system) values
  ('Matériel',       'Matériel',       'المواد',        'Materials',       'package',       true),
  ('Carburant',      'Carburant',      'الوقود',        'Fuel',            'fuel',          true),
  ('Outillage',      'Outillage',      'الأدوات',       'Tools',           'wrench',        true),
  ('Transport',      'Transport',      'النقل',         'Transportation',  'truck',         true),
  ('Sous-traitance', 'Sous-traitance', 'المقاولة الفرعية', 'Subcontracting', 'users',        true),
  ('Bureau',         'Bureau',         'المكتب',        'Office',          'building',      true),
  ('Divers',         'Divers',         'متفرقات',       'Miscellaneous',   'more-horizontal', true)
on conflict do nothing;

-- Expenses
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('EXP-' || lpad(nextval('public.expense_reference_seq')::text, 6, '0')),
  expense_date date not null default current_date,
  category_id uuid references public.expense_categories(id) on delete set null,
  supplier_id uuid references public.suppliers(id) on delete set null,
  description text,
  amount decimal(12,3) not null,
  currency text not null default 'TND',
  tax_amount decimal(12,3) not null default 0,
  payment_method text not null default 'cash',
  payment_status text not null default 'paid',
  receipt_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,

  constraint expenses_payment_method_check check (
    payment_method in ('cash', 'bank_transfer', 'card', 'other')
  ),
  constraint expenses_payment_status_check check (
    payment_status in ('pending', 'paid')
  ),
  constraint expenses_amount_positive check (amount > 0)
);

comment on table public.expenses is
  'Business expense records for cost tracking and reporting.';

create index if not exists idx_expenses_reference on public.expenses(reference);
create index if not exists idx_expenses_expense_date on public.expenses(expense_date desc);
create index if not exists idx_expenses_category_id on public.expenses(category_id);
create index if not exists idx_expenses_supplier_id on public.expenses(supplier_id);
create index if not exists idx_expenses_payment_status on public.expenses(payment_status);
create index if not exists idx_expenses_created_by on public.expenses(created_by);

select public.create_updated_at_trigger('expenses');

-- ============================================================================
-- 20. PURCHASE RECORDS
-- ============================================================================

create table if not exists public.purchase_records (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  product_id uuid references public.products(id) on delete set null,
  purchase_date date not null default current_date,
  description text,
  quantity decimal(10,3),
  unit_price decimal(12,3),
  total decimal(12,3),
  payment_status text not null default 'pending',
  expense_id uuid references public.expenses(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,

  constraint purchase_records_payment_status_check check (
    payment_status in ('pending', 'paid')
  )
);

comment on table public.purchase_records is
  'Purchase records from suppliers, linked to products and expenses.';

create index if not exists idx_purchase_records_supplier_id on public.purchase_records(supplier_id);
create index if not exists idx_purchase_records_product_id on public.purchase_records(product_id);
create index if not exists idx_purchase_records_purchase_date on public.purchase_records(purchase_date desc);
create index if not exists idx_purchase_records_expense_id on public.purchase_records(expense_id);
create index if not exists idx_purchase_records_created_by on public.purchase_records(created_by);

-- ============================================================================
-- 21. SEO METADATA & REDIRECTS
-- ============================================================================

create table if not exists public.seo_metadata (
  id uuid primary key default gen_random_uuid(),
  page_type text not null,
  page_id uuid not null,
  locale text not null,
  title text,
  description text,
  canonical_url text,
  og_title text,
  og_description text,
  og_image text,
  no_index boolean not null default false,
  structured_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint seo_metadata_locale_check check (locale in ('fr', 'ar', 'en')),
  constraint seo_metadata_unique unique (page_type, page_id, locale)
);

comment on table public.seo_metadata is
  'SEO metadata for any page/entity type, supporting Open Graph and structured data.';

create index if not exists idx_seo_metadata_page_type_page_id on public.seo_metadata(page_type, page_id);
create index if not exists idx_seo_metadata_locale on public.seo_metadata(locale);

select public.create_updated_at_trigger('seo_metadata');

-- Redirects
create table if not exists public.redirects (
  id uuid primary key default gen_random_uuid(),
  from_path text not null unique,
  to_path text not null,
  status_code int not null default 301,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),

  constraint redirects_status_code_check check (status_code in (301, 302, 307, 308))
);

comment on table public.redirects is
  'URL redirect rules for SEO and legacy URL management.';

create index if not exists idx_redirects_from_path on public.redirects(from_path);
create index if not exists idx_redirects_is_active on public.redirects(is_active);

-- ============================================================================
-- 22. NOTIFICATIONS
-- ============================================================================

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  message text,
  data jsonb default '{}',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.notifications is
  'In-app notification system for alerting users about events and actions.';

create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_is_read on public.notifications(user_id, is_read);
create index if not exists idx_notifications_type on public.notifications(type);
create index if not exists idx_notifications_created_at on public.notifications(created_at desc);

-- ============================================================================
-- 23. ACTIVITY LOGS
-- ============================================================================

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  details jsonb default '{}',
  ip_address text,
  created_at timestamptz not null default now()
);

comment on table public.activity_logs is
  'Audit trail of user actions across the platform for compliance and debugging.';

create index if not exists idx_activity_logs_user_id on public.activity_logs(user_id);
create index if not exists idx_activity_logs_action on public.activity_logs(action);
create index if not exists idx_activity_logs_resource on public.activity_logs(resource_type, resource_id);
create index if not exists idx_activity_logs_created_at on public.activity_logs(created_at desc);

-- ============================================================================
-- 24. ROW LEVEL SECURITY - ENABLE ON ALL TABLES
-- ============================================================================

alter table public.user_roles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.profiles enable row level security;
alter table public.company_settings enable row level security;
alter table public.pages enable row level security;
alter table public.page_translations enable row level security;
alter table public.content_blocks enable row level security;
alter table public.content_block_translations enable row level security;
alter table public.services enable row level security;
alter table public.service_translations enable row level security;
alter table public.projects enable row level security;
alter table public.project_translations enable row level security;
alter table public.media_assets enable row level security;
alter table public.testimonials enable row level security;
alter table public.testimonial_translations enable row level security;
alter table public.faqs enable row level security;
alter table public.faq_translations enable row level security;
alter table public.suppliers enable row level security;
alter table public.customers enable row level security;
alter table public.customer_addresses enable row level security;
alter table public.leads enable row level security;
alter table public.lead_notes enable row level security;
alter table public.appointments enable row level security;
alter table public.products enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.quotations enable row level security;
alter table public.quotation_items enable row level security;
alter table public.work_orders enable row level security;
alter table public.work_order_items enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;
alter table public.payment_allocations enable row level security;
alter table public.expense_categories enable row level security;
alter table public.expenses enable row level security;
alter table public.purchase_records enable row level security;
alter table public.seo_metadata enable row level security;
alter table public.redirects enable row level security;
alter table public.notifications enable row level security;
alter table public.activity_logs enable row level security;

-- ============================================================================
-- 25. RLS HELPER FUNCTIONS
-- ============================================================================

-- Check if the current user has an admin-level role (owner, admin, manager)
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
      and role in ('owner', 'admin', 'manager')
      and is_active = true
  );
$$;

-- Check if the current user has a specific role
create or replace function public.has_role(required_role text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = required_role
      and is_active = true
  );
$$;

-- Check if the current user is any authenticated active user
create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and is_active = true
  );
$$;

-- Check if the current user has financial access
create or replace function public.has_financial_access()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('owner', 'admin', 'manager', 'accountant')
      and is_active = true
  );
$$;

-- Check if the current user has content editing access
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
      and role in ('owner', 'admin', 'manager', 'content_editor')
      and is_active = true
  );
$$;

-- ============================================================================
-- 26. RLS POLICIES - PUBLIC CONTENT (anonymous read for published content)
-- ============================================================================

-- --- User Roles ---
create policy "user_roles_read_authenticated"
  on public.user_roles for select
  to authenticated
  using (true);

create policy "user_roles_manage_admin"
  on public.user_roles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- --- Role Permissions ---
create policy "role_permissions_read_authenticated"
  on public.role_permissions for select
  to authenticated
  using (true);

create policy "role_permissions_manage_admin"
  on public.role_permissions for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- --- Profiles ---
create policy "profiles_read_own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_manage_admin"
  on public.profiles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- --- Company Settings ---
create policy "company_settings_read_public"
  on public.company_settings for select
  to anon, authenticated
  using (true);

create policy "company_settings_manage_admin"
  on public.company_settings for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- --- Pages (public read for published) ---
create policy "pages_read_published"
  on public.pages for select
  to anon, authenticated
  using (status = 'published' or public.has_content_access());

create policy "pages_manage_content"
  on public.pages for all
  to authenticated
  using (public.has_content_access())
  with check (public.has_content_access());

-- --- Page Translations ---
create policy "page_translations_read_public"
  on public.page_translations for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.pages
      where pages.id = page_translations.page_id
        and (pages.status = 'published' or public.has_content_access())
    )
  );

create policy "page_translations_manage_content"
  on public.page_translations for all
  to authenticated
  using (public.has_content_access())
  with check (public.has_content_access());

-- --- Content Blocks ---
create policy "content_blocks_read_public"
  on public.content_blocks for select
  to anon, authenticated
  using (
    is_visible = true and exists (
      select 1 from public.pages
      where pages.id = content_blocks.page_id
        and pages.status = 'published'
    )
    or public.has_content_access()
  );

create policy "content_blocks_manage_content"
  on public.content_blocks for all
  to authenticated
  using (public.has_content_access())
  with check (public.has_content_access());

-- --- Content Block Translations ---
create policy "content_block_translations_read_public"
  on public.content_block_translations for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.content_blocks cb
      join public.pages p on p.id = cb.page_id
      where cb.id = content_block_translations.block_id
        and cb.is_visible = true
        and p.status = 'published'
    )
    or public.has_content_access()
  );

create policy "content_block_translations_manage_content"
  on public.content_block_translations for all
  to authenticated
  using (public.has_content_access())
  with check (public.has_content_access());

-- --- Services (public read for published) ---
create policy "services_read_published"
  on public.services for select
  to anon, authenticated
  using (status = 'published' and is_active = true or public.has_content_access());

create policy "services_manage_content"
  on public.services for all
  to authenticated
  using (public.has_content_access())
  with check (public.has_content_access());

-- --- Service Translations ---
create policy "service_translations_read_public"
  on public.service_translations for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.services
      where services.id = service_translations.service_id
        and services.status = 'published'
        and services.is_active = true
    )
    or public.has_content_access()
  );

create policy "service_translations_manage_content"
  on public.service_translations for all
  to authenticated
  using (public.has_content_access())
  with check (public.has_content_access());

-- --- Projects (public read for published) ---
create policy "projects_read_published"
  on public.projects for select
  to anon, authenticated
  using (status = 'published' or public.has_content_access());

create policy "projects_manage_content"
  on public.projects for all
  to authenticated
  using (public.has_content_access())
  with check (public.has_content_access());

-- --- Project Translations ---
create policy "project_translations_read_public"
  on public.project_translations for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_translations.project_id
        and projects.status = 'published'
    )
    or public.has_content_access()
  );

create policy "project_translations_manage_content"
  on public.project_translations for all
  to authenticated
  using (public.has_content_access())
  with check (public.has_content_access());

-- --- Media Assets ---
create policy "media_assets_read_authenticated"
  on public.media_assets for select
  to authenticated
  using (public.is_active_user());

-- Allow public read for media (needed for website images)
create policy "media_assets_read_public"
  on public.media_assets for select
  to anon
  using (true);

create policy "media_assets_manage_content"
  on public.media_assets for all
  to authenticated
  using (public.has_content_access() or public.is_admin())
  with check (public.has_content_access() or public.is_admin());

-- --- Testimonials (public read for approved) ---
create policy "testimonials_read_approved"
  on public.testimonials for select
  to anon, authenticated
  using (status = 'approved' or public.has_content_access());

create policy "testimonials_manage_content"
  on public.testimonials for all
  to authenticated
  using (public.has_content_access())
  with check (public.has_content_access());

-- --- Testimonial Translations ---
create policy "testimonial_translations_read_public"
  on public.testimonial_translations for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.testimonials
      where testimonials.id = testimonial_translations.testimonial_id
        and testimonials.status = 'approved'
    )
    or public.has_content_access()
  );

create policy "testimonial_translations_manage_content"
  on public.testimonial_translations for all
  to authenticated
  using (public.has_content_access())
  with check (public.has_content_access());

-- --- FAQs (public read for active) ---
create policy "faqs_read_active"
  on public.faqs for select
  to anon, authenticated
  using (is_active = true or public.has_content_access());

create policy "faqs_manage_content"
  on public.faqs for all
  to authenticated
  using (public.has_content_access())
  with check (public.has_content_access());

-- --- FAQ Translations ---
create policy "faq_translations_read_public"
  on public.faq_translations for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.faqs
      where faqs.id = faq_translations.faq_id
        and faqs.is_active = true
    )
    or public.has_content_access()
  );

create policy "faq_translations_manage_content"
  on public.faq_translations for all
  to authenticated
  using (public.has_content_access())
  with check (public.has_content_access());

-- --- SEO Metadata (public read) ---
create policy "seo_metadata_read_public"
  on public.seo_metadata for select
  to anon, authenticated
  using (true);

create policy "seo_metadata_manage_content"
  on public.seo_metadata for all
  to authenticated
  using (public.has_content_access())
  with check (public.has_content_access());

-- --- Redirects (public read for active) ---
create policy "redirects_read_active"
  on public.redirects for select
  to anon, authenticated
  using (is_active = true or public.has_content_access());

create policy "redirects_manage_content"
  on public.redirects for all
  to authenticated
  using (public.has_content_access())
  with check (public.has_content_access());

-- ============================================================================
-- 27. RLS POLICIES - INTERNAL / BUSINESS DATA (authenticated only)
-- ============================================================================

-- --- Suppliers ---
create policy "suppliers_read_authenticated"
  on public.suppliers for select
  to authenticated
  using (public.is_active_user());

create policy "suppliers_manage_admin"
  on public.suppliers for all
  to authenticated
  using (public.is_admin() or public.has_financial_access())
  with check (public.is_admin() or public.has_financial_access());

-- --- Customers ---
create policy "customers_read_authenticated"
  on public.customers for select
  to authenticated
  using (public.is_active_user());

create policy "customers_manage_admin"
  on public.customers for all
  to authenticated
  using (public.is_admin() or public.has_financial_access())
  with check (public.is_admin() or public.has_financial_access());

-- --- Customer Addresses ---
create policy "customer_addresses_read_authenticated"
  on public.customer_addresses for select
  to authenticated
  using (public.is_active_user());

create policy "customer_addresses_manage_admin"
  on public.customer_addresses for all
  to authenticated
  using (public.is_admin() or public.has_financial_access())
  with check (public.is_admin() or public.has_financial_access());

-- --- Leads ---
create policy "leads_read_authenticated"
  on public.leads for select
  to authenticated
  using (public.is_active_user());

-- Allow anonymous insert for website contact forms
create policy "leads_insert_public"
  on public.leads for insert
  to anon
  with check (true);

create policy "leads_manage_admin"
  on public.leads for all
  to authenticated
  using (public.is_admin() or assigned_to = auth.uid())
  with check (public.is_admin());

-- --- Lead Notes ---
create policy "lead_notes_read_authenticated"
  on public.lead_notes for select
  to authenticated
  using (public.is_active_user());

create policy "lead_notes_insert_authenticated"
  on public.lead_notes for insert
  to authenticated
  with check (public.is_active_user());

create policy "lead_notes_manage_admin"
  on public.lead_notes for all
  to authenticated
  using (public.is_admin() or created_by = auth.uid())
  with check (public.is_admin() or created_by = auth.uid());

-- --- Appointments ---
create policy "appointments_read_authenticated"
  on public.appointments for select
  to authenticated
  using (
    public.is_admin()
    or assigned_to = auth.uid()
    or created_by = auth.uid()
  );

create policy "appointments_manage_admin"
  on public.appointments for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Technicians can update their assigned appointments
create policy "appointments_update_assigned"
  on public.appointments for update
  to authenticated
  using (assigned_to = auth.uid() and public.is_active_user())
  with check (assigned_to = auth.uid());

-- --- Products ---
create policy "products_read_authenticated"
  on public.products for select
  to authenticated
  using (public.is_active_user());

create policy "products_manage_admin"
  on public.products for all
  to authenticated
  using (public.is_admin() or public.has_financial_access())
  with check (public.is_admin() or public.has_financial_access());

-- --- Inventory Movements ---
create policy "inventory_movements_read_authenticated"
  on public.inventory_movements for select
  to authenticated
  using (public.is_active_user());

create policy "inventory_movements_insert_authenticated"
  on public.inventory_movements for insert
  to authenticated
  with check (public.is_active_user());

create policy "inventory_movements_manage_admin"
  on public.inventory_movements for all
  to authenticated
  using (public.is_admin() or public.has_financial_access())
  with check (public.is_admin() or public.has_financial_access());

-- --- Quotations ---
create policy "quotations_read_financial"
  on public.quotations for select
  to authenticated
  using (public.has_financial_access() or created_by = auth.uid());

create policy "quotations_manage_financial"
  on public.quotations for all
  to authenticated
  using (public.has_financial_access())
  with check (public.has_financial_access());

-- --- Quotation Items ---
create policy "quotation_items_read_financial"
  on public.quotation_items for select
  to authenticated
  using (
    exists (
      select 1 from public.quotations
      where quotations.id = quotation_items.quotation_id
        and (public.has_financial_access() or quotations.created_by = auth.uid())
    )
  );

create policy "quotation_items_manage_financial"
  on public.quotation_items for all
  to authenticated
  using (public.has_financial_access())
  with check (public.has_financial_access());

-- --- Work Orders ---
create policy "work_orders_read_authenticated"
  on public.work_orders for select
  to authenticated
  using (
    public.is_admin()
    or public.has_financial_access()
    or assigned_to = auth.uid()
    or created_by = auth.uid()
  );

create policy "work_orders_manage_admin"
  on public.work_orders for all
  to authenticated
  using (public.is_admin() or public.has_financial_access())
  with check (public.is_admin() or public.has_financial_access());

-- Technicians can update their assigned work orders
create policy "work_orders_update_assigned"
  on public.work_orders for update
  to authenticated
  using (assigned_to = auth.uid() and public.is_active_user())
  with check (assigned_to = auth.uid());

-- --- Work Order Items ---
create policy "work_order_items_read_authenticated"
  on public.work_order_items for select
  to authenticated
  using (
    exists (
      select 1 from public.work_orders
      where work_orders.id = work_order_items.work_order_id
        and (
          public.is_admin()
          or public.has_financial_access()
          or work_orders.assigned_to = auth.uid()
          or work_orders.created_by = auth.uid()
        )
    )
  );

create policy "work_order_items_manage_admin"
  on public.work_order_items for all
  to authenticated
  using (public.is_admin() or public.has_financial_access())
  with check (public.is_admin() or public.has_financial_access());

-- --- Invoices ---
create policy "invoices_read_financial"
  on public.invoices for select
  to authenticated
  using (public.has_financial_access() or created_by = auth.uid());

create policy "invoices_manage_financial"
  on public.invoices for all
  to authenticated
  using (public.has_financial_access())
  with check (public.has_financial_access());

-- --- Invoice Items ---
create policy "invoice_items_read_financial"
  on public.invoice_items for select
  to authenticated
  using (
    exists (
      select 1 from public.invoices
      where invoices.id = invoice_items.invoice_id
        and (public.has_financial_access() or invoices.created_by = auth.uid())
    )
  );

create policy "invoice_items_manage_financial"
  on public.invoice_items for all
  to authenticated
  using (public.has_financial_access())
  with check (public.has_financial_access());

-- --- Payments ---
create policy "payments_read_financial"
  on public.payments for select
  to authenticated
  using (public.has_financial_access());

create policy "payments_manage_financial"
  on public.payments for all
  to authenticated
  using (public.has_financial_access())
  with check (public.has_financial_access());

-- --- Payment Allocations ---
create policy "payment_allocations_read_financial"
  on public.payment_allocations for select
  to authenticated
  using (
    exists (
      select 1 from public.payments
      where payments.id = payment_allocations.payment_id
        and public.has_financial_access()
    )
  );

create policy "payment_allocations_manage_financial"
  on public.payment_allocations for all
  to authenticated
  using (public.has_financial_access())
  with check (public.has_financial_access());

-- --- Expense Categories ---
create policy "expense_categories_read_authenticated"
  on public.expense_categories for select
  to authenticated
  using (public.is_active_user());

create policy "expense_categories_manage_admin"
  on public.expense_categories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- --- Expenses ---
create policy "expenses_read_financial"
  on public.expenses for select
  to authenticated
  using (public.has_financial_access() or created_by = auth.uid());

create policy "expenses_manage_financial"
  on public.expenses for all
  to authenticated
  using (public.has_financial_access())
  with check (public.has_financial_access());

-- --- Purchase Records ---
create policy "purchase_records_read_financial"
  on public.purchase_records for select
  to authenticated
  using (public.has_financial_access() or created_by = auth.uid());

create policy "purchase_records_manage_financial"
  on public.purchase_records for all
  to authenticated
  using (public.has_financial_access())
  with check (public.has_financial_access());

-- --- Notifications (users see only their own) ---
create policy "notifications_read_own"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

create policy "notifications_update_own"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "notifications_insert_system"
  on public.notifications for insert
  to authenticated
  with check (public.is_admin());

create policy "notifications_manage_admin"
  on public.notifications for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- --- Activity Logs ---
create policy "activity_logs_read_admin"
  on public.activity_logs for select
  to authenticated
  using (public.is_admin() or user_id = auth.uid());

create policy "activity_logs_insert_authenticated"
  on public.activity_logs for insert
  to authenticated
  with check (public.is_active_user());

create policy "activity_logs_manage_admin"
  on public.activity_logs for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================================
-- 28. UTILITY TRIGGERS & FUNCTIONS
-- ============================================================================

-- Function to update product quantity on inventory movement
create or replace function public.handle_inventory_movement()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.movement_type in ('purchase', 'return') then
    update public.products
    set quantity = quantity + new.quantity,
        updated_at = now()
    where id = new.product_id;
  elsif new.movement_type = 'consumption' then
    update public.products
    set quantity = quantity - new.quantity,
        updated_at = now()
    where id = new.product_id;
  elsif new.movement_type = 'adjustment' then
    -- quantity can be positive (add) or negative (remove)
    update public.products
    set quantity = quantity + new.quantity,
        updated_at = now()
    where id = new.product_id;
  end if;
  return new;
end;
$$;

create trigger on_inventory_movement
  after insert on public.inventory_movements
  for each row
  execute function public.handle_inventory_movement();

-- Function to update invoice balance and customer totals on payment allocation
create or replace function public.handle_payment_allocation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer_id uuid;
  v_invoice_total decimal(12,3);
  v_total_paid decimal(12,3);
begin
  -- Update invoice amount_paid and balance_due
  select coalesce(sum(pa.amount), 0) into v_total_paid
  from public.payment_allocations pa
  where pa.invoice_id = new.invoice_id;

  update public.invoices
  set amount_paid = v_total_paid,
      balance_due = total - v_total_paid,
      status = case
        when v_total_paid >= total then 'paid'
        when v_total_paid > 0 then 'partially_paid'
        else status
      end,
      updated_at = now()
  where id = new.invoice_id
  returning customer_id into v_customer_id;

  -- Update customer outstanding balance
  if v_customer_id is not null then
    update public.customers
    set outstanding_balance = coalesce((
      select sum(balance_due) from public.invoices
      where customer_id = v_customer_id
        and status not in ('cancelled', 'credited', 'draft')
    ), 0),
    total_spent = coalesce((
      select sum(amount_paid) from public.invoices
      where customer_id = v_customer_id
        and status not in ('cancelled', 'credited', 'draft')
    ), 0),
    updated_at = now()
    where id = v_customer_id;
  end if;

  return new;
end;
$$;

create trigger on_payment_allocation
  after insert or update or delete on public.payment_allocations
  for each row
  execute function public.handle_payment_allocation();

-- Function to auto-generate lead reference number if not set
create or replace function public.handle_lead_reference()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.reference_number is null or new.reference_number = '' then
    new.reference_number := 'LD-' || lpad(nextval('public.lead_reference_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

-- Function to log activity
create or replace function public.log_activity(
  p_action text,
  p_resource_type text,
  p_resource_id uuid default null,
  p_details jsonb default '{}'
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.activity_logs (user_id, action, resource_type, resource_id, details)
  values (auth.uid(), p_action, p_resource_type, p_resource_id, p_details);
end;
$$;

comment on function public.log_activity(text, text, uuid, jsonb) is
  'Helper function to insert an activity log entry for the current user.';

-- ============================================================================
-- 29. STORAGE BUCKETS (Supabase Storage configuration)
-- ============================================================================
-- Note: Storage bucket creation is typically done via the Supabase Dashboard
-- or the Management API. The SQL below uses the storage schema if available.

do $$
begin
  -- Create buckets if the storage schema exists
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    -- Media assets bucket
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values (
      'media',
      'media',
      true,
      52428800, -- 50MB
      array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif',
            'application/pdf', 'video/mp4', 'video/webm']
    )
    on conflict (id) do nothing;

    -- Documents bucket (private)
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values (
      'documents',
      'documents',
      false,
      20971520, -- 20MB
      array['application/pdf', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'image/jpeg', 'image/png']
    )
    on conflict (id) do nothing;

    -- Lead photos bucket (private)
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values (
      'lead-photos',
      'lead-photos',
      false,
      10485760, -- 10MB
      array['image/jpeg', 'image/png', 'image/webp']
    )
    on conflict (id) do nothing;

    -- Work order photos bucket
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values (
      'work-orders',
      'work-orders',
      false,
      10485760, -- 10MB
      array['image/jpeg', 'image/png', 'image/webp']
    )
    on conflict (id) do nothing;

    -- Receipts bucket (private)
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values (
      'receipts',
      'receipts',
      false,
      10485760, -- 10MB
      array['image/jpeg', 'image/png', 'application/pdf']
    )
    on conflict (id) do nothing;
  end if;
end;
$$;

-- ============================================================================
-- 30. STORAGE RLS POLICIES
-- ============================================================================

do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    -- Media bucket: public read, authenticated upload
    create policy "media_public_read" on storage.objects for select
      to anon, authenticated
      using (bucket_id = 'media');

    create policy "media_authenticated_insert" on storage.objects for insert
      to authenticated
      with check (bucket_id = 'media' and (select public.has_content_access()));

    create policy "media_authenticated_update" on storage.objects for update
      to authenticated
      using (bucket_id = 'media' and (select public.has_content_access()));

    create policy "media_authenticated_delete" on storage.objects for delete
      to authenticated
      using (bucket_id = 'media' and (select public.has_content_access()));

    -- Documents bucket: authenticated only
    create policy "documents_authenticated_read" on storage.objects for select
      to authenticated
      using (bucket_id = 'documents' and (select public.is_active_user()));

    create policy "documents_authenticated_insert" on storage.objects for insert
      to authenticated
      with check (bucket_id = 'documents' and (select public.is_active_user()));

    -- Lead photos: authenticated + anon for submissions
    create policy "lead_photos_read" on storage.objects for select
      to authenticated
      using (bucket_id = 'lead-photos' and (select public.is_active_user()));

    create policy "lead_photos_insert" on storage.objects for insert
      to anon, authenticated
      with check (bucket_id = 'lead-photos');

    -- Work order photos: authenticated only
    create policy "work_orders_photos_read" on storage.objects for select
      to authenticated
      using (bucket_id = 'work-orders' and (select public.is_active_user()));

    create policy "work_orders_photos_insert" on storage.objects for insert
      to authenticated
      with check (bucket_id = 'work-orders' and (select public.is_active_user()));

    -- Receipts: financial access only
    create policy "receipts_read" on storage.objects for select
      to authenticated
      using (bucket_id = 'receipts' and (select public.has_financial_access()));

    create policy "receipts_insert" on storage.objects for insert
      to authenticated
      with check (bucket_id = 'receipts' and (select public.has_financial_access()));
  end if;
end;
$$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Tables:   38 tables created
-- Indexes:  100+ indexes for query optimization
-- RLS:      All tables have RLS enabled with granular policies
-- Triggers: updated_at auto-update, inventory tracking, payment allocation
-- Functions: Role checks, activity logging, inventory management
-- Storage:  5 buckets configured with appropriate RLS
-- Sequences: 8 sequences for reference number generation
-- ============================================================================
