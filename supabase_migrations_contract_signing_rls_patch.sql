-- Security patch: enforce RLS on contract-signing tables exposed via PostgREST.
-- Idempotent by design so it is safe to run multiple times.

ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_shares ENABLE ROW LEVEL SECURITY;

-- contract_templates: users can only manage their own templates
DROP POLICY IF EXISTS "Users can manage their own contract_templates" ON public.contract_templates;
CREATE POLICY "Users can manage their own contract_templates"
ON public.contract_templates
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- contract_photos: access controlled by ownership of parent contract
DROP POLICY IF EXISTS "Users can manage contract photos for own contracts" ON public.contract_photos;
CREATE POLICY "Users can manage contract photos for own contracts"
ON public.contract_photos
FOR ALL
USING (
    EXISTS (
        SELECT 1
        FROM public.contracts c
        WHERE c.id = contract_photos.contract_id
          AND c.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.contracts c
        WHERE c.id = contract_photos.contract_id
          AND c.user_id = auth.uid()
    )
);

-- contract_shares: owner access plus controlled unauthenticated token access
DROP POLICY IF EXISTS "Users can manage shares for own contracts" ON public.contract_shares;
CREATE POLICY "Users can manage shares for own contracts"
ON public.contract_shares
FOR ALL
USING (
    EXISTS (
        SELECT 1
        FROM public.contracts c
        WHERE c.id = contract_shares.contract_id
          AND c.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.contracts c
        WHERE c.id = contract_shares.contract_id
          AND c.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Public can read active contract shares by token" ON public.contract_shares;
CREATE POLICY "Public can read active contract shares by token"
ON public.contract_shares
FOR SELECT
USING (
    is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
    AND signed_at IS NULL
);

DROP POLICY IF EXISTS "Public can update active contract shares while signing" ON public.contract_shares;
CREATE POLICY "Public can update active contract shares while signing"
ON public.contract_shares
FOR UPDATE
USING (
    is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
    AND signed_at IS NULL
)
WITH CHECK (TRUE);
