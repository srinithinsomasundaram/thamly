-- Add robust trial tracking columns
alter table if exists public.profiles
  add column if not exists trial_ends_at timestamptz,
  add column if not exists is_trial_active boolean not null default false;

-- Ensure subscription_tier has a default
alter table if exists public.profiles
  alter column subscription_tier set default 'free';

create index if not exists idx_profiles_trial_active on public.profiles(is_trial_active);
create index if not exists idx_profiles_trial_ends_at on public.profiles(trial_ends_at);
