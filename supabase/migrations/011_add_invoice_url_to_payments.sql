-- Add invoice_url to payments for download links
alter table if exists public.payments
  add column if not exists invoice_url text;
