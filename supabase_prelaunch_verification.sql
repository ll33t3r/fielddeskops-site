-- FieldDeskOps prelaunch verification
-- Run in Supabase SQL Editor after migrations are applied.

-- 1) RLS status on critical public tables
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'contract_templates',
    'contract_photos',
    'contract_shares'
  )
ORDER BY tablename;

-- 2) Confirm required policies exist
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    (tablename = 'contract_templates' AND policyname = 'Users can manage their own contract_templates') OR
    (tablename = 'contract_photos' AND policyname = 'Users can manage contract photos for own contracts') OR
    (tablename = 'contract_shares' AND policyname IN (
      'Users can manage shares for own contracts',
      'Public can read active contract shares by token',
      'Public can update active contract shares while signing'
    ))
  )
ORDER BY tablename, policyname;

-- 3) Spot-check all public tables with RLS disabled (should be empty or expected)
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = FALSE
ORDER BY tablename;
