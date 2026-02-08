import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { logError } from '../../../../utils/logger'

// Prevent static generation
export const dynamic = 'force-dynamic'

// Test links: .../test_xxx; live links: .../xxx (alphanumeric only)
const VALID_PAYMENT_LINK_REGEX = /^https:\/\/buy\.stripe\.com\/[a-zA-Z0-9_]+$/

export async function POST(request) {
  try {
    // Optional: client can send payment link in body (e.g. if you add a client-side env later)
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
    // Server: try STRIPE_PAYMENT_LINK, then STRIPE_CHECKOUT_LINK (Vercel sometimes only exposes one), then body.
    const rawLink =
      process.env.STRIPE_PAYMENT_LINK ||
      process.env.STRIPE_CHECKOUT_LINK ||
      bodyPaymentLink
    const paymentLink = typeof rawLink === 'string' ? rawLink.trim() : ''
    const validLink = paymentLink && VALID_PAYMENT_LINK_REGEX.test(paymentLink) ? paymentLink : null

    if (!priceId && !validLink) {
      const hasA = !!(process.env.STRIPE_PAYMENT_LINK?.trim())
      const hasB = !!(process.env.STRIPE_CHECKOUT_LINK?.trim())
      logError('Checkout missing price ID and payment link', {
        hasStripePaymentLink: hasA,
        hasStripeCheckoutLink: hasB,
        linkLength: paymentLink.length,
        linkValid: !!validLink,
      })
      const msg = paymentLink && !validLink
        ? `Payment link is set but invalid (must be https://buy.stripe.com/...). Check for typos or extra characters.`
        : 'Payment link not set. In Vercel set STRIPE_PAYMENT_LINK (or STRIPE_CHECKOUT_LINK) to your https://buy.stripe.com/... URL. Assign to Production, save, then redeploy.'
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

    // If using Payment Link (no Price ID), redirect to the link
    if (!priceId && paymentLinkToUse) {
      return NextResponse.json({ url: paymentLinkToUse })
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
    logError('Checkout session creation failed', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
