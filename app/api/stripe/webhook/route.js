import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const body = await req.text();
    const signature = headers().get('stripe-signature');

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session) {
  const userId = session.metadata?.userId;
  if (!userId) return;

  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'paid',
      subscription_tier: 'paid',
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
    })
    .eq('id', userId);

  if (error) console.error('Error updating profile:', error);
}

async function handleSubscriptionUpdated(subscription) {
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: subscription.status === 'active' ? 'paid' : 'inactive',
      subscription_tier: subscription.status === 'active' ? 'paid' : 'free',
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) console.error('Error updating subscription:', error);
}

async function handleSubscriptionDeleted(subscription) {
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'free',
      subscription_tier: 'free',
      stripe_subscription_id: null,
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) console.error('Error handling cancellation:', error);
}

async function handlePaymentFailed(invoice) {
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'inactive',
    })
    .eq('stripe_customer_id', invoice.customer);

  if (error) console.error('Error handling failed payment:', error);
}
