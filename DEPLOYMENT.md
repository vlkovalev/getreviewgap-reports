# ReviewIntel Reports Deployment Checklist

Use this checklist when moving from local testing to a public deployment.

## 1. Database

Neon is already a good fit for this project.

1. Create or open the Neon project.
2. Copy the pooled Postgres connection string.
3. Add it to Vercel as `DATABASE_URL`.
4. Run the Prisma production migration from your machine:

```bash
npm run prisma:deploy
npm run prisma:seed
```

Do not run the older `supabase/migrations` SQL files on the same database. Prisma migrations are the source of truth.

## 2. Vercel Environment Variables

Add these in Vercel Project Settings -> Environment Variables:

```txt
DATABASE_URL
NEXT_PUBLIC_SITE_URL
ADMIN_EMAIL
ADMIN_PASSWORD
OPENAI_API_KEY
OPENAI_MODEL
APIFY_TOKEN
APIFY_AMAZON_REVIEWS_ACTOR_ID
APIFY_INPUT_TEMPLATE
PAYPAL_MODE
PAYPAL_CLIENT_ID
PAYPAL_CLIENT_SECRET
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_GA_MEASUREMENT_ID
NEXT_PUBLIC_META_PIXEL_ID
NEXT_PUBLIC_LINKEDIN_PARTNER_ID
RESEND_API_KEY
EMAIL_FROM
OWNER_EMAIL
```

For production, `NEXT_PUBLIC_SITE_URL` must be your HTTPS domain, for example:

```txt
https://reviewintel-reports.com
```

## 3. Stripe

1. Use test keys until the full flow is verified.
2. Add `STRIPE_SECRET_KEY`.
3. Create a webhook endpoint:

```txt
https://yourdomain.com/api/stripe/webhook
```

4. Listen for:

```txt
checkout.session.completed
invoice.paid
```

5. Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

The webhook grants credits idempotently. The checkout success page also grants credits as a fallback, but both paths use the same checkout-session reference so customers should not receive duplicate credits for the same Stripe session.

## 3.1 Apify Amazon Review Actor

Set `APIFY_TOKEN` and `APIFY_AMAZON_REVIEWS_ACTOR_ID`. If your selected actor does not accept the default `productUrl`, `productUrls`, or `startUrls` input, add an input template like this:

```json
{"startUrls":[{"url":"{{PRODUCT_URL}}"}],"maxItems":500}
```

Paste that JSON into `APIFY_INPUT_TEMPLATE` in Vercel. The app replaces `{{PRODUCT_URL}}` at runtime.

If live reports fail with `Apify authentication failed`, the token is missing, expired, copied from the wrong Apify account, or does not have permission to run the selected actor. If they fail with `Apify actor not found`, copy the actor id exactly from Apify; ids like `username/actor-name` are accepted and normalized by the app.

## 3.2 Custom Domain

1. In Vercel, open the `reviewintel-reports` project.
2. Go to Domains.
3. Add your domain.
4. Follow Vercel's DNS instructions at your domain registrar.
5. Update `NEXT_PUBLIC_SITE_URL` to the HTTPS domain.
6. Redeploy and test `/pricing`, checkout success/cancel URLs, and report links.

## 3.3 Analytics

Optional environment variables:

```txt
NEXT_PUBLIC_GA_MEASUREMENT_ID
NEXT_PUBLIC_META_PIXEL_ID
NEXT_PUBLIC_LINKEDIN_PARTNER_ID
```

The app also records lightweight internal events in `AuditEvent` when the database is configured:

- `analytics.page_view`
- `analytics.checkout_started`
- `analytics.report_generated`
- `analytics.report_generation_failed`
- `analytics.report_export_started`

## 4. PayPal

For testing:

```txt
PAYPAL_MODE=sandbox
```

Use Sandbox REST app credentials and a Sandbox Personal buyer account.

For production:

```txt
PAYPAL_MODE=live
```

Use Live REST app credentials and test with a small real transaction.

## 5. Build Settings

Vercel can use the defaults:

```txt
Install command: npm install
Build command: npm run build
Output directory: .next
```

The `postinstall` script runs `prisma generate`, so the Prisma Client is generated during Vercel installs.

## 6. Post-Deploy Smoke Test

After deployment, test:

- Homepage loads.
- Pricing page loads.
- Sign up creates an account.
- Billing shows the account and credits.
- Stripe checkout opens in test mode.
- Stripe webhook grants credits after payment.
- PayPal checkout opens.
- Report generation consumes 1 credit.
- Report export works for CSV, JSON, and PDF.
- Stripe webhook event delivery succeeds in the Stripe dashboard.
- Analytics events appear in the database or provider dashboard when configured.
- Admin login works.
- Admin readiness panel shows expected statuses.

## 7. Before Real Customers

- Switch Stripe from test to live keys.
- Switch PayPal from sandbox to live.
- Use a real support email.
- Set a real `NEXT_PUBLIC_SITE_URL`.
- Verify legal pages match the actual product.
- Add real sample reports and screenshots.
- Run one full paid purchase test.
