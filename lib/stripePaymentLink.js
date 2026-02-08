/**
 * Payment link used for "Upgrade to Pro" checkout.
 * - If NEXT_PUBLIC_STRIPE_PAYMENT_LINK is set in Vercel, it's used (inlined at build).
 * - Otherwise this fallback is used so checkout works when Vercel env isn't available.
 *
 * Set this to your TEST link for testing (https://buy.stripe.com/test_xxx).
 * Set this to your LIVE link for production, or rely on the env var.
 */
const FALLBACK_PAYMENT_LINK = 'https://buy.stripe.com/test_14AdR91Kd03o8sfbDGaIM00'

export function getPaymentLink() {
  const fromEnv =
    typeof process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK === 'string'
      ? process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK.trim()
      : ''
  return fromEnv || FALLBACK_PAYMENT_LINK || ''
}
