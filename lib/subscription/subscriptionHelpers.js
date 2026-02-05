import { createClient } from '@/app/utils/supabase/client';
import { getLimitsForTier } from './tierLimits';

// Get user's current subscription status and limits
export async function getUserSubscription() {
  const supabase = createClient();
  
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
    .select('subscription_status, subscription_tier, trial_end_date')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return { 
      tier: 'inactive', 
      limits: getLimitsForTier('inactive'),
      error: 'Profile not found' 
    };
  }

  // Determine effective tier: treat null/empty as free so unpaid users get free limits
  const status = profile.subscription_status || profile.subscription_tier;
  let effectiveTier = (status && status.trim() !== '') ? status : 'free';
  if (effectiveTier === 'inactive') effectiveTier = 'free';
  
  // Check if trial has expired
  if (effectiveTier === 'trial' && profile.trial_end_date) {
    const trialEnd = new Date(profile.trial_end_date);
    const now = new Date();
    if (now > trialEnd) {
      effectiveTier = 'free';
    }
  }

  return {
    tier: effectiveTier,
    limits: getLimitsForTier(effectiveTier),
    trialEndDate: profile.trial_end_date,
    userId: user.id,
  };
}

// Check if user can create a resource (tracks total created, not current count)
export async function canCreateResource(resourceType) {
  const supabase = createClient();
  const { tier, limits, userId, error } = await getUserSubscription();

  if (error) {
    return { allowed: false, reason: error, currentCount: 0, limit: 0 };
  }

  // Get or create usage tracking record
  let { data: usage, error: usageError } = await supabase
    .from('usage_tracking')
    .select('*')
    .eq('user_id', userId)
    .eq('resource_type', resourceType)
    .single();

  if (usageError && usageError.code === 'PGRST116') {
    // Record doesn't exist, create it
    const { data: newUsage } = await supabase
      .from('usage_tracking')
      .insert({ user_id: userId, resource_type: resourceType, total_created: 0 })
      .select()
      .single();
    usage = newUsage;
  }

  const totalCreated = usage?.total_created || 0;
  const limit = limits[resourceType];
  const allowed = totalCreated < limit;

  return {
    allowed,
    reason: allowed ? null : 'Limit reached',
    currentCount: totalCreated,
    limit,
    tier,
  };
}

// Increment usage after successful creation (call this AFTER inserting to database)
export async function incrementResourceUsage(resourceType) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return;

  // Increment or insert usage record
  const { data: existing } = await supabase
    .from('usage_tracking')
    .select('total_created')
    .eq('user_id', user.id)
    .eq('resource_type', resourceType)
    .single();

  if (existing) {
    await supabase
      .from('usage_tracking')
      .update({ 
        total_created: existing.total_created + 1, 
        updated_at: new Date() 
      })
      .eq('user_id', user.id)
      .eq('resource_type', resourceType);
  } else {
    await supabase
      .from('usage_tracking')
      .insert({ 
        user_id: user.id, 
        resource_type: resourceType, 
        total_created: 1 
      });
  }
}
