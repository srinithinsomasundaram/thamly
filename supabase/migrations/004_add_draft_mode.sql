-- Add "mode" to drafts to persist editor context (standard/news/etc.)
alter table if exists public.drafts
  add column if not exists mode text default 'standard';
