# Security Checklist

This project uses environment variables for sensitive credentials. Never commit real keys to git.

## Local setup
- Keep secrets only in `.env.local` (ignored by git).
- Keep placeholders in `.env.example`.
- Install git hooks once per clone:

```bash
npm run hooks:install
```

## Secret scanning
- Scan all tracked files:

```bash
npm run secrets:scan
```

- Scan staged files (used by pre-commit hook):

```bash
npm run secrets:scan:staged
```

## If you suspect a leak
1. Rotate compromised credentials immediately in provider dashboards:
- Supabase: rotate `SUPABASE_SERVICE_ROLE_KEY` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Stripe: rotate `STRIPE_SECRET_KEY` and webhook secret.
- Resend: rotate `RESEND_API_KEY`.
2. Update environment variables in your deployment platform.
3. Invalidate existing sessions/tokens if applicable.
4. Remove secrets from git history if they were committed.
5. Re-run `npm run secrets:scan` before pushing.

## Production guidance
- Keep `ENABLE_SUPABASE_TEST_ROUTE=false` in production.
- Use least privilege and RLS for all Supabase tables.
- Do not log raw secrets or authorization headers.
