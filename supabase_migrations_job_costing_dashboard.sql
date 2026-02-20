-- Job Costing Dashboard tables + RLS
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.job_cost_estimates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  labor_estimate NUMERIC(12,2) NOT NULL DEFAULT 0,
  materials_estimate NUMERIC(12,2) NOT NULL DEFAULT 0,
  subcontractors_estimate NUMERIC(12,2) NOT NULL DEFAULT 0,
  overhead_estimate NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_estimate NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT job_cost_estimates_user_job_unique UNIQUE (user_id, job_id),
  CONSTRAINT job_cost_estimates_nonnegative CHECK (
    labor_estimate >= 0
    AND materials_estimate >= 0
    AND subcontractors_estimate >= 0
    AND overhead_estimate >= 0
    AND total_estimate >= 0
  )
);

CREATE TABLE IF NOT EXISTS public.job_cost_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  entered_by TEXT,
  note TEXT,
  incurred_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT job_cost_entries_category_check CHECK (
    category IN ('labor', 'materials', 'subcontractors', 'overhead')
  ),
  CONSTRAINT job_cost_entries_amount_nonnegative CHECK (amount >= 0)
);

ALTER TABLE public.job_cost_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_cost_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own job cost estimates" ON public.job_cost_estimates;
CREATE POLICY "Users can manage their own job cost estimates" ON public.job_cost_estimates
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id = job_id
    AND j.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can manage their own job cost entries" ON public.job_cost_entries;
CREATE POLICY "Users can manage their own job cost entries" ON public.job_cost_entries
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id = job_id
    AND j.user_id = auth.uid()
  )
);

CREATE INDEX IF NOT EXISTS idx_job_cost_estimates_user_id ON public.job_cost_estimates(user_id);
CREATE INDEX IF NOT EXISTS idx_job_cost_estimates_job_id ON public.job_cost_estimates(job_id);
CREATE INDEX IF NOT EXISTS idx_job_cost_entries_user_id ON public.job_cost_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_job_cost_entries_job_id ON public.job_cost_entries(job_id);
CREATE INDEX IF NOT EXISTS idx_job_cost_entries_job_category ON public.job_cost_entries(job_id, category);
CREATE INDEX IF NOT EXISTS idx_job_cost_entries_incurred_at ON public.job_cost_entries(incurred_at DESC);
