# Stripe on fielddeskops.com – Troubleshooting

When Stripe works on **Vercel preview** and **localhost** but fails on **fielddeskops.com**, check the following.

---

## 1. Vercel production env vars

Vercel uses different env vars for **Production** vs **Preview**. Production = your custom domain (`fielddeskops.com`).

**In Vercel → Project → Settings → Environment Variables:**

- Ensure Production is checked for all needed vars.
- `NEXT_PUBLIC_SITE_URL` **must match the domain users visit:**
  - If users go to `https://fielddeskops.com` → set `https://fielddeskops.com`
  - If users go to `https://www.fielddeskops.com` → set `https://www.fielddeskops.com`
- Double-check:
  - `STRIPE_SECRET_KEY` (use live key for production)
  - `STRIPE_WEBHOOK_SECRET` (from the webhook for fielddeskops.com)
  - `NEXT_PUBLIC_STRIPE_PRICE_ID` or `STRIPE_PRICE_ID`
  - All Supabase vars

---

## 2. Stripe webhook URL

The webhook URL in Stripe must match the canonical domain:

- `https://fielddeskops.com/api/stripe/webhook` OR
- `https://www.fielddeskops.com/api/stripe/webhook`

Whichever is the main URL (no redirect). If `fielddeskops.com` 301s to `www.fielddeskops.com`, use `www` in the webhook.

Use the correct **Signing secret** for that endpoint and put it in `STRIPE_WEBHOOK_SECRET` in Vercel Production.

---

## 3. Supabase auth redirect URLs

In **Supabase Dashboard → Authentication → URL Configuration:**

- **Site URL:** same as `NEXT_PUBLIC_SITE_URL` (e.g. `https://fielddeskops.com` or `https://www.fielddeskops.com`)
- **Redirect URLs** must include:
  - `https://fielddeskops.com/auth/callback`
  - `https://www.fielddeskops.com/auth/callback` (if you use both)

Without these, auth can fail after checkout redirects.

---

## 4. What is actually failing?

- **“Upgrade” doesn’t go to Stripe**  
  Check Vercel Production logs. Likely: missing env var, `getUser()` returning null (auth/redirect issue), or `NEXT_PUBLIC_SITE_URL` not set.

- **Checkout completes, but user stays Free**  
  Webhook signature or delivery. Check Stripe Dashboard → Developers → Webhooks → your endpoint.  
  If status is not 2xx, webhook body may be modified before your route. See `VERCEL_WEBHOOK_SUPPORT_MESSAGE.md` for Vercel support guidance.

- **Success redirect goes to wrong domain**  
  `success_url` and `cancel_url` come from `NEXT_PUBLIC_SITE_URL`. Ensure it matches the domain users actually use.

---

## 5. Quick checks

1. Visit `https://fielddeskops.com` and log in.
2. Open DevTools → Network.
3. Click Upgrade. Look at the `/api/stripe/checkout` response.
4. If 401 → auth/cookie problem on production.
5. If 500 → check Vercel Production function logs and env vars.
6. If 200 with `url` → checkout created; if redirect fails or user isn’t upgraded, focus on redirect URLs and webhook.

---

## 6. Redeploy after env changes

When changing Production env vars, redeploy:

- Vercel → Deployments → … on latest → Redeploy
