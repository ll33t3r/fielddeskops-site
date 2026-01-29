import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { NextResponse } from 'next/server'

// Prevent static generation
export const dynamic = 'force-dynamic'

export async function POST(req) {
  try {
    // Validate environment variables
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Missing STRIPE_SECRET_KEY')
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('Missing STRIPE_WEBHOOK_SECRET')
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
    }

    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

    // Initialize Supabase with service role key for admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Get raw body and signature for verification
    const body = await req.text()
    const sig = req.headers.get('stripe-signature')

    if (!sig) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    let event
    try {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      )
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json(
        { error: `Webhook signature error: ${err.message}` },
        { status: 400 }
      )
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.client_reference_id

        if (!userId) {
          console.error('No client_reference_id in checkout session')
          return NextResponse.json(
            { error: 'Missing user reference' },
            { status: 400 }
          )
        }

        // Get subscription details
        const subscriptionId = session.subscription
        if (!subscriptionId) {
          console.error('No subscription ID in checkout session')
          return NextResponse.json(
            { error: 'Missing subscription ID' },
            { status: 400 }
          )
        }

        // Fetch subscription details from Stripe
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)

        // Update user's subscription status in Supabase
        const { error: updateError } = await supabase
          .from('subscriptions')
          .upsert(
            {
              user_id: userId,
              stripe_customer_id: session.customer,
              stripe_subscription_id: subscriptionId,
              status: subscription.status,
              plan_type: subscription.items.data[0]?.price.id || 'unknown',
              current_period_start: new Date(
                subscription.current_period_start * 1000
              ).toISOString(),
              current_period_end: new Date(
                subscription.current_period_end * 1000
              ).toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          )

        if (updateError) {
          console.error('Error updating subscription:', updateError)
          return NextResponse.json(
            { error: 'Failed to update subscription' },
            { status: 500 }
          )
        }

        // Also update user metadata if needed
        const { error: userUpdateError } = await supabase.auth.admin.updateUserById(
          userId,
          {
            user_metadata: {
              subscription_status: subscription.status,
              stripe_customer_id: session.customer,
            },
          }
        )

        if (userUpdateError) {
          console.error('Error updating user metadata:', userUpdateError)
          // Don't fail the webhook if this fails
        }

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const customerId = subscription.customer

        // Find user by Stripe customer ID
        const { data: subscriptionData, error: fetchError } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (fetchError || !subscriptionData) {
          console.error('Subscription not found for customer:', customerId)
          return NextResponse.json(
            { error: 'Subscription not found' },
            { status: 404 }
          )
        }

        // Update subscription details
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            stripe_subscription_id: subscription.id,
            status: subscription.status,
            plan_type: subscription.items.data[0]?.price.id || 'unknown',
            current_period_start: new Date(
              subscription.current_period_start * 1000
            ).toISOString(),
            current_period_end: new Date(
              subscription.current_period_end * 1000
            ).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', subscriptionData.user_id)

        if (updateError) {
          console.error('Error updating subscription:', updateError)
          return NextResponse.json(
            { error: 'Failed to update subscription' },
            { status: 500 }
          )
        }

        // Update user metadata
        const { error: userUpdateError } = await supabase.auth.admin.updateUserById(
          subscriptionData.user_id,
          {
            user_metadata: {
              subscription_status: subscription.status,
            },
          }
        )

        if (userUpdateError) {
          console.error('Error updating user metadata:', userUpdateError)
        }

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const customerId = subscription.customer

        // Find user by Stripe customer ID
        const { data: subscriptionData, error: fetchError } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (fetchError || !subscriptionData) {
          console.error('Subscription not found for customer:', customerId)
          return NextResponse.json(
            { error: 'Subscription not found' },
            { status: 404 }
          )
        }

        // Set subscription status to canceled
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', subscriptionData.user_id)

        if (updateError) {
          console.error('Error canceling subscription:', updateError)
          return NextResponse.json(
            { error: 'Failed to cancel subscription' },
            { status: 500 }
          )
        }

        // Update user metadata
        const { error: userUpdateError } = await supabase.auth.admin.updateUserById(
          subscriptionData.user_id,
          {
            user_metadata: {
              subscription_status: 'canceled',
            },
          }
        )

        if (userUpdateError) {
          console.error('Error updating user metadata:', userUpdateError)
        }

        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Webhook handler error:', err.message)
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
