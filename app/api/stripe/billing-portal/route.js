import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { logError } from '../../../../utils/logger'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (!stripeSecretKey) {
      logError('Billing portal missing STRIPE_SECRET_KEY')
      return NextResponse.json(
        { error: 'Stripe not configured.' },
        { status: 500 }
      )
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    if (!siteUrl) {
      logError('Billing portal missing NEXT_PUBLIC_SITE_URL')
      return NextResponse.json(
        { error: 'Site URL not configured.' },
        { status: 500 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnonKey) {
      logError('Billing portal missing Supabase env vars')
      return NextResponse.json(
        { error: 'Supabase not configured.' },
        { status: 500 }
      )
    }

    // Authenticate user via Supabase session
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
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (!user || authError) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in.' },
        { status: 401 }
      )
    }

    // Look up Stripe customer ID from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No billing account found. You may not have an active subscription.' },
        { status: 404 }
      )
    }

    // Create Stripe billing portal session
    const stripe = new Stripe(stripeSecretKey)
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${siteUrl}/account`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    logError('Billing portal session creation failed', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create billing portal session.' },
      { status: 500 }
    )
  }
}
