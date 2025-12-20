-- Cloudflare D1 schema translated from Supabase/Postgres tables.
-- IDs are TEXT; generate them in application code (crypto.randomUUID()).
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  password_hash TEXT,
  provider TEXT DEFAULT 'password',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  subscription_tier TEXT NOT NULL DEFAULT 'free',
  subscription_status TEXT NOT NULL DEFAULT 'inactive',
  subscription_updated_at TEXT,
  usage_count INTEGER NOT NULL DEFAULT 0,
  usage_reset_at TEXT NOT NULL DEFAULT (date('now')),
  notification_preferences TEXT NOT NULL DEFAULT '{"emailUpdates":true,"productNews":true,"securityAlerts":true}',
  last_sign_in_at TEXT,
  trial_used INTEGER NOT NULL DEFAULT 0,
  trial_started_at TEXT,
  trial_ends_at TEXT,
  is_trial_active INTEGER NOT NULL DEFAULT 0,
  subscription_id TEXT,
  plan_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (subscription_tier IN ('free','pro','enterprise')),
  CHECK (subscription_status IN ('inactive','active','past_due','cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_usage_reset_at ON profiles(usage_reset_at);
CREATE INDEX IF NOT EXISTS idx_profiles_trial_used ON profiles(trial_used);
CREATE INDEX IF NOT EXISTS idx_profiles_trial_active ON profiles(is_trial_active);
CREATE INDEX IF NOT EXISTS idx_profiles_trial_ends_at ON profiles(trial_ends_at);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_id ON profiles(subscription_id);

CREATE TABLE IF NOT EXISTS drafts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Draft',
  content TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  mode TEXT DEFAULT 'standard',
  deleted_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (status IN ('draft','published','archived','deleted'))
);

CREATE INDEX IF NOT EXISTS idx_drafts_user_status ON drafts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_drafts_deleted_at ON drafts(deleted_at);
CREATE INDEX IF NOT EXISTS idx_drafts_updated_at ON drafts(updated_at);

CREATE TABLE IF NOT EXISTS draft_collaborators (
  id TEXT PRIMARY KEY,
  draft_id TEXT NOT NULL REFERENCES drafts(id) ON DELETE CASCADE,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  collaborator_email TEXT NOT NULL,
  collaborator_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  ended_at TEXT,
  CHECK (status IN ('pending','accepted','ended'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_draft_collaborators_unique_invite
  ON draft_collaborators(draft_id, collaborator_email, status)
  WHERE status IN ('pending','accepted');

CREATE INDEX IF NOT EXISTS idx_draft_collaborators_draft_status ON draft_collaborators(draft_id, status);

CREATE TABLE IF NOT EXISTS usage_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  request_id TEXT,
  ip TEXT,
  metadata TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_usage_logs_user_created_at ON usage_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_usage_logs_request_id ON usage_logs(request_id);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created','pending','completed','failed','cancelled')),
  payment_method TEXT NOT NULL DEFAULT 'razorpay',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  receipt_id TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  paid_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order_id ON payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'paid',
  invoice_date TEXT NOT NULL DEFAULT (date('now')),
  billing_period_start TEXT,
  billing_period_end TEXT,
  description TEXT,
  download_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_invoices_user_date ON invoices(user_id, invoice_date);

-- Auth/session tables for Lucia (if chosen)
CREATE TABLE IF NOT EXISTS auth_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hashed_password TEXT
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  active_expires INTEGER NOT NULL,
  idle_expires INTEGER NOT NULL
);
