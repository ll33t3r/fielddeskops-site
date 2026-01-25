import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
// Note: We use the service role key here to bypass RLS policies and write to the DB
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function POST(req) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  // Handle the event: checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.client_reference_id; // Matches the ID sent from the button
    
    if (userId) {
      // Upsert the subscription status to "pro"
      const { error } = await supabase.from('subscriptions').upsert({ 
          user_id: userId,
          stripe_customer_id: session.customer,
          status: 'pro', 
          plan_type: 'monthly',
          updated_at: new Date().toISOString()
      });

      if (error) {
        console.error('Supabase update failed:', error);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
