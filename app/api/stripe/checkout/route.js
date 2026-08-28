import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import * as Sentry from '@sentry/nextjs'
import { logError } from '../../../../utils/logger'
import { getWhopCheckoutUrl } from '../../../../lib/whopCheckout'

// Prevent static generation
export const dynamic = 'force-dynamic'

function whopCheckoutResponse() {
  const whopUrl = getWhopCheckoutUrl()
  if (whopUrl) {
    return NextResponse.json({ url: whopUrl })
  }
  return NextResponse.json(
    { error: 'Authentication required. Please log in to subscribe.' },
    { status: 401 }
  )
}

export async function POST(request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Resolve auth early so logged-out Pro Trial can use Whop without Stripe env.
    let user = null
    if (supabaseUrl && supabaseAnonKey) {
      const cookieStore = cookies()
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
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
      })

      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser()

      if (!authUser || authError) {
        return whopCheckoutResponse()
      }
      user = authUser

      // Ensure profile exists (RLS restricts by auth.uid())
      const { error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (profileError && profileError.code === 'PGRST116') {
        const { error: createError } = await supabase.from('profiles').insert({
          id: user.id,
          email: user.email ?? null,
          subscription_status: 'inactive',
        })
        if (createError) {
          logError('Checkout profile create failed', createError)
        }
      }
    } else {
      return whopCheckoutResponse()
    }

    // Validate environment variables with better error logging
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (!stripeSecretKey) {
      logError('Checkout missing STRIPE_SECRET_KEY')
      return NextResponse.json(
        { error: 'Upgrade is temporarily unavailable. Please try again later.' },
        { status: 500 }
      )
    }
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    if (!siteUrl) {
      logError('Checkout missing NEXT_PUBLIC_SITE_URL')
      return NextResponse.json(
        { error: 'Upgrade is temporarily unavailable. Please try again later.' },
        { status: 500 }
      )
    }

    // Price ID must start with "price_" for subscription checkout
    // Prefer NEXT_PUBLIC_ (inlined at build) for reliability across serverless cold starts
    const priceId = (
      process.env.NEXT_PUBLIC_STRIPE_PRICE_ID?.trim() ||
      process.env.STRIPE_PRICE_ID?.trim() ||
      ''
    ).trim()
    if (!priceId || !priceId.startsWith('price_')) {
      logError('Checkout missing price ID', null, {
        hasNextPublic: !!process.env.NEXT_PUBLIC_STRIPE_PRICE_ID?.trim(),
        hasServer: !!process.env.STRIPE_PRICE_ID?.trim(),
        priceIdLen: priceId?.length ?? 0,
      })
      return NextResponse.json(
        { error: 'Upgrade is temporarily unavailable. Please try again later.' },
        { status: 500 }
      )
    }

    if (process.env.NODE_ENV === 'production' && stripeSecretKey.includes('_test_')) {
      logError('Checkout running in production with test Stripe secret key')
      return NextResponse.json(
        { error: 'Upgrade is temporarily unavailable. Please try again later.' },
        { status: 500 }
      )
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey)

    // Create dynamic checkout session with user ID for webhook
    const session = await stripe.checkout.sessions.create({
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
      customer_email: user.email || undefined,
      // CRITICAL: Webhook needs this to upgrade user to Pro
      client_reference_id: user.id,
      metadata: {
        supabase_user_id: user.id,
      },
    })

    if (!session.url) {
      logError('Stripe checkout session missing url', null, { sessionId: session.id })
      return NextResponse.json(
        { error: 'Failed to create checkout session. Please try again.' },
        { status: 500 }
      )
    }

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
