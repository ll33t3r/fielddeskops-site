# Message to Send to Vercel About Stripe Webhook Body Modification

Use this when opening a **support ticket** (Vercel Dashboard → Help → Contact Support) or posting on [Vercel Community](https://community.vercel.com/).

---

## Copy-paste message

**Subject:** Next.js App Router: request body differs from original on Stripe webhook (signature verification fails)

**Message:**

We're on Next.js 14 (App Router) deployed on Vercel. Our Stripe webhook at `app/api/stripe/webhook/route.js` follows the documented pattern for raw body + signature verification:

- We use **only** `const rawBody = await request.text()` (no `request.json()`).
- We pass `rawBody` and the `Stripe-Signature` header to `stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)`.
- The route is **excluded from middleware** via `matcher` so middleware never runs for `/api/stripe/webhook`.
- Webhook URL in Stripe is exactly `https://www.fielddeskops.com/api/stripe/webhook` (we get HTTP 400, not 307).

**Problem:** Signature verification **always fails in production** with:

`No signatures found matching the expected signature for payload. Are you passing the raw request body you received from Stripe?`

We've confirmed: the webhook secret is set and read correctly, and `rawBody.length` is non-zero (e.g. 5693). So we **do** receive a body, but it does not match the exact bytes Stripe signed. That implies the request body is being altered somewhere between Stripe’s request and our route handler (encoding, normalization, or parsing before we call `request.text()`).

**Question:** Does the Vercel/Next.js runtime (or any proxy in front of it) modify the request body—e.g. re-encoding, normalizing line endings, or parsing JSON—before the App Router route handler runs? If so, is there a supported way to get the **exact** raw body for signature verification (e.g. Stripe webhooks)?

We’re following [your guide](https://vercel.com/guides/how-do-i-get-the-raw-body-of-a-serverless-function) and the Stripe Next.js example (using `request.text()`). This works locally but fails in production on Vercel. We’d like to keep verification enabled and avoid workarounds.

**Environment:** Production, Next.js 14 App Router, Vercel.

Thank you.

---

## Where to send

1. **Vercel Support (recommended)**  
   Dashboard → **Help** (?) → **Contact Support** → describe the issue and paste the message above. Pro/Enterprise get faster responses.

2. **Vercel Community**  
   https://community.vercel.com/  
   New topic in e.g. “Next.js” or “General”, same subject + message. Tag with `nextjs`, `webhooks`, `stripe` if the forum allows.

3. **Next.js GitHub (if you suspect framework bug)**  
   https://github.com/vercel/next.js/issues  
   Search first for “webhook raw body” or “request.text() body”; if nothing matches, open an issue with the same technical details and note “works locally, fails on Vercel production.”

---

## What you’ve already tried (for your reference)

- App Router with `request.text()` only.
- Excluding `/api/stripe/webhook` from middleware matcher.
- Correct webhook URL (with `www`) so no redirect.
- New webhook endpoint + new signing secret in Stripe and Vercel; redeploy.
- Pages API with `bodyParser: false` + raw stream read (same failure).

This is only for your notes; no need to dump all of this in the first message unless support asks.
