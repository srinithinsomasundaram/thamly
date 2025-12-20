-- Collaboration table for sharing drafts with a single invited user.
create table if not exists public.draft_collaborators (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid not null references public.drafts(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  collaborator_email text not null,
  collaborator_user_id uuid references auth.users(id) on delete set null,
  status text not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  ended_at timestamptz,
  constraint draft_collaborators_status_check check (status in ('pending','accepted','ended'))
);

-- Avoid duplicate invites for the same draft/email.
create unique index if not exists idx_draft_collaborators_unique_invite
  on public.draft_collaborators (draft_id, collaborator_email)
  where status in ('pending','accepted');

create index if not exists idx_draft_collaborators_draft_status
  on public.draft_collaborators (draft_id, status);

alter table public.draft_collaborators enable row level security;

-- Owner full control
do $$ begin
  create policy "draft_collaborators_owner_manage"
    on public.draft_collaborators
    for all
    using (auth.uid() = owner_id)
    with check (auth.uid() = owner_id);
exception when duplicate_object then null; end $$;

-- Collaborator can view their invite/status
do $$ begin
  create policy "draft_collaborators_collaborator_view"
    on public.draft_collaborators
    for select
    using (
      (auth.jwt() ->> 'email') = collaborator_email
      or auth.uid() = collaborator_user_id
    );
exception when duplicate_object then null; end $$;

-- Collaborator can accept an invite and attach their user id
do $$ begin
  create policy "draft_collaborators_accept_invite"
    on public.draft_collaborators
    for update
    using (
      (auth.jwt() ->> 'email') = collaborator_email
      and (collaborator_user_id is null or collaborator_user_id = auth.uid())
      and status in ('pending','accepted')
    )
    with check (
      (auth.jwt() ->> 'email') = collaborator_email
      and (collaborator_user_id is null or collaborator_user_id = auth.uid())
      and status in ('pending','accepted')
    );
exception when duplicate_object then null; end $$;

-- Draft access for collaborators (select/update)
do $$ begin
  create policy "drafts_select_collaborator"
    on public.drafts
    for select
    using (
      exists (
        select 1 from public.draft_collaborators dc
        where dc.draft_id = drafts.id
          and dc.collaborator_user_id = auth.uid()
          and dc.status = 'accepted'
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "drafts_update_collaborator"
    on public.drafts
    for update
    using (
      exists (
        select 1 from public.draft_collaborators dc
        where dc.draft_id = drafts.id
          and dc.collaborator_user_id = auth.uid()
          and dc.status = 'accepted'
      )
    )
    with check (
      exists (
        select 1 from public.draft_collaborators dc
        where dc.draft_id = drafts.id
          and dc.collaborator_user_id = auth.uid()
          and dc.status = 'accepted'
      )
    );
exception when duplicate_object then null; end $$;
