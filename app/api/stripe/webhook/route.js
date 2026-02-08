import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { logError } from '../../../../utils/logger';

function logWebhook(context, details) {
  console.error(`[FieldDeskOps] Webhook: ${context}`, details);
}

export async function POST(req) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!stripeSecretKey || !webhookSecret || !supabaseUrl || !serviceRoleKey) {
      logError('Webhook missing env vars', null, {
        hasStripeSecret: !!stripeSecretKey,
        hasWebhookSecret: !!webhookSecret,
        hasSupabaseUrl: !!supabaseUrl,
        hasServiceRoleKey: !!serviceRoleKey,
      });
      return NextResponse.json(
        { error: 'Webhook not configured. Check environment variables.' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);
    // Service role key bypasses RLS; webhook should be the only caller.
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.text();
    const signature = headers().get('stripe-signature');

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      logError('Webhook signature verification failed', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object, supabase);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object, supabase);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object, supabase);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object, supabase);
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logError('Webhook handler failed', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session, supabase) {
  // Payment Link checkouts use client_reference_id (we pass it in the URL); API-created sessions use metadata.userId
  const userId = session.metadata?.userId || session.client_reference_id;

  logWebhook('checkout.session.completed', {
    client_reference_id: session.client_reference_id ?? '(none)',
    metadata_userId: session.metadata?.userId ?? '(none)',
    resolved_userId: userId ?? '(none)',
    customer: typeof session.customer === 'string' ? session.customer : '(none)',
  });

  if (!userId) {
    logError('Webhook checkout skipped: no userId in session', null, {
      hint: 'Payment Link must be opened with ?client_reference_id=<user_id>. Check that checkout passes the link with that param.',
    });
    return;
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'paid',
      subscription_tier: 'paid',
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
    })
    .eq('id', userId)
    .select('id')
    .maybeSingle();

  if (error) {
    logError('Webhook profile update failed', error, { userId });
    return;
  }
  if (!data) {
    logError('Webhook profile update: no row updated', null, {
      userId,
      hint: 'No profile with this id. Ensure the user has a row in profiles.',
    });
    return;
  }
  logWebhook('checkout.session.completed profile updated', { userId });
}

async function handleSubscriptionUpdated(subscription, supabase) {
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: subscription.status === 'active' ? 'paid' : 'inactive',
      subscription_tier: subscription.status === 'active' ? 'paid' : 'free',
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) logError('Webhook subscription update failed', error);
}

async function handleSubscriptionDeleted(subscription, supabase) {
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'free',
      subscription_tier: 'free',
      stripe_subscription_id: null,
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) logError('Webhook cancellation handling failed', error);
}

async function handlePaymentFailed(invoice, supabase) {
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'inactive',
    })
    .eq('stripe_customer_id', invoice.customer);

  if (error) logError('Webhook failed payment handling failed', error);
}
