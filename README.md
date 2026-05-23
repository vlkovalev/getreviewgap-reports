# ReviewGap MVP

ReviewGap is a full-stack MVP for the validated business idea: **AI-powered competitor review intelligence for Shopify brands and Amazon sellers**.

## Product Assumptions

- Target users: Shopify brands, Amazon sellers, and agencies serving those sellers.
- Core problem: teams need to monitor competitor product data, prices, stock, discounts, ratings, and buyer language before launching or improving products.
- Business model: one-off reports first, then monthly report credits. PayPal checkout is implemented for paid plan payments.
- AI: useful and included. A simple deterministic prompt workflow is used instead of a complex multi-agent system.
- Scraping: safe demo adapters are implemented now. Live source adapters should use official APIs, Apify actors, or permitted public pages with rate limits.
- Deployment: Vercel + Supabase/Neon Postgres.

## What Is Implemented

- Marketing homepage for ReviewGap.
- Dashboard with source management, scrape jobs, run history, product table, and report-generation workflow.
- API routes for sources, jobs, manual runs, products, report creation, report detail, regeneration, and CSV/JSON export.
- Seven operational report types: price monitoring, availability, competitor assortment, discount/promotion, review/rating, data quality, and executive summary.
- Modular scraper architecture in `lib/scrapers`.
- Deterministic report engine in `lib/reports/report-engine.ts`.
- Report tests covering all report types and CSV/JSON export.
- AI service with production-oriented prompt template and JSON validation.
- Canopy REST API integration for structured multi-market Amazon review collection when `CANOPY_API_KEY` is configured.
- Apify fallback support for experimentation, with clear empty-data handling when Amazon restricts review-page access.
- CSV/TXT review import for authorized Amazon or Shopify exports.
- Shopify/DTC report workflow using pasted or approved review-app exports until a specific store review provider connector is selected.
- Demo fallback when `OPENAI_API_KEY` or Apify keys are missing.
- Prisma schema for users, profiles, review reports, agent runs, subscriptions, audit events, leads, and inquiries.
- Supabase SQL migrations with UUID primary keys, status fields, indexes, foreign keys, and RLS policies.
- Admin dashboard for report review queue, scraper health, failed runs, and metrics.
- Settings placeholder.
- Contact and resources pages adapted to the new product.

## Agent Design

The current scraper/report MVP uses deterministic report functions instead of a complex agent system. The existing review-intelligence AI workflow remains available at `/api/reports` for competitor review analysis when OpenAI and Apify are configured.

### Agent: Review Intelligence Analyst

- Purpose: Convert competitor review text into a structured product and marketing report.
- Trigger: `POST /api/reports`.
- Inputs: Amazon product URL, optional product name, optional competitor name, optional pasted reviews.
- Outputs: JSON report with complaints, compliments, buyer language, product ideas, ad hooks, assumptions, and data quality notes.
- Tools/APIs: Apify actor for review extraction, OpenAI chat completions for analysis.
- Prompt file: `lib/ai/prompts.ts`.
- Output schema: `lib/ai/schemas.ts`.
- Data stored: `ReviewReport` and `AgentRun` when `DATABASE_URL` is configured.
- Human approval: reports using demo fallback are marked `NEEDS_REVIEW`.
- Failure handling: API returns explicit errors and logs failed agent runs when DB is configured.
- Cost control: max 500 reviews, low temperature, compact JSON schema, no multi-agent loops.

## Environment Variables

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/reviewgap?schema=public"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="change-this-password"
RESEND_API_KEY=""
EMAIL_FROM="ReviewGap <hello@example.com>"
OWNER_EMAIL="owner@example.com"
OPENAI_API_KEY=""
OPENAI_MODEL="gpt-4o-mini"
CANOPY_API_KEY=""
APIFY_TOKEN=""
APIFY_AMAZON_REVIEWS_ACTOR_ID=""
APIFY_INPUT_TEMPLATE=""
PAYPAL_MODE="sandbox"
PAYPAL_CLIENT_ID=""
PAYPAL_CLIENT_SECRET=""
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
NEXT_PUBLIC_GA_MEASUREMENT_ID=""
NEXT_PUBLIC_META_PIXEL_ID=""
NEXT_PUBLIC_LINKEDIN_PARTNER_ID=""
```

Do not commit real secrets. Create a local `.env` file from `.env.example` and paste your rotated API keys there only.

## Setup Checklist

- OpenAI: create or rotate an API key, then set `OPENAI_API_KEY`.
- Amazon reviews: set `CANOPY_API_KEY` for the preferred structured review API workflow. The app infers the Amazon marketplace from the product URL. Canopy documents marketplace-specific review retrieval and a free monthly request allowance.
- Apify fallback: `APIFY_TOKEN` and `APIFY_AMAZON_REVIEWS_ACTOR_ID` remain supported for testing, but Amazon review-page restrictions can cause empty results even on products with visible ratings.
- Shopify: users can generate reports from pasted/exported Shopify review text now. Direct collection must be added for the store's chosen review provider (for example, a permitted export or API integration) rather than pretending every Shopify storefront exposes reviews in one format.
- Database: create a Supabase or Neon Postgres database and set `DATABASE_URL`.
- Admin: set `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
- Email: configure Resend later with `RESEND_API_KEY`, `EMAIL_FROM`, and `OWNER_EMAIL`.
- Payments: PayPal checkout and Stripe card checkout are implemented. Add sandbox/test credentials before taking payments. Stripe webhook support is implemented at `/api/stripe/webhook`.
- Auth: user auth is intentionally not implemented yet; add Supabase Auth or Clerk before multi-user accounts.

