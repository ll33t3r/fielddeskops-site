-- ═══════════════════════════════════════════════════════════════
-- FDO Migration Verification Script
-- ═══════════════════════════════════════════════════════════════
--
-- HOW TO RUN:
-- 1. Open your Supabase project dashboard
-- 2. Go to SQL Editor
-- 3. Copy/paste this entire file and click "Run"
-- 4. Check the results: ✓ = OK, ✗ = needs that migration
--
-- If you see ✗ results, run the corresponding migration file
-- first (add_subscription_fields, then prelaunch_missing_tables_rls)
--
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. ADD_SUBSCRIPTION_FIELDS MIGRATION ───────────────────

SELECT
  '1. add_subscription_fields migration' AS check_group,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'profiles'
    ) THEN '✓ profiles table exists'
    ELSE '✗ profiles table MISSING'
  END AS result
UNION ALL
SELECT
  '',
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = 'handle_new_user'
    ) THEN '✓ handle_new_user() function exists'
    ELSE '✗ handle_new_user() function MISSING'
  END
UNION ALL
SELECT
  '',
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_trigger t
      JOIN pg_class c ON t.tgrelid = c.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE n.nspname = 'auth' AND c.relname = 'users' AND t.tgname = 'on_auth_user_created'
    ) THEN '✓ on_auth_user_created trigger exists'
    ELSE '✗ on_auth_user_created trigger MISSING'
  END;

-- ─── 2. PRELAUNCH_MISSING_TABLES_RLS MIGRATION ────────────────

SELECT
  '2. prelaunch_missing_tables_rls migration' AS check_group,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tools')
    THEN '✓ tools table exists'
    ELSE '✗ tools table MISSING'
  END AS result
UNION ALL
SELECT '', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'team_members') THEN '✓ team_members' ELSE '✗ team_members MISSING' END
UNION ALL
SELECT '', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contract_templates') THEN '✓ contract_templates' ELSE '✗ contract_templates MISSING' END
UNION ALL
SELECT '', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contract_photos') THEN '✓ contract_photos' ELSE '✗ contract_photos MISSING' END
UNION ALL
SELECT '', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contract_shares') THEN '✓ contract_shares' ELSE '✗ contract_shares MISSING' END
UNION ALL
SELECT '', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN '✓ notifications' ELSE '✗ notifications MISSING' END
UNION ALL
SELECT '', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') THEN '✓ payments' ELSE '✗ payments MISSING' END
UNION ALL
SELECT '', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_settings') THEN '✓ user_settings' ELSE '✗ user_settings MISSING' END
UNION ALL
SELECT
  '',
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'profiles' AND policyname = 'Users can insert own profile'
    ) THEN '✓ profiles INSERT policy exists'
    ELSE '✗ profiles "Users can insert own profile" policy MISSING'
  END

UNION ALL
SELECT
  '3. profiles email column' AS check_group,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email'
    ) THEN '✓ profiles.email exists'
    ELSE '✗ profiles.email MISSING (run supabase_migrations_profiles_add_email.sql)'
  END;
