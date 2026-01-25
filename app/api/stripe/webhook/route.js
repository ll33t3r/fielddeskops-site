import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { NextResponse } from 'next/server';

// Helper to prevent static generation errors
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    // Initialize Stripe INSIDE the function to prevent build errors
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Missing STRIPE_SECRET_KEY');
    }
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    // Initialize Supabase
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.text();
    const sig = req.headers.get('stripe-signature');
    let event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      return NextResponse.json({ error: `Webhook Signature Error: ${err.message}` }, { status: 400 });
    }

    // Handle the event: checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.client_reference_id; 
      
      if (userId) {
        await supabase.from('subscriptions').upsert({ 
            user_id: userId,
            stripe_customer_id: session.customer,
            status: 'pro', 
            plan_type: 'monthly',
            updated_at: new Date().toISOString()
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook Handler Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
