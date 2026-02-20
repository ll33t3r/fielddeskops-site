/**
 * Payment link used for "Upgrade to Pro" checkout.
 * Priority:
 * 1) NEXT_PUBLIC_STRIPE_PAYMENT_LINK (if valid)
 * 2) Hardcoded env-aware fallback (dev=test, prod=live)
 */
const VALID_PAYMENT_LINK_REGEX = /^https:\/\/buy\.stripe\.com\/[a-zA-Z0-9_]+$/
const FALLBACK_PAYMENT_LINK_TEST = 'https://buy.stripe.com/test_14AdR91Kd03o8sfbDGaIM00'
// Set this to your LIVE payment link before production launch.
const FALLBACK_PAYMENT_LINK_LIVE = ''

export function getPaymentLink() {
  const fromEnv =
    typeof process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK === 'string'
      ? process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK.trim()
      : ''
  if (VALID_PAYMENT_LINK_REGEX.test(fromEnv)) return fromEnv

  const fallback =
    process.env.NODE_ENV === 'production'
      ? FALLBACK_PAYMENT_LINK_LIVE
      : FALLBACK_PAYMENT_LINK_TEST

  return VALID_PAYMENT_LINK_REGEX.test(fallback) ? fallback : ''
}
