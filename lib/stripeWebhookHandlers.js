import { createClient } from '@supabase/supabase-js';
import { logError } from '../utils/logger';

export function logWebhook(context, details) {
  console.error(`[FieldDeskOps] Webhook: ${context}`, details);
}

export async function handleCheckoutCompleted(session, supabase) {
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
