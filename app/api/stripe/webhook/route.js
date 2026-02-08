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

// App Router: request.text() = raw body (do NOT use request.json() when verifying signature).
// Optional: STRIPE_WEBHOOK_INSECURE_SKIP_VERIFY=true bypasses verification (Vercel/Next body bug). Use only for launch; fix properly later.
const SKIP_VERIFY = process.env.STRIPE_WEBHOOK_INSECURE_SKIP_VERIFY === 'true';

export async function POST(request) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const needsSecret = !SKIP_VERIFY;
    if (!stripeSecretKey || !supabaseUrl || !serviceRoleKey || (needsSecret && !webhookSecret)) {
      logError('Webhook missing env vars', null, {
        hasStripeSecret: !!stripeSecretKey,
        hasWebhookSecret: !!webhookSecret,
        hasSupabaseUrl: !!supabaseUrl,
        hasServiceRoleKey: !!serviceRoleKey,
        skipVerify: SKIP_VERIFY,
      });
      return NextResponse.json(
        { error: 'Webhook not configured. Check environment variables.' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    let event;

    if (SKIP_VERIFY) {
      const rawBody = await request.text();
      let payload;
      try {
        payload = JSON.parse(rawBody);
      } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
      }
      if (!payload?.id || !payload?.type || !payload?.data?.object) {
        return NextResponse.json({ error: 'Invalid event shape' }, { status: 400 });
      }
      event = payload;
    } else {
      const rawBody = await request.text();
      const signature = request.headers.get('stripe-signature');
      if (!signature) {
        logError('Webhook missing Stripe-Signature header', null, {});
        return NextResponse.json({ error: 'Missing Stripe-Signature header' }, { status: 400 });
      }
      try {
        event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
      } catch (err) {
        logError('Webhook signature verification failed', err, {
          bodyLength: rawBody?.length ?? 0,
          secretPrefix: webhookSecret?.slice(0, 7) ?? '(none)',
        });
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
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
