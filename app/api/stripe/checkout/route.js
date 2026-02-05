import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { logError } from '../../../../utils/logger'

// Prevent static generation
export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
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
    // Support both: server-only STRIPE_PAYMENT_LINK (recommended for API) and NEXT_PUBLIC_STRIPE_PAYMENT_LINK
    const paymentLink = (
      process.env.STRIPE_PAYMENT_LINK ||
      process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK
    )?.trim()
    if (!priceId && !paymentLink) {
      const rawPublic = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK
      const rawServer = process.env.STRIPE_PAYMENT_LINK
      const debug =
        typeof rawServer === 'string' && rawServer.trim()
          ? `STRIPE_PAYMENT_LINK is set but invalid (length ${rawServer.trim().length}).`
          : typeof rawPublic === 'string' && rawPublic.trim()
            ? `NEXT_PUBLIC_STRIPE_PAYMENT_LINK is set but invalid (length ${rawPublic.trim().length}).`
            : 'Payment link not set. In Vercel add STRIPE_PAYMENT_LINK (or NEXT_PUBLIC_STRIPE_PAYMENT_LINK) = your https://buy.stripe.com/... URL. Check Production, save, then Clear cache and redeploy.'
      logError('Checkout missing price ID and payment link', { hasServer: !!rawServer, hasPublic: !!rawPublic })
      return NextResponse.json(
        { error: debug },
        { status: 500 }
      )
    }

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
    if (!priceId && paymentLink?.trim()) {
      return NextResponse.json({ url: paymentLink.trim() })
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
