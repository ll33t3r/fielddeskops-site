# FieldDeskOps Production Readiness

Use this as the final go/no-go checklist before launch.

## 1) Environment variables (hosting platform)

Set and verify these in production:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` (production domain)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_STRIPE_PRICE_ID` or `NEXT_PUBLIC_STRIPE_PAYMENT_LINK`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`
- Optional: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`

## 2) Stripe webhook

Create webhook endpoint:

- `https://<your-domain>/api/stripe/webhook`

Subscribe to events:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

Set `STRIPE_WEBHOOK_SECRET` from Stripe in production env.

## 3) Supabase migrations

Apply all `supabase_migrations_*.sql` in the production project, including:

- `supabase_migrations_prelaunch_missing_tables_rls.sql`
- `supabase_migrations_contract_signing_rls_patch.sql`
- `supabase_migrations_prelaunch_subscription_enforcement.sql`
- `supabase_migrations_usage_tracking.sql`

Then run:

- `supabase_prelaunch_verification.sql`

## 4) Mandatory checks

- RLS is enabled for `contract_templates`, `contract_photos`, `contract_shares`.
- Stripe webhook delivers 2xx and updates profile/subscription state.
- Auth works (signup/login/logout), protected routes redirect correctly.
- One successful flow in each app: ProfitLock, SiteSnap, SignOff, LoadOut.

## 5) Go/No-Go

Go live only if all items above are green. If any fail, fix and retest before launch.
