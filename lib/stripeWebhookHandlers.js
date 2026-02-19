import { logError } from '../utils/logger';

export function logWebhook(context, details) {
  console.error(`[FieldDeskOps] Webhook: ${context}`, details);
}

export async function handleCheckoutCompleted(session, supabase) {
  // Payment Link flow: client_reference_id is set from URL params. Session API flow: metadata.userId or client_reference_id.
  const rawRef = session.metadata?.userId ?? session.client_reference_id;
  const userId = rawRef ? String(rawRef).trim() || null : null;
  const stripeCustomerId = typeof session.customer === 'string' ? session.customer : null;
  const stripeSubscriptionId = typeof session.subscription === 'string' ? session.subscription : null;

  logWebhook('checkout.session.completed', {
    client_reference_id: session.client_reference_id ?? '(none)',
    metadata_userId: session.metadata?.userId ?? '(none)',
    resolved_userId: userId ?? '(none)',
    customer: stripeCustomerId ?? '(none)',
  });

  if (!userId) {
    logError('Webhook checkout skipped: no userId in session', null, {
      hint: 'Payment Link URL must include ?client_reference_id=<user_uuid>. Check Stripe Dashboard -> Webhooks -> event payload for client_reference_id on the session.',
    });
    throw new Error('Webhook checkout failed: missing userId');
  }

  const updatePayload = {
    subscription_status: 'paid',
    subscription_tier: 'paid',
    stripe_customer_id: stripeCustomerId,
    stripe_subscription_id: stripeSubscriptionId,
  };

  const { data, error } = await supabase
    .from('profiles')
    .update(updatePayload)
    .eq('id', userId)
    .select('id')
    .maybeSingle();

  if (error) {
    logError('Webhook profile update failed', error, { userId });
    throw new Error(`Webhook profile update failed for user ${userId}`);
  }

  // If no row exists yet, create/merge it with service-role privileges.
  if (!data?.id) {
    logError('Webhook profile update: no row updated', null, {
      userId,
      hint: 'No profile with this id. Creating one via webhook upsert.',
    });

    const { data: upserted, error: upsertError } = await supabase
      .from('profiles')
      .upsert({ id: userId, ...updatePayload }, { onConflict: 'id' })
      .select('id')
      .maybeSingle();

    if (upsertError || !upserted?.id) {
      logError('Webhook profile upsert failed after missing row', upsertError, { userId });
      throw new Error(`Webhook profile upsert failed for user ${userId}`);
    }

    logWebhook('checkout.session.completed profile upserted', { userId });
    return;
  }

  logWebhook('checkout.session.completed profile updated', { userId });
}

export async function handleSubscriptionUpdated(subscription, supabase) {
  const isPaid = subscription.status === 'active' || subscription.status === 'trialing';
  const stripeCustomerId = typeof subscription.customer === 'string' ? subscription.customer : null;
  const updatePayload = {
    subscription_status: isPaid ? 'paid' : 'inactive',
    subscription_tier: isPaid ? 'paid' : 'free',
  };

  const { data, error } = await supabase
    .from('profiles')
    .update(updatePayload)
    .eq('stripe_subscription_id', subscription.id)
    .select('id');

  if (error) {
    logError('Webhook subscription update failed', error, { subscriptionId: subscription.id });
    throw new Error(`Webhook subscription update failed for subscription ${subscription.id}`);
  }

  if (Array.isArray(data) && data.length > 0) {
    return;
  }

  if (!stripeCustomerId) {
    logError('Webhook subscription update found no profile and no customer id', null, {
      subscriptionId: subscription.id,
      status: subscription.status,
    });
    throw new Error(`No profile found for subscription ${subscription.id}`);
  }

  const { data: fallbackData, error: fallbackError } = await supabase
    .from('profiles')
    .update({
      ...updatePayload,
      stripe_subscription_id: subscription.id,
    })
    .eq('stripe_customer_id', stripeCustomerId)
    .select('id');

  if (fallbackError || !Array.isArray(fallbackData) || fallbackData.length === 0) {
    logError('Webhook subscription update fallback failed', fallbackError, {
      subscriptionId: subscription.id,
      customerId: stripeCustomerId,
    });
    throw new Error(`No profile found for subscription ${subscription.id} or customer ${stripeCustomerId}`);
  }
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
