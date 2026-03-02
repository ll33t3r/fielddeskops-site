import { createClient } from '@/app/utils/supabase/client';
import { getLimitsForTier } from './tierLimits';

const RESOURCE_TABLES = {
  jobs: 'jobs',
  rigs: 'fleet',
  workers: 'crew',
  customers: 'customers',
  items: 'inventory',
  photos: 'photos',
  signoff_docs: 'contracts',
  estimates: 'estimates',
};

async function getResourceCurrentCount(supabase, userId, resourceType) {
  const table = RESOURCE_TABLES[resourceType];
  if (!table) return null;

  const { count, error } = await supabase
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) return null;
  return Number.isFinite(count) ? count : 0;
}

// Get user's current subscription status and limits
export async function getUserSubscription() {
  const supabase = createClient();
  if (!supabase) {
    return { tier: 'inactive', limits: getLimitsForTier('inactive'), error: 'Client not configured' };
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { 
      tier: 'inactive', 
      limits: getLimitsForTier('inactive'),
      error: 'Not authenticated' 
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('subscription_status, subscription_tier, trial_end_date, stripe_customer_id, stripe_subscription_id')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return { 
      tier: 'inactive', 
      limits: getLimitsForTier('inactive'),
      error: 'Profile not found' 
    };
  }

  // Determine effective tier with normalization.
  // Priority: explicit tier field, then status field.
  const rawTier = (profile.subscription_tier || '').trim().toLowerCase();
  const rawStatus = (profile.subscription_status || '').trim().toLowerCase();
  const candidate = rawTier || rawStatus || 'free';

  let effectiveTier = 'free';
  if (candidate === 'pro' || candidate === 'paid' || candidate === 'active') effectiveTier = 'paid';
  if (candidate === 'trial' || candidate === 'trialing') effectiveTier = 'trial';
  if (candidate === 'inactive' || candidate === 'free') effectiveTier = 'free';

  // Check if trial has expired
  if (effectiveTier === 'trial' && profile.trial_end_date) {
    const trialEnd = new Date(profile.trial_end_date);
    const now = new Date();
    if (now > trialEnd) {
      effectiveTier = 'free';
    }
  }

  // Safety net: accounts without billing linkage should default to free unless explicitly marked manual Pro.
  const hasStripeLink = Boolean(profile.stripe_customer_id || profile.stripe_subscription_id);
  const isManualPro = rawTier === 'pro';
  if ((effectiveTier === 'paid' || effectiveTier === 'trial') && !hasStripeLink && !isManualPro) {
    effectiveTier = 'free';
  }

  const isPaidTier = effectiveTier === 'paid' || effectiveTier === 'trial';
  const isReadOnly = Boolean(profile.stripe_customer_id) && !isPaidTier;

  return {
    tier: effectiveTier,
    limits: getLimitsForTier(effectiveTier),
    trialEndDate: profile.trial_end_date,
    userId: user.id,
    isReadOnly,
    stripeCustomerId: profile.stripe_customer_id || null,
  };
}

// Check if user can create a resource (tracks total created, not current count)
export async function canCreateResource(resourceType) {
  const supabase = createClient();
  if (!supabase) {
    return { allowed: false, reason: 'Client not configured', currentCount: 0, limit: 0 };
  }
  const { tier, limits, userId, error, isReadOnly } = await getUserSubscription();

  if (error) {
    return { allowed: false, reason: error, currentCount: 0, limit: 0 };
  }
  if (isReadOnly) {
    return {
      allowed: false,
      reason: 'Account locked. Renew to edit.',
      currentCount: 0,
      limit: limits[resourceType] ?? 0,
      tier,
      readOnly: true,
    };
  }

  // Get or create usage tracking record
  let { data: usage, error: usageError } = await supabase
    .from('usage_tracking')
    .select('*')
    .eq('user_id', userId)
    .eq('resource_type', resourceType)
    .single();

  // If table missing or any error other than "no rows", disallow (safe default for enforcing limits)
  if (usageError && usageError.code !== 'PGRST116') {
    const limit = limits[resourceType] ?? 0;
    return {
      allowed: false,
      reason: 'Unable to verify usage. Run the usage_tracking migration in Supabase.',
      currentCount: 0,
      limit,
      tier,
    };
  }

  if (usageError && usageError.code === 'PGRST116') {
    // Record doesn't exist, create it
    const { data: newUsage, error: insertError } = await supabase
      .from('usage_tracking')
      .insert({ user_id: userId, resource_type: resourceType, total_created: 0 })
      .select()
      .single();
    if (insertError || !newUsage) {
      const limit = limits[resourceType] ?? 0;
      return {
        allowed: false,
        reason: 'Unable to initialize usage tracking.',
        currentCount: 0,
        limit,
        tier,
      };
    }
    usage = newUsage;
  }

  let totalCreated = usage?.total_created ?? 0;
  const currentCount = await getResourceCurrentCount(supabase, userId, resourceType);
  if (typeof currentCount === 'number' && currentCount > totalCreated) {
    totalCreated = currentCount;
    // Keep usage in sync when historical increments drift from actual data.
    await supabase
      .from('usage_tracking')
      .upsert(
        { user_id: userId, resource_type: resourceType, total_created: totalCreated, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,resource_type' }
      );
  }

  const limit = limits[resourceType];
  const allowed = limit !== undefined && totalCreated < limit;

  return {
    allowed,
    reason: allowed ? null : 'Limit reached',
    currentCount: totalCreated,
    limit,
    tier,
    readOnly: false,
  };
}

// Check if user can write (create/update/delete). Read-only users are blocked.
export async function getWriteAccessStatus() {
  const { tier, error, isReadOnly } = await getUserSubscription();
  if (error) {
    return { allowed: false, reason: error, tier, readOnly: false };
  }
  if (isReadOnly) {
    return { allowed: false, reason: 'Account locked. Renew to edit.', tier, readOnly: true };
  }
  return { allowed: true, reason: null, tier, readOnly: false };
}

// Increment usage after successful creation (call this AFTER inserting to database)
export async function incrementResourceUsage(resourceType) {
  const supabase = createClient();
  if (!supabase) return;
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return;

  // Increment or insert usage record
  const { data: existing, error: existingError } = await supabase
    .from('usage_tracking')
    .select('total_created')
    .eq('user_id', user.id)
    .eq('resource_type', resourceType)
    .single();

  if (existingError && existingError.code !== 'PGRST116') return;

  if (existing) {
    const { error: updateError } = await supabase
      .from('usage_tracking')
      .update({ 
        total_created: existing.total_created + 1, 
        updated_at: new Date().toISOString() 
      })
      .eq('user_id', user.id)
      .eq('resource_type', resourceType);
    if (!updateError) return;
  } else {
    const { error: insertError } = await supabase
      .from('usage_tracking')
      .insert({ 
        user_id: user.id, 
        resource_type: resourceType, 
        total_created: 1,
        updated_at: new Date().toISOString(),
      });
    if (!insertError) return;
  }

  // Last-resort sync path to avoid limit bypass when insert/update races happen.
  const fallbackCount = await getResourceCurrentCount(supabase, user.id, resourceType);
  if (typeof fallbackCount === 'number') {
    await supabase
      .from('usage_tracking')
      .upsert(
        { user_id: user.id, resource_type: resourceType, total_created: fallbackCount, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,resource_type' }
      );
  }
}
