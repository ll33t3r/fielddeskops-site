# FieldDeskOps – Context Checkpoint (for new agent thread)

**Date:** Feb 8, 2026  
**Use this:** Copy the sections below into a new agent thread so the next agent has full context.

---

## Project overview

- **Stack:** Next.js 14 (App Router + some Pages), Supabase (auth, DB, RLS), Stripe (subscriptions).
- **App:** FieldDeskOps – field ops: jobs, estimates, photos, contracts, inventory. Free vs Pro ($19.99/mo).
- **Repo:** `FieldDeskOps` (Vercel deploy; production URL `https://www.fielddeskops.com`).

---

## What’s implemented and working

- **Pricing page** (`app/pricing/page.js`): Only Free and Pro ($19.99). Crews tier removed; grid is 2 columns.
- **Checkout:** User clicks “Upgrade to Pro” → `POST /api/stripe/checkout` → returns Stripe Payment Link URL with `client_reference_id` and `prefilled_email` → user redirects to Stripe, pays, then redirects to `https://www.fielddeskops.com/dashboard?success=true`.
- **Payment link:** Comes from `lib/stripePaymentLink.js` – `getPaymentLink()` uses `NEXT_PUBLIC_STRIPE_PAYMENT_LINK` or fallback (currently test link). Checkout route prefers client-sent `paymentLink` in body, then server env `STRIPE_PAYMENT_LINK` / `STRIPE_CHECKOUT_LINK`. Regex allows test links: `https://buy.stripe.com/test_xxx` (underscore in path).
- **Webhook URL in Stripe:** Must be **exact** `https://www.fielddeskops.com/api/stripe/webhook` (with `www`) so Stripe gets 200, not 307 redirect.
- **Webhook handler** (`app/api/stripe/webhook/route.js`): App Router POST; uses `rawBody = await request.text()` (never `request.json()`); `stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)`; then handles `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`. Uses `lib/stripeWebhookHandlers.js` for DB updates.
- **Upgrade logic:** On `checkout.session.completed`, webhook uses `session.client_reference_id` (from Payment Link URL) as user id and updates `profiles`: `subscription_status: 'paid'`, `subscription_tier: 'paid'`, `stripe_customer_id`, `stripe_subscription_id`.
- **Middleware** (`middleware.js`): `/api/stripe/webhook` is excluded from the matcher so the webhook request is not touched by middleware.
- **Account page:** Shows real plan (Free/Pro/Trial), Billing Portal button when user has Stripe customer, “Upgrade to Pro” link when not. Uses `BillingPortalButton.jsx` and account subscription fields from `profiles`.

---

## Persistent issue: Stripe webhook signature verification (400)

- **Symptom:** Stripe sends webhook → our handler returns **400** with “Invalid signature” / “No signatures found matching the expected signature for payload.”
- **What we know:** Secret is read (`whsec_m...` in logs); body length is non-zero (e.g. 3754, 5693). So the **body we receive is not the exact raw body Stripe signed** (likely modified by Vercel/Next before our route runs).
- **Already tried (no fix):**
  - App Router with `request.text()` (official Stripe pattern).
  - Pages API with `bodyParser: false` + `micro` buffer.
  - Pages API with manual stream read `req.on('data')` + `Buffer.concat(chunks)`.
  - Excluding `/api/stripe/webhook` from middleware matcher.
  - Ensuring webhook URL in Stripe is `https://www.fielddeskops.com/api/stripe/webhook` (no 307).
  - New webhook endpoint + new signing secret in Vercel; redeploy.
- **Current code:** Single webhook at `app/api/stripe/webhook/route.js`; strict verification only (no skip-verify env). Pattern: `rawBody = await request.text()`, then `constructEvent(rawBody, signature, webhookSecret)`.
- **If verification keeps failing:** Likely cause is request body being altered by the platform before the route. Options: minimal repro on Vercel, try another host for the webhook, or contact Vercel support. There was previously an escape hatch `STRIPE_WEBHOOK_INSECURE_SKIP_VERIFY`; it was removed in favor of the “proper” pattern only.

---

## Env vars (Vercel)

- **Stripe:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PAYMENT_LINK` and/or `STRIPE_CHECKOUT_LINK` (optional; client can send link in body). For testing use **test** keys and **test** payment link.
- **Supabase:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- **App:** `NEXT_PUBLIC_SITE_URL` (e.g. `https://www.fielddeskops.com`).

---

## Key file paths

- Checkout: `app/api/stripe/checkout/route.js`
- Webhook: `app/api/stripe/webhook/route.js`
- Webhook handlers (DB): `lib/stripeWebhookHandlers.js`
- Payment link helper: `lib/stripePaymentLink.js`
- Middleware: `middleware.js` (webhook path excluded in matcher)
- Subscription limits: `lib/subscription/tierLimits.js`, `lib/subscription/subscriptionHelpers.js`

---

## Suggested next steps for new agent

1. If user says webhook still 400: re-confirm pattern (only `request.text()`, no `.json()`), then consider Vercel/body-modification or alternative hosting for webhook.
2. If user says “payment works but account doesn’t upgrade”: check that Stripe endpoint URL has `www`, that `client_reference_id` is in the Payment Link URL from checkout, and that webhook is returning 200 (and that `STRIPE_WEBHOOK_SECRET` matches the endpoint).
3. For live go-live: switch Stripe to live mode, set live keys and live payment link (and live webhook endpoint + secret) in Vercel; update `lib/stripePaymentLink.js` fallback if still used.

---

*End of checkpoint. Copy everything above into the new thread.*
