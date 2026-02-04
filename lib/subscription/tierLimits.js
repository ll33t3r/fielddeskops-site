// Subscription tier limits configuration
export const TIER_LIMITS = {
  free: {
    jobs: 1,
    items: 1,
    customers: 1,
    photos: 2,
    signoff_docs: 1,
    estimates: 1,
    can_share_signoff: false,
  },
  trial: {
    jobs: 10,
    items: 10,
    customers: 10,
    photos: 10,
    signoff_docs: 10,
    estimates: 10,
    can_share_signoff: true,
  },
  paid: {
    jobs: 999999,
    items: 999999,
    customers: 999999,
    photos: 999999,
    signoff_docs: 999999,
    estimates: 999999,
    can_share_signoff: true,
  },
  inactive: {
    jobs: 0,
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

