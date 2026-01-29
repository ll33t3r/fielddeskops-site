-- ═══════════════════════════════════════════════════════════════
-- DIRECT MODIFICATION OF auth.users TABLE
-- ═══════════════════════════════════════════════════════════════
-- 
-- WARNING: Supabase typically restricts direct modifications to auth.users
-- This may only work if you have admin/database owner access
-- 
-- If this fails, use the profiles table approach instead
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive';
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS subscription_tier TEXT;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

CREATE INDEX IF NOT EXISTS idx_users_subscription ON auth.users(subscription_status);
