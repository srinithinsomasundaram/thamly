-- Add subscription fields for Razorpay autopay tracking
alter table if exists public.profiles
  add column if not exists subscription_id text,
  add column if not exists plan_id text;

create index if not exists idx_profiles_subscription_id on public.profiles(subscription_id);
