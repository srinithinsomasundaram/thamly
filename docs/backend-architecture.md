# Backend Blueprint (Thamly)

This repository already ships a Next.js App Router frontend with Supabase auth/storage, AI tooling (Gemini/OpenAI), and Razorpay billing. The goal below is to pin down a clean, secure, and scalable backend model that matches the existing UI flows.

## Current State & Gaps
- Supabase is the source of truth (profiles, drafts, usage logs, payments), but only the payments migration is checked in; other SQL lives under `scripts/`.
- Auth is handled client-side; `/api/ai/unified` currently uses the service role key and client-local rate limiting (`lib/utils/usage-tracking`), which is not enforceable or safe.
- Draft deletion is status-based; there is no persisted `deleted_at` for a proper trash flow.
- Notification preferences, subscription status fields, and usage counters are referenced in code but not represented in the tracked schema.

## Target Architecture (BFF)
- **API shape:** Keep Next.js API routes as the BFF; every route validates input with Zod and pulls the user from Supabase session cookies (no service role in user-facing paths).
- **Modules:** `auth/profile`, `drafts`, `ai`, `usage`, `billing`. Each module owns its data access layer (Supabase queries) and pure service logic (rate limiting, audits, webhooks).
- **Clients:** Use `lib/supabase/server` for authenticated requests; reserve the service role only for background jobs/webhooks where RLS must be bypassed.
- **Observability:** Central logging for every API route (request id, user id, timing, provider errors) and structured `usage_logs`.

## Data Model (Supabase/Postgres)
Defined in `supabase/migrations/002_backend_core.sql`:
- **profiles:** id (auth.users FK), email, full_name, avatar_url, bio, `subscription_tier` (`free|pro|enterprise`), `subscription_status` (`inactive|active|past_due|cancelled`), `subscription_updated_at`, `usage_count`, `usage_reset_at`, `notification_preferences` JSONB, timestamps; RLS owner-only; auto-create trigger on new auth user.
- **drafts:** id, user_id, title, content, description, `status` (`draft|published|archived|deleted`), `deleted_at`, timestamps; RLS owner-only; soft delete-ready indexes.
- **usage_logs:** id, user_id, action, tokens_used, request_id, ip, metadata JSONB, created_at; RLS owner-only; indexed for audit/quotas.
- **payments:** existing Razorpay table kept; profiles are the single source for active subscription state.
- **Triggers:** shared `set_updated_at` trigger for profiles/drafts; `handle_new_user` to provision profiles.

## API Surface (suggested)
- `GET /api/auth` → session check.
- `GET|POST|PUT|DELETE /api/drafts` → CRUD with soft delete (`status=deleted` + `deleted_at`); ownership enforced by RLS.
- `GET|POST /api/notifications` → read/write `notification_preferences`.
- `POST /api/ai/unified` → Gemini-powered analysis; authenticate via Supabase session, enforce per-user + per-IP rate limit (Redis or Postgres counter), log to `usage_logs`, increment `usage_count`.
- `POST /api/payment/create-checkout` and `POST /api/payment/verify` (or webhook) → Razorpay order/signature verification, update `payments`, then set `profiles.subscription_*`.
- `GET /api/usage` → server-trusted usage quota (no client-local counters).

## Security & Scaling Controls
- RLS on every user-owned table; avoid service role in request handlers.
- Zod validation on all incoming bodies/queries; reject unknown fields.
- Dual rate limiting: per-user (usage table) and per-IP (edge cache/Redis); respond with `429` and `Retry-After`.
- Webhook authenticity: verify Razorpay signatures server-side; never trust client-calculated amounts.
- Secrets: keep `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `RAZORPAY_*` server-only; do not leak via `NEXT_PUBLIC`.
- Indexes added for hot paths (user_id/status/updated_at); `usage_reset_at` supports daily cron to reset quotas.
- Observability: attach `request_id`, user, and provider latency to logs; raise anomalies to monitoring/Sentry.

## Ops & Next Steps
1) Apply the migration: `supabase db push` (or `supabase db reset && supabase db push` for new envs).  
2) Swap `/api/ai/unified` to the server Supabase client; remove service role and localStorage rate limiting in favor of server-enforced quotas.  
3) Wire draft delete/restore to set/clear `deleted_at`; surface `notification_preferences` and `subscription_status` from `profiles`.  
4) Add a daily scheduled job to zero `usage_count` when `usage_reset_at < current_date`.  
5) Backfill profiles from `auth.users` if needed, then enable strict RLS for all tables.  
