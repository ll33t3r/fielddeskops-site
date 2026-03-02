import { NextResponse } from 'next/server'

// Debug endpoint: check which Stripe env vars the server sees (no secrets exposed)
export const dynamic = 'force-dynamic'

export async function GET() {
  const hasSecret = !!process.env.STRIPE_SECRET_KEY?.trim()
  const hasPriceId = !!process.env.STRIPE_PRICE_ID?.trim()
  const hasNextPublicPriceId = !!process.env.NEXT_PUBLIC_STRIPE_PRICE_ID?.trim()
  const priceIdPrefix = process.env.STRIPE_PRICE_ID?.trim()?.[0] ?? process.env.NEXT_PUBLIC_STRIPE_PRICE_ID?.trim()?.[0] ?? null
  const priceIdStartsCorrect = (process.env.STRIPE_PRICE_ID?.trim() || process.env.NEXT_PUBLIC_STRIPE_PRICE_ID?.trim() || '').startsWith('price_')

  return NextResponse.json({
    hasStripeSecretKey: hasSecret,
    hasStripePriceId: hasPriceId,
    hasNextPublicStripePriceId: hasNextPublicPriceId,
    priceIdStartsWithPrice: priceIdStartsCorrect,
    priceIdFirstChar: priceIdPrefix,
    readyForCheckout: hasSecret && (hasPriceId || hasNextPublicPriceId) && priceIdStartsCorrect,
  })
}
