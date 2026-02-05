-- ═══════════════════════════════════════════════════════════════
-- USAGE TRACKING TABLE + RLS
-- For free-tier limits: jobs, rigs, workers, customers, items,
-- photos, signoff_docs, estimates.
-- ═══════════════════════════════════════════════════════════════

-- Usage tracking: one row per (user_id, resource_type) with total_created
CREATE TABLE IF NOT EXISTS public.usage_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL,
  total_created INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, resource_type)
);

-- RLS: users can only read/write their own rows
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own usage_tracking" ON public.usage_tracking;
CREATE POLICY "Users can manage own usage_tracking" ON public.usage_tracking
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Optional: ensure profiles has trial_end_date (subscriptionHelpers selects it)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ;

-- ═══════════════════════════════════════════════════════════════
