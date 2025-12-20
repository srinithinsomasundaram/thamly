-- Ensure soft-delete column exists on drafts for trash flows
alter table if exists public.drafts
  add column if not exists deleted_at timestamptz;

-- Helpful index for trash ordering and lookups
create index if not exists idx_drafts_deleted_at_v2
  on public.drafts(deleted_at) where deleted_at is not null;
