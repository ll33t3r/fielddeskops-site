import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import * as Sentry from '@sentry/nextjs'
import { logError } from '../../../../utils/logger'
import { getPaymentLink } from '../../../../lib/stripePaymentLink'

// Prevent static generation
export const dynamic = 'force-dynamic'

// Test links: .../test_xxx; live links: .../xxx (alphanumeric only)
const VALID_PAYMENT_LINK_REGEX = /^https:\/\/buy\.stripe\.com\/[a-zA-Z0-9_]+$/

export async function POST(request) {
  try {
    // Prefer link from client body (NEXT_PUBLIC_ inlined at build) — Vercel often doesn't expose server env to this route
    let bodyPaymentLink = null
    try {
      const body = await request.json().catch(() => ({}))
      const raw = body?.paymentLink
      if (typeof raw === 'string' && VALID_PAYMENT_LINK_REGEX.test(raw.trim())) {
        bodyPaymentLink = raw.trim()
      }
    } catch {
      // ignore
    }

    // Validate environment variables with better error logging
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (!stripeSecretKey) {
      logError('Checkout missing STRIPE_SECRET_KEY')
      return NextResponse.json(
        { error: 'Stripe Secret Key not configured. Check environment variables.' },
        { status: 500 }
      )
    }
    if (process.env.NODE_ENV === 'production' && stripeSecretKey.includes('_test_')) {
      logError('Checkout running in production with test Stripe secret key')
      return NextResponse.json(
        { error: 'Stripe is not configured for production billing.' },
        { status: 500 }
      )
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    if (!siteUrl) {
      logError('Checkout missing NEXT_PUBLIC_SITE_URL')
      return NextResponse.json(
        { error: 'Site URL not configured. Check environment variables.' },
        { status: 500 }
      )
    }

    // Price ID must start with "price_" — ignore if set to a key (pk_/sk_) by mistake
    let priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID?.trim()
    if (priceId && !priceId.startsWith('price_')) {
      logError('Checkout: NEXT_PUBLIC_STRIPE_PRICE_ID looks like a key, not a price ID. Using payment link.')
      priceId = null
    }
    // Client-sent link first (from NEXT_PUBLIC_STRIPE_PAYMENT_LINK at build time); then server env if Vercel exposes it
    const rawLink =
      bodyPaymentLink ||
      process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK ||
      process.env.STRIPE_PAYMENT_LINK ||
      process.env.STRIPE_CHECKOUT_LINK ||
      getPaymentLink()
    const paymentLink = typeof rawLink === 'string' ? rawLink.trim() : ''
    const validLink = paymentLink && VALID_PAYMENT_LINK_REGEX.test(paymentLink) ? paymentLink : null
    if (process.env.NODE_ENV === 'production' && validLink && validLink.includes('/test_')) {
      logError('Checkout running in production with test Stripe payment link')
      return NextResponse.json(
        { error: 'Stripe payment link is not configured for production billing.' },
        { status: 500 }
      )
    }

    if (!priceId && !validLink) {
      logError('Checkout missing price ID and payment link', {
        gotBodyLink: !!bodyPaymentLink,
        hasStripePaymentLink: !!(process.env.STRIPE_PAYMENT_LINK?.trim()),
        hasStripeCheckoutLink: !!(process.env.STRIPE_CHECKOUT_LINK?.trim()),
      })
      const msg = paymentLink && !validLink
        ? `Payment link is set but invalid (must be https://buy.stripe.com/...). Check for typos or extra characters.`
        : 'Payment link not set. In Vercel set NEXT_PUBLIC_STRIPE_PAYMENT_LINK to your https://buy.stripe.com/... URL (Production), save, then redeploy with "Clear cache and redeploy". The client sends this link to the server so checkout works even when server env is not available.'
      return NextResponse.json(
        { error: msg },
        { status: 500 }
      )
    }

    const paymentLinkToUse = validLink || null

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) {
      logError('Checkout missing NEXT_PUBLIC_SUPABASE_URL')
      return NextResponse.json(
        { error: 'Supabase URL not configured. Check environment variables.' },
        { status: 500 }
      )
    }

    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseAnonKey) {
      logError('Checkout missing NEXT_PUBLIC_SUPABASE_ANON_KEY')
      return NextResponse.json(
        { error: 'Supabase Anon Key not configured. Check environment variables.' },
        { status: 500 }
      )
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey)

    // Get current user from Supabase
    const cookieStore = cookies()
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
          set(name, value, options) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch {
              // Ignore if called from route handler
            }
          },
          remove(name, options) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch {
              // Ignore if called from route handler
            }
          },
        },
      }
    )

    // Price ID is now from environment variable (already validated above)

        // Require authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    // Block checkout if not authenticated
    if (!user || authError) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in to subscribe.' },
        { status: 401 }
      )
    }

    // Ensure profile exists (RLS should restrict profiles by auth.uid()).
    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (profileError && profileError.code === 'PGRST116') {
        const { error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            subscription_status: 'inactive',
          })

        if (createError) {
          logError('Checkout profile create failed', createError)
        }
      }
    }

    // If using Payment Link (no Price ID), redirect to the link with user ref so webhook can upgrade this account
    if (!priceId && paymentLinkToUse) {
      const params = new URLSearchParams()
      params.set('client_reference_id', user.id)
      if (user.email) params.set('prefilled_email', user.email)
      const sep = paymentLinkToUse.includes('?') ? '&' : '?'
      const url = `${paymentLinkToUse}${sep}${params.toString()}`
      return NextResponse.json({ url })
    }

    // Build checkout session config (Price ID flow)
    const sessionConfig = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 7,
      },
      success_url: `${siteUrl}/dashboard?success=true`,
      cancel_url: `${siteUrl}/welcome`,
      metadata: { userId: user.id },
    }

    sessionConfig.customer_email = user.email
    sessionConfig.client_reference_id = user.id

    const session = await stripe.checkout.sessions.create(sessionConfig)

    return NextResponse.json({ url: session.url })

  } catch (error) {
    Sentry.captureException(error)
    logError('Checkout session creation failed', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
