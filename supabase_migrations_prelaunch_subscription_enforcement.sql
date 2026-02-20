-- Pre-launch hardening: enforce subscription write access and
-- free-tier creation limits at the database layer.

CREATE OR REPLACE FUNCTION public.fdo_is_service_role()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(current_setting('request.jwt.claim.role', true), '') = 'service_role';
$$;

CREATE OR REPLACE FUNCTION public.fdo_is_paid_or_trial(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = p_user_id
      AND lower(COALESCE(p.subscription_tier, p.subscription_status, 'free')) IN ('paid', 'pro', 'trial', 'trialing', 'active')
  );
$$;

CREATE OR REPLACE FUNCTION public.fdo_is_read_only(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = p_user_id
      AND p.stripe_customer_id IS NOT NULL
      AND lower(COALESCE(p.subscription_tier, p.subscription_status, 'free')) NOT IN ('paid', 'pro', 'trial', 'trialing', 'active')
  );
$$;

CREATE OR REPLACE FUNCTION public.fdo_resource_limit(p_resource TEXT)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_resource
    WHEN 'jobs' THEN 1
    WHEN 'items' THEN 5
    WHEN 'tools' THEN 1
    WHEN 'photos' THEN 2
    WHEN 'signoff_docs' THEN 1
    WHEN 'signoff_templates' THEN 1
    ELSE NULL
  END;
$$;

CREATE OR REPLACE FUNCTION public.fdo_resource_count(p_user_id UUID, p_resource TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF p_resource = 'jobs' THEN
    SELECT COUNT(*)::INTEGER INTO v_count FROM public.jobs WHERE user_id = p_user_id;
  ELSIF p_resource = 'items' THEN
    SELECT COUNT(*)::INTEGER INTO v_count FROM public.inventory WHERE user_id = p_user_id;
  ELSIF p_resource = 'tools' THEN
    SELECT COUNT(*)::INTEGER INTO v_count FROM public.tools WHERE user_id = p_user_id;
  ELSIF p_resource = 'photos' THEN
    SELECT COUNT(*)::INTEGER INTO v_count FROM public.photos WHERE user_id = p_user_id;
  ELSIF p_resource = 'signoff_docs' THEN
    SELECT COUNT(*)::INTEGER INTO v_count FROM public.contracts WHERE user_id = p_user_id;
  ELSIF p_resource = 'signoff_templates' THEN
    SELECT COUNT(*)::INTEGER INTO v_count FROM public.contract_templates WHERE user_id = p_user_id;
  ELSE
    v_count := 0;
  END IF;

  RETURN COALESCE(v_count, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.fdo_enforce_write_guards()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_auth_user UUID;
  v_row_user UUID;
  v_limit INTEGER;
  v_count INTEGER;
  v_resource TEXT;
BEGIN
  IF public.fdo_is_service_role() THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  v_auth_user := auth.uid();
  IF v_auth_user IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_row_user := COALESCE(NEW.user_id, OLD.user_id);
  IF v_row_user IS NULL OR v_row_user <> v_auth_user THEN
    RAISE EXCEPTION 'Cross-account write blocked';
  END IF;

  IF public.fdo_is_read_only(v_auth_user) THEN
    RAISE EXCEPTION 'Account locked. Renew subscription to edit.';
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_resource := NULLIF(TG_ARGV[0], '');
    IF v_resource IS NOT NULL AND NOT public.fdo_is_paid_or_trial(v_auth_user) THEN
      v_limit := public.fdo_resource_limit(v_resource);
      IF v_limit IS NOT NULL THEN
        v_count := public.fdo_resource_count(v_auth_user, v_resource);
        IF v_count >= v_limit THEN
          RAISE EXCEPTION 'Free-tier limit reached for %', v_resource;
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Recreate triggers safely
DROP TRIGGER IF EXISTS fdo_guard_jobs ON public.jobs;
CREATE TRIGGER fdo_guard_jobs
BEFORE INSERT OR UPDATE OR DELETE ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.fdo_enforce_write_guards('jobs');

DROP TRIGGER IF EXISTS fdo_guard_inventory ON public.inventory;
CREATE TRIGGER fdo_guard_inventory
BEFORE INSERT OR UPDATE OR DELETE ON public.inventory
FOR EACH ROW EXECUTE FUNCTION public.fdo_enforce_write_guards('items');

DROP TRIGGER IF EXISTS fdo_guard_tools ON public.tools;
CREATE TRIGGER fdo_guard_tools
BEFORE INSERT OR UPDATE OR DELETE ON public.tools
FOR EACH ROW EXECUTE FUNCTION public.fdo_enforce_write_guards('tools');

DROP TRIGGER IF EXISTS fdo_guard_photos ON public.photos;
CREATE TRIGGER fdo_guard_photos
BEFORE INSERT OR UPDATE OR DELETE ON public.photos
FOR EACH ROW EXECUTE FUNCTION public.fdo_enforce_write_guards('photos');

DROP TRIGGER IF EXISTS fdo_guard_contracts ON public.contracts;
CREATE TRIGGER fdo_guard_contracts
BEFORE INSERT OR UPDATE OR DELETE ON public.contracts
FOR EACH ROW EXECUTE FUNCTION public.fdo_enforce_write_guards('signoff_docs');

DROP TRIGGER IF EXISTS fdo_guard_contract_templates ON public.contract_templates;
CREATE TRIGGER fdo_guard_contract_templates
BEFORE INSERT OR UPDATE OR DELETE ON public.contract_templates
FOR EACH ROW EXECUTE FUNCTION public.fdo_enforce_write_guards('signoff_templates');
