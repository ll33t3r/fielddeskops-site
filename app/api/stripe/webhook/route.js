import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { logError } from '../../../../utils/logger';
import {
  logWebhook,
  handleCheckoutCompleted,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handlePaymentFailed,
} from '../../../../lib/stripeWebhookHandlers';

// Official Stripe App Router pattern: use req.text() for raw body (no Node stream layer).
export async function POST(req) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
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
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Exactly as Stripe's official Next.js App Router example: request.text() for raw body.
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      logError('Webhook missing Stripe-Signature header', null, {});
      return NextResponse.json({ error: 'Missing Stripe-Signature header' }, { status: 400 });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      logError('Webhook signature verification failed', err, {
        bodyLength: body?.length ?? 0,
        secretPrefix: webhookSecret?.slice(0, 7) ?? '(none)',
      });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

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
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logError('Webhook handler failed', error);
    return NextResponse.json(
      { error: error.message || 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
