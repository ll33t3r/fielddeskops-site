import { createClient } from '@supabase/supabase-js';
import { logError } from '../utils/logger';

export function logWebhook(context, details) {
  console.error(`[FieldDeskOps] Webhook: ${context}`, details);
}

export async function handleCheckoutCompleted(session, supabase) {
  // Payment Link flow: client_reference_id is set from URL params. Session API flow: metadata.userId or client_reference_id.
  const rawRef = session.metadata?.userId ?? session.client_reference_id;
  const userId = rawRef ? String(rawRef).trim() || null : null;

  logWebhook('checkout.session.completed', {
    client_reference_id: session.client_reference_id ?? '(none)',
    metadata_userId: session.metadata?.userId ?? '(none)',
    resolved_userId: userId ?? '(none)',
    customer: typeof session.customer === 'string' ? session.customer : '(none)',
  });

  if (!userId) {
    logError('Webhook checkout skipped: no userId in session', null, {
      hint: 'Payment Link URL must include ?client_reference_id=<user_uuid>. Check Stripe Dashboard → Webhooks → event payload for client_reference_id on the session.',
    });
    return;
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'paid',
      subscription_tier: 'paid',
      stripe_customer_id: session.customer ?? null,
      stripe_subscription_id: session.subscription ?? null,
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
      hint: 'No profile with this id. Ensure the user has a row in profiles (created when they hit checkout).',
    });
    return;
  }
  logWebhook('checkout.session.completed profile updated', { userId });
}

export async function handleSubscriptionUpdated(subscription, supabase) {
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: subscription.status === 'active' ? 'paid' : 'inactive',
      subscription_tier: subscription.status === 'active' ? 'paid' : 'free',
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) logError('Webhook subscription update failed', error);
}

export async function handleSubscriptionDeleted(subscription, supabase) {
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

export async function handlePaymentFailed(invoice, supabase) {
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'inactive',
    })
    .eq('stripe_customer_id', invoice.customer);

  if (error) logError('Webhook failed payment handling failed', error);
}
