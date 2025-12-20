# Cloudflare Migration (replacing Supabase)

This repo currently depends on Supabase for auth, Postgres, and realtime channels. This document captures how to move the backend to Cloudflare (Workers + D1 + Durable Objects) and what needs to be rewired in the codebase.

## Target Stack
- **Auth:** Lucia on Workers with D1 adapter (password + optional OAuth). Sessions and keys live in D1 (`auth_keys`, `auth_sessions`, `users` table for identities).
- **Database:** Cloudflare D1 using the schema in `cloudflare/schema.sql` (SQLite dialect). IDs are app-generated UUID strings.
- **Realtime:** Durable Object + WebSocket channel per draft to replace Supabase realtime in `app/editor/page.tsx`.
- **File/object storage:** Not used today; add R2 later if needed for uploads/exports.
- **Billing:** Keep Razorpay; Worker routes will write to `payments`/`invoices` tables in D1.
- **Worker entry:** `cloudflare/src/index.ts` now exposes `/api/health`, `/api/diag/db`, password auth (`/api/auth/*`), Google OAuth (`/api/auth/google/start|callback`), drafts CRUD, and a Durable Object WebSocket for realtime (`/ws/draft/:id`). Bindings: `DB` (D1), `DRAFT_ROOM` (Durable Object), and `SESSION_SECRET` env var; set Google secrets via Wrangler secrets.

## D1 Schema
- Definition lives in `cloudflare/schema.sql` (converted from `supabase/migrations`). Foreign keys are enforced; RLS and triggers are removed and must be enforced in application code. Timestamps use `datetime('now')`.
- Tables: `users`, `profiles`, `drafts`, `draft_collaborators`, `usage_logs`, `payments`, `invoices`, plus Lucia `auth_keys`/`auth_sessions`.
- IDs are `TEXT`; generate with `crypto.randomUUID()` in server/Worker code.

## Wrangler
- `cloudflare/wrangler.toml` defines the D1 binding `DB`. After creating the database (`wrangler d1 create thamly`), set `database_id`.
- Apply schema locally: `wrangler d1 execute thamly --local --file=cloudflare/schema.sql`.

## Code Touchpoints to Replace Supabase
- Clients: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/admin.ts`, `lib/supabase/middleware.ts` (auth/session handling) should be replaced with Worker-aware equivalents using Lucia + D1 queries.
- Auth UI/flows: `app/auth/*`, `components/layout/landing-navbar.tsx`, `components/layout/dashboard-navbar.tsx`, `components/providers/user-provider.tsx`, etc., currently rely on `supabase.auth`. They must call new Worker endpoints for login/signup/session.
- Data access: All `/api/*` routes and components calling `createClient()`/`createServerClient()` (`rg "createClient(" app components`) need to call Worker endpoints that read/write D1.
- Realtime: `app/editor/page.tsx` uses `supabase.channel` for presence/broadcast and `postgres_changes` on `draft_collaborators`. Replace with a Durable Object channel (WebSocket) that broadcasts content updates and collaborator status.
- Billing: `/api/payment/*`, `/app/subscription/*`, `components/workspace/subscription-content.tsx` must read/write `payments`, `invoices`, and `profiles` via D1, not Supabase.

## Suggested Implementation Steps
1) **Set up D1**: Create DB, apply `cloudflare/schema.sql`. Add a backfill script to copy data from Supabase exports into D1 (CSV to INSERT, or `wrangler d1 execute --file`).
2) **Auth swap**: Add Lucia with D1 adapter. Create Worker routes for signup/login/logout/session refresh; wire cookies via `Set-Cookie` on the Worker. Update `app/auth/*` pages to call these routes instead of `supabase.auth.*`.
3) **Data layer**: Add a small query helper (e.g., `lib/cloudflare/db.ts`) that wraps `env.DB.prepare(...)`. Replace Supabase calls in API routes with direct SQL or a thin repository per module (`profiles`, `drafts`, `payments`, `usage`).
4) **Realtime**: Implement a Durable Object `DraftRoom` keyed by `draftId`. Support WebSocket join, broadcast `content_update`, `collab_end`, and an API to update collaborator status in D1. Update `app/editor/page.tsx` to connect to the DO instead of `supabase.channel`.
5) **Middleware/session**: Replace `lib/supabase/middleware.ts` with a Worker middleware (or Next middleware targeting the Worker runtime) that reads Lucia session cookies and injects user info into requests.
6) **Dependencies cleanup**: Remove `@supabase/*` packages; add `wrangler`, `lucia`, `@lucia-auth/adapter-sqlite`, and any chosen OAuth providers.

## Notes and Gaps
- **RLS/Triggers**: D1 lacks RLS and server triggers. Every API route must enforce ownership (user_id checks) before returning data or mutating rows; timestamps should be set in code.
- **UUID generation**: DB no longer auto-generates IDs. Ensure create paths call `crypto.randomUUID()` (both for row IDs and receipts).
- **Index differences**: Partial indexes were approximated; adjust if you need more specific filters. Descending indexes were normalized to ASC for portability.
- **Edge runtime**: If deploying Next.js on Cloudflare via `@cloudflare/next-on-pages`, swap Node APIs (e.g., `crypto` is fine, but avoid `fs`) and use the `env` binding for D1 inside routes.

## Quick Start Checklist
- [ ] Create D1 DB and apply `cloudflare/schema.sql`.
- [ ] Set `SESSION_SECRET` in Wrangler/env vars.
- [ ] Set Google OAuth secrets in Wrangler: `wrangler secret put GOOGLE_CLIENT_ID`, `wrangler secret put GOOGLE_CLIENT_SECRET`, and configure `GOOGLE_REDIRECT_URI` (e.g., `https://your-worker.workers.dev/api/auth/google/callback`).
- [ ] Pick auth providers (password-only or add Google via Lucia) and expose Worker routes for auth/session.
- [ ] Replace Supabase imports in `lib/supabase/*` and API routes with D1-backed helpers.
- [ ] Swap realtime channel in `app/editor/page.tsx` to Durable Object WebSocket.
- [ ] Drop Supabase dependencies and secrets from the env; add Wrangler secrets for Lucia and Razorpay.
- [ ] Run `wrangler dev` from `cloudflare/` and hit `/api/health` or `/api/diag/db` to validate binding/config.
