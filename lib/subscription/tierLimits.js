// Subscription tier limits configuration
export const TIER_LIMITS = {
  free: {
    jobs: 1,
    rigs: 1,
    workers: 1,
    customers: 1,
    items: 3,
    photos: 3,
    signoff_docs: 3,
    estimates: 3,
    can_share_signoff: false,
  },
  trial: {
    jobs: 10,
    rigs: 999999,
    workers: 999999,
    items: 10,
    customers: 10,
    photos: 10,
    signoff_docs: 10,
    estimates: 10,
    can_share_signoff: true,
  },
  paid: {
    jobs: 999999,
    rigs: 999999,
    workers: 999999,
    items: 999999,
    customers: 999999,
    photos: 999999,
    signoff_docs: 999999,
    estimates: 999999,
    can_share_signoff: true,
  },
  // Alias so manual "pro" tier in Supabase unlocks the account
  pro: {
    jobs: 999999,
    rigs: 999999,
    workers: 999999,
    items: 999999,
    customers: 999999,
    photos: 999999,
    signoff_docs: 999999,
    estimates: 999999,
    can_share_signoff: true,
  },
  inactive: {
    jobs: 0,
    rigs: 0,
    workers: 0,
    items: 0,
    customers: 0,
    photos: 0,
    signoff_docs: 0,
    estimates: 0,
    can_share_signoff: false,
  },
};

// Get limits for a specific tier
export function getLimitsForTier(tier) {
  return TIER_LIMITS[tier] || TIER_LIMITS.inactive;
}

