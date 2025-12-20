-- Add payment metadata columns to support billing history
alter table if exists public.payments
  add column if not exists plan_name text,
  add column if not exists payment_method text,
  add column if not exists receipt_id text,
  add column if not exists paid_at timestamptz;

create index if not exists idx_payments_user_paid_at on public.payments(user_id, paid_at desc);
