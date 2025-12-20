-- Full Supabase schema alignment for Thamly
-- Safe to run multiple times; adds missing columns, indexes, triggers, and RLS policies.

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  avatar_url text,
  bio text,
  subscription_tier text not null default 'free',
  subscription_status text not null default 'inactive',
  subscription_updated_at timestamptz,
  trial_used boolean not null default false,
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  is_trial_active boolean not null default false,
  usage_count integer not null default 0,
  usage_reset_at date not null default current_date,
  notification_preferences jsonb not null default '{"emailUpdates":true,"productNews":true,"securityAlerts":true}'::jsonb,
  last_sign_in_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles
  add column if not exists full_name text,
  add column if not exists avatar_url text,
  add column if not exists bio text,
  add column if not exists subscription_tier text not null default 'free',
  add column if not exists subscription_status text not null default 'inactive',
  add column if not exists subscription_updated_at timestamptz,
  add column if not exists trial_used boolean not null default false,
  add column if not exists trial_started_at timestamptz,
  add column if not exists trial_ends_at timestamptz,
  add column if not exists is_trial_active boolean not null default false,
  add column if not exists usage_count integer not null default 0,
  add column if not exists usage_reset_at date not null default current_date,
  add column if not exists notification_preferences jsonb not null default '{"emailUpdates":true,"productNews":true,"securityAlerts":true}'::jsonb,
  add column if not exists last_sign_in_at timestamptz,
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

do $$ begin
  alter table public.profiles add constraint profiles_subscription_tier_check check (subscription_tier in ('free','pro','enterprise'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.profiles add constraint profiles_subscription_status_check check (subscription_status in ('inactive','active','past_due','cancelled'));
exception when duplicate_object then null; end $$;

create index if not exists idx_profiles_subscription_tier on public.profiles(subscription_tier);
create index if not exists idx_profiles_usage_reset_at on public.profiles(usage_reset_at);
create index if not exists idx_profiles_trial_used on public.profiles(trial_used);
create index if not exists idx_profiles_trial_active on public.profiles(is_trial_active);
create index if not exists idx_profiles_trial_ends_at on public.profiles(trial_ends_at);

-- DRAFTS (soft delete + mode)
create table if not exists public.drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled Draft',
  content text,
  description text,
  status text not null default 'draft',
  deleted_at timestamptz,
  mode text default 'standard',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.drafts
  add column if not exists deleted_at timestamptz,
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now()),
  add column if not exists mode text default 'standard',
  alter column title set default 'Untitled Draft',
  alter column status set default 'draft';

do $$ begin
  alter table public.drafts add constraint drafts_status_check check (status in ('draft','published','archived','deleted'));
exception when duplicate_object then null; end $$;

create index if not exists idx_drafts_user_status on public.drafts(user_id, status);
create index if not exists idx_drafts_deleted_at on public.drafts(deleted_at) where deleted_at is not null;
create index if not exists idx_drafts_updated_at on public.drafts(updated_at);

-- USAGE LOGS
create table if not exists public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  tokens_used integer default 0,
  request_id text,
  ip inet,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.usage_logs
  add column if not exists tokens_used integer default 0,
  add column if not exists request_id text,
  add column if not exists ip inet,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default timezone('utc', now());

create index if not exists idx_usage_logs_user_created_at on public.usage_logs(user_id, created_at desc);
create index if not exists idx_usage_logs_request_id on public.usage_logs(request_id);

-- PAYMENTS (Razorpay scaffolding)
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null,
  currency text not null default 'INR',
  status text not null default 'pending',
  razorpay_payment_id text,
  razorpay_order_id text,
  razorpay_signature text,
  plan_name text,
  payment_method text,
  receipt_id text,
  paid_at timestamptz,
  invoice_url text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_payments_user_status on public.payments(user_id, status);
create index if not exists idx_payments_user_paid_at on public.payments(user_id, paid_at desc);

-- COLLABORATION
create table if not exists public.draft_collaborators (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid not null references public.drafts(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  collaborator_email text not null,
  collaborator_user_id uuid,
  status text not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  ended_at timestamptz
);

do $$ begin
  alter table public.draft_collaborators add constraint draft_collaborators_status_check check (status in ('pending','accepted','ended'));
exception when duplicate_object then null; end $$;

create unique index if not exists idx_draft_collaborators_unique_invite
  on public.draft_collaborators (draft_id, collaborator_email);
create index if not exists idx_draft_collaborators_draft_status
  on public.draft_collaborators (draft_id, status);

-- TRIGGERS
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_drafts_updated_at on public.drafts;
create trigger set_drafts_updated_at
before update on public.drafts
for each row execute function public.set_updated_at();

drop trigger if exists set_draft_collaborators_updated_at on public.draft_collaborators;
create trigger set_draft_collaborators_updated_at
before update on public.draft_collaborators
for each row execute function public.set_updated_at();

-- AUTO-CREATE PROFILE ON AUTH USER
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(public.profiles.full_name, excluded.full_name);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ROW LEVEL SECURITY
alter table public.profiles enable row level security;
alter table public.drafts enable row level security;
alter table public.usage_logs enable row level security;
alter table public.payments enable row level security;
alter table public.draft_collaborators enable row level security;

-- Profile policies
do $$ begin
  create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
exception when duplicate_object then null; end $$;

-- Drafts policies
do $$ begin
  create policy "drafts_select_own" on public.drafts for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "drafts_insert_own" on public.drafts for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "drafts_update_own" on public.drafts for update using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "drafts_delete_own" on public.drafts for delete using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- Usage logs policies
do $$ begin
  create policy "usage_logs_select_own" on public.usage_logs for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "usage_logs_insert_own" on public.usage_logs for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- Trial history
create table if not exists public.trial_history (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  user_id uuid,
  started_at timestamptz not null default timezone('utc', now())
);
create index if not exists idx_trial_history_email on public.trial_history(email);

-- Payments policies
do $$ begin
  create policy "payments_select_own" on public.payments for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "payments_insert_own" on public.payments for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- Collaboration policies
do $$ begin
  create policy "drafts_select_collaborator"
    on public.drafts for select
    using (
      auth.uid() = user_id
      or exists (
        select 1 from public.draft_collaborators dc
        where dc.draft_id = drafts.id
          and dc.collaborator_user_id = auth.uid()
          and dc.status = 'accepted'
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "drafts_update_collaborator"
    on public.drafts for update
    using (
      auth.uid() = user_id
      or exists (
        select 1 from public.draft_collaborators dc
        where dc.draft_id = drafts.id
          and dc.collaborator_user_id = auth.uid()
          and dc.status = 'accepted'
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "draft_collaborators_owner_manage"
    on public.draft_collaborators for all
    using (owner_id = auth.uid()) with check (owner_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "draft_collaborators_collaborator_view"
    on public.draft_collaborators for select
    using (collaborator_user_id = auth.uid() or owner_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "draft_collaborators_accept_invite"
    on public.draft_collaborators for update
    using (collaborator_user_id = auth.uid());
exception when duplicate_object then null; end $$;
