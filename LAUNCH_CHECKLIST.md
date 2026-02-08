# FieldDeskOps Launch Checklist

Assessment of what’s left before launch (as of this review).

---

## ✅ Fixed in this pass

- **Stripe webhook → profile unlock**  
  Checkout session now includes `metadata: { userId }` so `checkout.session.completed` can update the user’s profile to `paid`. Without this, paying users would stay on free limits.

---

## 🔴 Critical before launch

1. **Environment variables (production)**  
   Ensure these are set in Vercel (or your host):
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (for Stripe webhook only)
   - `NEXT_PUBLIC_SITE_URL` (e.g. `https://fielddeskops.com`)
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Either `NEXT_PUBLIC_STRIPE_PRICE_ID` or `STRIPE_PAYMENT_LINK` / `NEXT_PUBLIC_STRIPE_PAYMENT_LINK` (valid `https://buy.stripe.com/...`)

2. **Stripe webhook**  
   In Stripe Dashboard → Developers → Webhooks, add an endpoint for your production URL (e.g. `https://yourdomain.com/api/stripe/webhook`) and subscribe to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`  
   Set `STRIPE_WEBHOOK_SECRET` to the signing secret Stripe gives you.

3. **Supabase migrations**  
   Confirm these are applied in the project you use for production:
   - `profiles` (subscription fields, trigger for new users)
   - `usage_tracking`
   - Any other migrations in `/supabase_migrations_*.sql`

---

## 🟡 Recommended

4. **Welcome page copy**  
   - LoadOut feature card still says “COMING SOON” but LoadOut is live. Remove or change that badge so it doesn’t say “Coming Soon.”
   - “Hero Visual Placeholder” can stay as-is or be replaced with a real screenshot/mockup when you have one.

5. **Feedback / “Report a problem”**  
   Feedback API requires `RESEND_API_KEY` (and optionally `RESEND_FROM_EMAIL`). If not set, users see “Feedback is not configured… email us directly.” Either:
   - Add Resend and set the env vars so in-app feedback works, or  
   - Keep the current message and ensure your support email (e.g. fielddeskops@gmail.com) is visible.

6. **`/supabase-test`**  
   Consider removing this route in production or protecting it (e.g. only in development or behind a secret path) so it doesn’t expose Supabase connectivity info.

7. **LoadOut – swap items**  
   “Swap” in mass-select mode updates UI only; there’s a comment “Add DB persistence here in future.” Acceptable for launch; add DB persistence later if you want swaps to persist.

8. **Pricing page**  
   Pro plan “Upgrade Now” is wired (checkout + webhook now correctly set profile to paid). “Crews” with “Coming Soon” is fine if that plan isn’t live yet.

---

## 🟢 Already in good shape

- **Auth & routing**  
  Middleware protects `/dashboard`, `/apps/*`, `/account`, etc.; unauthenticated users are redirected to login.

- **Legal**  
  Terms and Privacy pages have real content and are linked.

- **Subscription logic**  
  `subscriptionHelpers` + `tierLimits` + `usage_tracking` are consistent; manual `pro`/`paid` in `profiles` correctly unlocks the account.

- **Stripe flow**  
  Checkout (price ID or payment link), success/cancel URLs, and webhook handlers (with the new metadata fix) are aligned for subscription and profile updates.

---

## Quick pre-launch test

1. Sign up → confirm profile created and default tier/limits.
2. Hit a limit (e.g. add 2 jobs on free) → confirm upgrade prompt.
3. Complete Stripe checkout (test mode) → confirm profile becomes `paid` and limits lift.
4. Use one core flow in each app (ProfitLock, LoadOut, SiteSnap, SignOff) to confirm no hard errors.
5. Test “Report a problem” if you’ve set `RESEND_API_KEY`; otherwise confirm fallback message and support email are clear.

---

**Summary:** With env vars, Stripe webhook, and Supabase migrations in place, the main code-side gap (checkout metadata for webhook) is fixed. The rest is copy tweaks, optional feedback config, and locking down or removing `/supabase-test` for production.
