-- Align Supabase schema with the current app: profiles, drafts, usage logs, and RLS.

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  avatar_url text,
  bio text,
  subscription_tier text not null default 'free',
  subscription_status text not null default 'inactive',
  subscription_updated_at timestamptz,
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

-- Drafts
create table if not exists public.drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled Draft',
  content text,
  description text,
  status text not null default 'draft',
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.drafts
  add column if not exists deleted_at timestamptz,
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now()),
  alter column title set default 'Untitled Draft',
  alter column status set default 'draft';

do $$ begin
  alter table public.drafts add constraint drafts_status_check check (status in ('draft','published','archived','deleted'));
exception when duplicate_object then null; end $$;

create index if not exists idx_drafts_user_status on public.drafts(user_id, status);
create index if not exists idx_drafts_deleted_at on public.drafts(deleted_at) where deleted_at is not null;
create index if not exists idx_drafts_updated_at on public.drafts(updated_at);

-- Usage logs
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

-- Shared updated_at trigger
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

-- Auto-create profile on auth.users insert
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

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.drafts enable row level security;
alter table public.usage_logs enable row level security;

do $$ begin
  create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
exception when duplicate_object then null; end $$;

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

do $$ begin
  create policy "usage_logs_select_own" on public.usage_logs for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "usage_logs_insert_own" on public.usage_logs for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
