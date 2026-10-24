-- Migration: Make created_by nullable with auth.uid() default
-- Reason: Allows public quote conversion, automated webhook intake, and seed data creation
-- before first auth user registers.

ALTER TABLE public.customers ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.customers ALTER COLUMN created_by SET DEFAULT auth.uid();

ALTER TABLE public.appointments ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.appointments ALTER COLUMN created_by SET DEFAULT auth.uid();

ALTER TABLE public.work_orders ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.work_orders ALTER COLUMN created_by SET DEFAULT auth.uid();

ALTER TABLE public.quotations ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.quotations ALTER COLUMN created_by SET DEFAULT auth.uid();

ALTER TABLE public.invoices ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.invoices ALTER COLUMN created_by SET DEFAULT auth.uid();

ALTER TABLE public.payments ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.payments ALTER COLUMN created_by SET DEFAULT auth.uid();

ALTER TABLE public.expenses ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.expenses ALTER COLUMN created_by SET DEFAULT auth.uid();
