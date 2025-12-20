-- Create invoices table for billing history
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  amount integer not null,
  currency text not null default 'INR',
  status text not null default 'paid',
  invoice_date date not null default now(),
  billing_period_start date,
  billing_period_end date,
  description text,
  download_url text,
  created_at timestamptz not null default now()
);

create index if not exists idx_invoices_user_date on public.invoices(user_id, invoice_date desc);
