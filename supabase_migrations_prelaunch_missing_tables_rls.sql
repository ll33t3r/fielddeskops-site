-- Pre-launch hardening: create missing tables referenced by the app
-- and enforce owner-scoped RLS policies.

-- TOOLS
CREATE TABLE IF NOT EXISTS public.tools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rig_id UUID REFERENCES public.fleet(id) ON DELETE SET NULL,
    job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    brand TEXT,
    serial_number TEXT,
    status TEXT DEFAULT 'IN_RIG',
    assigned_to UUID,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TEAM MEMBERS (used by LoadOut code paths)
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CONTRACT TEMPLATES
CREATE TABLE IF NOT EXISTS public.contract_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    name TEXT,
    body TEXT NOT NULL,
    category TEXT DEFAULT 'CUSTOM',
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CONTRACT PHOTOS
CREATE TABLE IF NOT EXISTS public.contract_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
    photo_data TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CONTRACT SHARES (public-sign link support)
CREATE TABLE IF NOT EXISTS public.contract_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
    share_token TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMPTZ NOT NULL,
    viewed_at TIMESTAMPTZ,
    signed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
    job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'paid',
    paid_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- USER SETTINGS
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    hourly_rate NUMERIC(10,2) DEFAULT 0,
    markup_percentage NUMERIC(10,2) DEFAULT 0,
    tax_rate NUMERIC(10,2) DEFAULT 0,
    tax_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Profiles INSERT policy for app/server create paths
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- tools
DROP POLICY IF EXISTS "Users can manage their own tools" ON public.tools;
CREATE POLICY "Users can manage their own tools" ON public.tools
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- team_members
DROP POLICY IF EXISTS "Users can manage their own team_members" ON public.team_members;
CREATE POLICY "Users can manage their own team_members" ON public.team_members
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- contract_templates
DROP POLICY IF EXISTS "Users can manage their own contract_templates" ON public.contract_templates;
CREATE POLICY "Users can manage their own contract_templates" ON public.contract_templates
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- contract_photos: enforce via parent contract ownership
DROP POLICY IF EXISTS "Users can manage contract photos for own contracts" ON public.contract_photos;
CREATE POLICY "Users can manage contract photos for own contracts" ON public.contract_photos
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

-- contract_shares: owner policies + limited public access for token-sign flow
DROP POLICY IF EXISTS "Users can manage shares for own contracts" ON public.contract_shares;
CREATE POLICY "Users can manage shares for own contracts" ON public.contract_shares
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
CREATE POLICY "Public can read active contract shares by token" ON public.contract_shares
    FOR SELECT
    USING (
        is_active = TRUE
        AND (expires_at IS NULL OR expires_at > NOW())
        AND signed_at IS NULL
    );

DROP POLICY IF EXISTS "Public can update active contract shares while signing" ON public.contract_shares;
CREATE POLICY "Public can update active contract shares while signing" ON public.contract_shares
    FOR UPDATE
    USING (
        is_active = TRUE
        AND (expires_at IS NULL OR expires_at > NOW())
        AND signed_at IS NULL
    )
    WITH CHECK (TRUE);

-- notifications
DROP POLICY IF EXISTS "Users can manage their own notifications" ON public.notifications;
CREATE POLICY "Users can manage their own notifications" ON public.notifications
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- payments
DROP POLICY IF EXISTS "Users can manage their own payments" ON public.payments;
CREATE POLICY "Users can manage their own payments" ON public.payments
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- user_settings
DROP POLICY IF EXISTS "Users can manage their own user_settings" ON public.user_settings;
CREATE POLICY "Users can manage their own user_settings" ON public.user_settings
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_tools_user_id ON public.tools(user_id);
CREATE INDEX IF NOT EXISTS idx_tools_rig_id ON public.tools(rig_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_contract_templates_user_id ON public.contract_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_contract_photos_contract_id ON public.contract_photos(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_shares_contract_id ON public.contract_shares(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_shares_token ON public.contract_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_job_id ON public.payments(job_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);