## Local Setup

```bash
npm install
npm run dev
```

Open:

```txt
http://127.0.0.1:3000
```

The dashboard works in demo mode without API keys:

```txt
http://127.0.0.1:3000/dashboard
http://127.0.0.1:3000/dashboard/reports
```

## Database Setup

Use Prisma as the source of truth for the production database. The app expects the Prisma schema and migration tables created by `prisma/migrations`.

### Recommended Hosted Postgres

1. Create a Postgres database in Neon, Supabase, Railway, or another hosted Postgres provider.
2. Copy the pooled connection string.
3. Set `DATABASE_URL` in `.env` locally and in Vercel environment variables.
4. Generate the client and apply migrations:

```bash
npx prisma generate
npm run prisma:deploy
```

For local schema changes during development, use:

```bash
npm run prisma:migrate
```

Then seed optional demo content:

```bash
npm run prisma:seed
```

### Supabase SQL Notes

The older `supabase/migrations` files are kept as reference SQL for the original prototype. Do not mix those SQL migrations with Prisma migrations on the same fresh production database unless you intentionally reconcile the table names first. For this app, use Prisma migrations for deployment.

## API Routes

- `GET /api/reports` lists recent reports.
- `POST /api/reports` creates a review intelligence report.
- `GET/POST /api/scraper/sources` lists and creates scraper sources.
- `GET/POST /api/scraper/jobs` lists and creates scrape jobs.
- `POST /api/scraper/jobs/[id]/run` runs a safe demo scrape job.
- `GET /api/scraper/runs` lists scrape run history.
- `GET /api/scraper/products` lists product intelligence records.
- `GET/POST /api/scraper/reports` lists and generates e-commerce intelligence reports. For `REVIEW_RATING` and `EXECUTIVE_SUMMARY`, include `productUrl`, `productName`, `competitorName`, or `pastedReviews` to run live review intelligence when configured.
- `GET/POST /api/scraper/reports/[id]` views or regenerates a report.
- `GET /api/scraper/reports/[id]/export?format=csv|json|pdf` exports reports.
- `POST /api/leads` stores leads.
- `POST /api/inquiries` stores inquiries.
- `POST /api/admin/login` logs into starter admin.
- `GET/POST /api/admin/faqs`, `/api/admin/resources`, `/api/admin/testimonials` are starter protected content APIs.

## Prompt Requirements

The production prompt specifies:

- Role
- Objective
- Input format
- Output schema
- Quality rules
- Refusal/error behavior
- No hallucinated facts
- Clear assumptions when data is missing

See `lib/ai/prompts.ts`.

## Deployment

1. Push the project to GitHub.
2. Create a Vercel project.
3. Add a Supabase or Neon Postgres database.
4. Add environment variables.
5. Run Prisma migration with `npm run prisma:deploy`.
6. Deploy.
7. Test homepage, dashboard, report generation, admin login, and contact form.

See `DEPLOYMENT.md` for the full production checklist.

## Verification

```bash
npm run test
npm run typecheck
npm run build
```

CSV, JSON, and PDF exports are implemented and tested for generated reports.

## Manual Setup Still Needed

- Create a Canopy API key and set `CANOPY_API_KEY` for reliable Amazon review retrieval; verify it with products from every marketplace you intend to support.
- Add `OPENAI_API_KEY`.
- Add real authentication if user accounts are required.
- Add PayPal REST API credentials before taking PayPal payments; checkout is denominated in USD.
- Add `STRIPE_SECRET_KEY` before taking USD card payments through Stripe Checkout.
- Add `STRIPE_WEBHOOK_SECRET` before real subscriptions. The webhook listens for `checkout.session.completed` and `invoice.paid`.
- Add email/domain verification for Resend.
- Replace demo content with real sample reports.
- Add a custom domain in Vercel, set `NEXT_PUBLIC_SITE_URL` to the HTTPS domain, and redeploy.
- Add analytics IDs only after privacy/legal text is final.
