# SQL Queries

This folder holds ready-to-run SQL for Supabase.

- `full_schema.sql`: Aligns the database with the app’s expectations (profiles, drafts with `mode` and `deleted_at`, payments, usage logs, collaboration tables, triggers, indexes, and RLS). It is idempotent and can be run in the Supabase SQL editor.

Usage:
1) Open Supabase SQL editor for your project.
2) Paste the contents of `full_schema.sql`.
3) Run; it’s safe to re-run.
