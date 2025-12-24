-- Documents: stores user writing
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text,
  content text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- AI suggestions: stores each AI suggestion for learning/undo
create table if not exists public.ai_suggestions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.documents(id) on delete cascade,
  type text, -- Grammar | Spelling | Clarity | Tone | SmartTyping
  original text,
  suggested text,
  reason text,
  confidence int,
  accepted boolean default false,
  created_at timestamp with time zone default now()
);

-- User learning: aggregates common user errors for personalization
create table if not exists public.user_learning (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  error_type text,
  frequency int default 1,
  last_seen timestamp with time zone default now()
);

-- Updated timestamps trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_documents_updated_at on public.documents;
create trigger trg_documents_updated_at
before update on public.documents
for each row execute function public.set_updated_at();

-- RLS: user scoped
alter table public.documents enable row level security;
alter table public.ai_suggestions enable row level security;
alter table public.user_learning enable row level security;

-- Policies: owner-only access
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'documents' and policyname = 'documents_owner_select') then
    create policy documents_owner_select on public.documents
      for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'documents' and policyname = 'documents_owner_insert') then
    create policy documents_owner_insert on public.documents
      for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'documents' and policyname = 'documents_owner_update') then
    create policy documents_owner_update on public.documents
      for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'documents' and policyname = 'documents_owner_delete') then
    create policy documents_owner_delete on public.documents
      for delete using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where tablename = 'ai_suggestions' and policyname = 'ai_suggestions_owner_select') then
    create policy ai_suggestions_owner_select on public.ai_suggestions
      for select using (auth.uid() = (select d.user_id from public.documents d where d.id = document_id));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'ai_suggestions' and policyname = 'ai_suggestions_owner_insert') then
    create policy ai_suggestions_owner_insert on public.ai_suggestions
      for insert with check (auth.uid() = (select d.user_id from public.documents d where d.id = document_id));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'ai_suggestions' and policyname = 'ai_suggestions_owner_update') then
    create policy ai_suggestions_owner_update on public.ai_suggestions
      for update using (auth.uid() = (select d.user_id from public.documents d where d.id = document_id));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'ai_suggestions' and policyname = 'ai_suggestions_owner_delete') then
    create policy ai_suggestions_owner_delete on public.ai_suggestions
      for delete using (auth.uid() = (select d.user_id from public.documents d where d.id = document_id));
  end if;

  if not exists (select 1 from pg_policies where tablename = 'user_learning' and policyname = 'user_learning_owner_select') then
    create policy user_learning_owner_select on public.user_learning
      for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'user_learning' and policyname = 'user_learning_owner_insert') then
    create policy user_learning_owner_insert on public.user_learning
      for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'user_learning' and policyname = 'user_learning_owner_update') then
    create policy user_learning_owner_update on public.user_learning
      for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'user_learning' and policyname = 'user_learning_owner_delete') then
    create policy user_learning_owner_delete on public.user_learning
      for delete using (auth.uid() = user_id);
  end if;
end $$;
