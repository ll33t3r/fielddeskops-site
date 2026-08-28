/**
 * Hosted Whop checkout for SiteSnap + SignOff Pro ($19.99/mo, 7-day trial).
 * Billing moved off Stripe — use this for logged-out Pro Trial / Upgrade CTAs.
 */
export const WHOP_CHECKOUT_URL =
  'https://whop.com/checkout/plan_9y42aE3d6kic4'

export function getWhopCheckoutUrl() {
  const fromEnv =
    typeof process.env.NEXT_PUBLIC_WHOP_CHECKOUT_URL === 'string'
      ? process.env.NEXT_PUBLIC_WHOP_CHECKOUT_URL.trim()
      : ''
  return fromEnv || WHOP_CHECKOUT_URL
}
