import Stripe from 'stripe';
import { buffer } from 'micro';
import { createClient } from '@supabase/supabase-js';
import { logError } from '../../../utils/logger';
import {
  logWebhook,
  handleCheckoutCompleted,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handlePaymentFailed,
} from '../../../lib/stripeWebhookHandlers';

// Required for Stripe: use raw body so signature verification works on Vercel.
export const config = {
  api: {
    bodyParser: false,
  },
};

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

    // Raw body via micro - required for Stripe signature verification on Vercel.
    const requestBuffer = await buffer(req);
    const body = requestBuffer.toString('utf8');
    const signature = req.headers['stripe-signature'] || req.headers['Stripe-Signature'];

    if (!signature) {
      logError('Webhook missing Stripe-Signature header', null, {});
      return res.status(400).json({ error: 'Missing Stripe-Signature header' });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      logError('Webhook signature verification failed', err, {
        bodyLength: body?.length ?? 0,
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
