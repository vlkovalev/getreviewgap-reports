import { getDb, hasRealDatabaseUrl } from "@/lib/db"

export type ReadinessCheck = {
  label: string
  status: "ready" | "warning" | "missing"
  detail: string
}

export async function getReadinessChecks(): Promise<ReadinessCheck[]> {
  const checks: ReadinessCheck[] = []
  const hasDatabaseUrl = hasRealDatabaseUrl()
  let databaseReady = false

  if (hasDatabaseUrl) {
    try {
      await getDb().$queryRaw`select 1`
      databaseReady = true
    } catch {
      databaseReady = false
    }
  }

  checks.push({
    label: "Database",
    status: databaseReady ? "ready" : hasDatabaseUrl ? "warning" : "missing",
    detail: databaseReady ? "Connected to Postgres." : hasDatabaseUrl ? "DATABASE_URL is set, but the app could not reach the database." : "Add a real Neon/Supabase Postgres DATABASE_URL."
  })

  checks.push({
    label: "Stripe checkout",
    status: clean(process.env.STRIPE_SECRET_KEY)?.startsWith("sk_") ? "ready" : "missing",
    detail: clean(process.env.STRIPE_SECRET_KEY)?.startsWith("sk_") ? "Card checkout key is configured." : "Add STRIPE_SECRET_KEY to enable card checkout."
  })

  checks.push({
    label: "Stripe webhook",
    status: clean(process.env.STRIPE_WEBHOOK_SECRET)?.startsWith("whsec_") ? "ready" : "warning",
    detail: clean(process.env.STRIPE_WEBHOOK_SECRET)?.startsWith("whsec_") ? "Webhook signing secret is configured." : "Add STRIPE_WEBHOOK_SECRET before production."
  })

  checks.push({
    label: "PayPal checkout",
    status: clean(process.env.PAYPAL_CLIENT_ID) && clean(process.env.PAYPAL_CLIENT_SECRET) ? "ready" : "missing",
    detail: clean(process.env.PAYPAL_CLIENT_ID) && clean(process.env.PAYPAL_CLIENT_SECRET) ? `PayPal ${process.env.PAYPAL_MODE === "live" ? "live" : "sandbox"} credentials are configured.` : "Add PayPal REST app credentials."
  })

  checks.push({
    label: "OpenAI analysis",
    status: clean(process.env.OPENAI_API_KEY)?.startsWith("sk-") ? "ready" : "warning",
    detail: clean(process.env.OPENAI_API_KEY)?.startsWith("sk-") ? "AI report generation key is configured." : "Add OPENAI_API_KEY for real AI analysis; demo fallback may still run."
  })

  const hasCanopy = Boolean(clean(process.env.CANOPY_API_KEY))
  const hasApify = Boolean(clean(process.env.APIFY_TOKEN) && clean(process.env.APIFY_AMAZON_REVIEWS_ACTOR_ID))
  checks.push({
    label: "Amazon review connector",
    status: hasCanopy ? "ready" : hasApify ? "warning" : "missing",
    detail: hasCanopy
      ? "Canopy structured Amazon reviews API is configured."
      : hasApify
        ? "Apify fallback is configured, but Amazon review-page restrictions can return empty datasets. Add CANOPY_API_KEY for preferred live collection."
        : "Add CANOPY_API_KEY for live Amazon review collection."
  })

  checks.push({
    label: "Site URL",
    status: clean(process.env.NEXT_PUBLIC_SITE_URL)?.startsWith("https://") ? "ready" : "warning",
    detail: clean(process.env.NEXT_PUBLIC_SITE_URL)?.startsWith("https://") ? "Public HTTPS site URL is configured." : "Use localhost for testing; set HTTPS production URL before launch."
  })

  return checks
}

function clean(value: string | undefined) {
  return value?.trim().replace(/^["']|["']$/g, "")
}
