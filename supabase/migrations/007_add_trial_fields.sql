-- Add trial tracking fields to profiles
alter table if exists public.profiles
  add column if not exists trial_used boolean not null default false,
  add column if not exists trial_started_at timestamptz;

create index if not exists idx_profiles_trial_used on public.profiles(trial_used);
