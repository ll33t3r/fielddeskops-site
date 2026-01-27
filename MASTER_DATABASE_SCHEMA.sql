-- ═══════════════════════════════════════════════════════════════
-- FIELDDESKOPS MASTER DATABASE SCHEMA
-- One database to rule them all
-- Run this ONCE in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────
-- 1. JOBS (The Spine - Everything connects to this)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT DEFAULT 'ACTIVE', -- ACTIVE, PENDING, COMPLETED
    customer_id UUID,
    fleet_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 2. CUSTOMERS (SubHub)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 3. FLEET (Rigs/Vans)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.fleet (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    plate_number TEXT,
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 4. CREW (Workers/Team)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.crew (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'Tech',
    phone TEXT,
    email TEXT,
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 5. ESTIMATES (ProfitLock - Bids)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.estimates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id),
    estimate_number TEXT,
    subtotal NUMERIC(10,2) DEFAULT 0,
    tax NUMERIC(10,2) DEFAULT 0,
    total_price NUMERIC(10,2) DEFAULT 0,
    status TEXT DEFAULT 'DRAFT', -- DRAFT, SENT, ACCEPTED, REJECTED
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 6. LINE_ITEMS (ProfitLock - Estimate line items)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.line_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    estimate_id UUID NOT NULL REFERENCES public.estimates(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity NUMERIC(10,2) DEFAULT 1,
    unit_price NUMERIC(10,2) DEFAULT 0,
    total NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 7. CONTRACTS (SignOff - Digital contracts)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contracts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id),
    estimate_id UUID REFERENCES public.estimates(id),
    contract_number TEXT,
    title TEXT,
    content TEXT,
    signature_data TEXT, -- Base64 signature image
    signed_at TIMESTAMPTZ,
    status TEXT DEFAULT 'PENDING', -- PENDING, SIGNED, VOID
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 8. PHOTOS (SiteSnap - Job photos/evidence)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL, -- Supabase storage path
    caption TEXT,
    category TEXT, -- BEFORE, DURING, AFTER, ISSUE, COMPLETION
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 9. INVENTORY (LoadOut - Van/warehouse inventory)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    fleet_id UUID REFERENCES public.fleet(id), -- Which van is this in?
    name TEXT NOT NULL,
    quantity NUMERIC(10,2) DEFAULT 0,
    min_quantity NUMERIC(10,2) DEFAULT 0, -- Alert threshold
    unit TEXT DEFAULT 'ea',
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fleet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════
-- RLS POLICIES (Users can only see their own data)
-- ═══════════════════════════════════════════════════════════════

-- JOBS
DROP POLICY IF EXISTS "Users can manage their own jobs" ON public.jobs;
CREATE POLICY "Users can manage their own jobs" ON public.jobs FOR ALL USING (auth.uid() = user_id);

-- CUSTOMERS
DROP POLICY IF EXISTS "Users can manage their own customers" ON public.customers;
CREATE POLICY "Users can manage their own customers" ON public.customers FOR ALL USING (auth.uid() = user_id);

-- FLEET
DROP POLICY IF EXISTS "Users can manage their own fleet" ON public.fleet;
CREATE POLICY "Users can manage their own fleet" ON public.fleet FOR ALL USING (auth.uid() = user_id);

-- CREW
DROP POLICY IF EXISTS "Users can manage their own crew" ON public.crew;
CREATE POLICY "Users can manage their own crew" ON public.crew FOR ALL USING (auth.uid() = user_id);

-- ESTIMATES
DROP POLICY IF EXISTS "Users can manage their own estimates" ON public.estimates;
CREATE POLICY "Users can manage their own estimates" ON public.estimates FOR ALL USING (auth.uid() = user_id);

-- LINE_ITEMS (inherit from estimate)
DROP POLICY IF EXISTS "Users can manage line items" ON public.line_items;
CREATE POLICY "Users can manage line items" ON public.line_items FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.estimates 
    WHERE estimates.id = line_items.estimate_id 
    AND estimates.user_id = auth.uid()
));

-- CONTRACTS
DROP POLICY IF EXISTS "Users can manage their own contracts" ON public.contracts;
CREATE POLICY "Users can manage their own contracts" ON public.contracts FOR ALL USING (auth.uid() = user_id);

-- PHOTOS
DROP POLICY IF EXISTS "Users can manage their own photos" ON public.photos;
CREATE POLICY "Users can manage their own photos" ON public.photos FOR ALL USING (auth.uid() = user_id);

-- INVENTORY
DROP POLICY IF EXISTS "Users can manage their own inventory" ON public.inventory;
CREATE POLICY "Users can manage their own inventory" ON public.inventory FOR ALL USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- INDEXES (For faster queries)
-- ═══════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON public.jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_customer_id ON public.jobs(customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_fleet_user_id ON public.fleet(user_id);
CREATE INDEX IF NOT EXISTS idx_crew_user_id ON public.crew(user_id);
CREATE INDEX IF NOT EXISTS idx_estimates_user_id ON public.estimates(user_id);
CREATE INDEX IF NOT EXISTS idx_estimates_job_id ON public.estimates(job_id);
CREATE INDEX IF NOT EXISTS idx_line_items_estimate_id ON public.line_items(estimate_id);
CREATE INDEX IF NOT EXISTS idx_contracts_user_id ON public.contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_job_id ON public.contracts(job_id);
CREATE INDEX IF NOT EXISTS idx_photos_user_id ON public.photos(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_job_id ON public.photos(job_id);
CREATE INDEX IF NOT EXISTS idx_inventory_user_id ON public.inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_fleet_id ON public.inventory(fleet_id);

-- ═══════════════════════════════════════════════════════════════
-- DONE! Your FieldDeskOps database is ready.
-- ═══════════════════════════════════════════════════════════════
