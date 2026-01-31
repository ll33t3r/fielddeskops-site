-- Add rig assignment to jobs
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS rig_id UUID REFERENCES public.fleet(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_rig_id ON public.jobs(rig_id);

-- Strengthen jobs policy to ensure rig belongs to user
DROP POLICY IF EXISTS "Users can manage their own jobs" ON public.jobs;
CREATE POLICY "Users can manage their own jobs" ON public.jobs
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND (
    rig_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.fleet f
      WHERE f.id = rig_id
      AND f.user_id = auth.uid()
    )
  )
);
