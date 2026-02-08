import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { logError } from '../../../utils/logger';
import {
  logWebhook,
  handleCheckoutCompleted,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handlePaymentFailed,
} from '../../../lib/stripeWebhookHandlers';

// Required for Stripe: raw body. Same approach as Stripe's official Next.js Pages example.
export const config = {
  api: {
    bodyParser: false,
  },
};

// Read raw body from stream (official Stripe example pattern - avoids any framework parsing).
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function webhookHandler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

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
      return res.status(500).json({
        error: 'Webhook not configured. Check environment variables.',
      });
    }

    const stripe = new Stripe(stripeSecretKey);
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Raw body from stream (must be exact bytes Stripe sent - no parsing/re-encoding).
    const rawBody = await getRawBody(req);
    const signature = req.headers['stripe-signature'] || req.headers['Stripe-Signature'];

    if (!signature) {
      logError('Webhook missing Stripe-Signature header', null, {});
      return res.status(400).json({ error: 'Missing Stripe-Signature header' });
    }

    let event;
    try {
      // Pass Buffer directly (Stripe SDK accepts string or Buffer/Uint8Array).
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      logError('Webhook signature verification failed', err, {
        bodyLength: rawBody?.length ?? 0,
        secretPrefix: webhookSecret?.slice(0, 7) ?? '(none)',
      });
      return res.status(400).json({ error: 'Invalid signature' });
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

    return res.status(200).json({ received: true });
  } catch (error) {
    logError('Webhook handler failed', error);
    return res.status(500).json({ error: error.message || 'Webhook handler failed' });
  }
}
