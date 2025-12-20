-- Track trial usage by email to prevent reusing trials across deleted accounts
create table if not exists public.trial_history (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  user_id uuid,
  started_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_trial_history_email on public.trial_history(email);
