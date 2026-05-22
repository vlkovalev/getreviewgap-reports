import { getPaidPlan, isMonthlyPlan } from "@/lib/plans"

export async function createStripeCheckoutSession(planId: string, customerId?: string) {
  const plan = getPaidPlan(planId)
  if (!plan) throw new Error("Unknown plan.")
  const secretKey = cleanEnvSecret(process.env.STRIPE_SECRET_KEY)
  if (!secretKey) throw new Error("Stripe is not configured. Add STRIPE_SECRET_KEY.")
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  const params = new URLSearchParams()

  params.set("mode", isMonthlyPlan(plan.id) ? "subscription" : "payment")
  params.set("success_url", `${siteUrl}/checkout/card/success?plan=${plan.id}&session_id={CHECKOUT_SESSION_ID}`)
  params.set("cancel_url", `${siteUrl}/checkout/card/cancel?plan=${plan.id}`)
  params.set("allow_promotion_codes", "true")
  params.set("metadata[plan_id]", plan.id)
  if (customerId) {
    params.set("client_reference_id", customerId)
    params.set("metadata[customer_id]", customerId)
  }
  params.set("line_items[0][quantity]", "1")
  params.set("line_items[0][price_data][currency]", "usd")
  params.set("line_items[0][price_data][unit_amount]", String(plan.price * 100))
  params.set("line_items[0][price_data][product_data][name]", `ReviewGap ${plan.name}`)
  if (isMonthlyPlan(plan.id)) {
    params.set("line_items[0][price_data][recurring][interval]", "month")
    params.set("subscription_data[metadata][plan_id]", plan.id)
    if (customerId) params.set("subscription_data[metadata][customer_id]", customerId)
  } else if (customerId) {
    params.set("payment_intent_data[metadata][plan_id]", plan.id)
    params.set("payment_intent_data[metadata][customer_id]", customerId)
  }

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${secretKey}`,
      "content-type": "application/x-www-form-urlencoded"
    },
    body: params,
    cache: "no-store"
  })
  const data = await response.json() as { id?: string; url?: string; error?: { message?: string } }
  if (!response.ok || !data.url) throw new Error(data.error?.message ?? `Stripe checkout failed: ${response.status}`)
  return data
}

function cleanEnvSecret(value: string | undefined) {
  return value?.trim().replace(/^["']|["']$/g, "")
}
