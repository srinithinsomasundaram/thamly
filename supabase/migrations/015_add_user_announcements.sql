-- Track per-user announcement/welcome dismissals

create table if not exists public.user_announcements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  seen_at timestamptz default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.user_announcements
  add column if not exists seen_at timestamptz default timezone('utc', now()),
  add column if not exists created_at timestamptz not null default timezone('utc', now());

create index if not exists idx_user_announcements_user_key on public.user_announcements(user_id, key);

alter table public.user_announcements enable row level security;

do $$ begin
  create policy "user_announcements_select_own" on public.user_announcements
    for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "user_announcements_insert_own" on public.user_announcements
    for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "user_announcements_delete_own" on public.user_announcements
    for delete using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
