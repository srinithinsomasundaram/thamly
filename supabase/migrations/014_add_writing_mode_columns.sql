-- Add writing_mode to documents to track normal/news/etc.
alter table if exists public.documents
  add column if not exists writing_mode text default 'normal';

-- Track mode on ai_suggestions for later analytics.
alter table if exists public.ai_suggestions
  add column if not exists mode text;
