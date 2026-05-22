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
PAYPAL_MODE
PAYPAL_CLIENT_ID
PAYPAL_CLIENT_SECRET
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
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
```

5. Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

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
- Report export works for CSV and JSON.
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
