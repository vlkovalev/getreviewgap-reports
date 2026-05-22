import { getPaidPlan } from "@/lib/plans"

const PAYPAL_API = {
  sandbox: "https://api-m.sandbox.paypal.com",
  live: "https://api-m.paypal.com"
} as const

function getPayPalConfig() {
  const mode = process.env.PAYPAL_MODE === "live" ? "live" : "sandbox"
  const clientId = cleanEnvSecret(process.env.PAYPAL_CLIENT_ID)
  const clientSecret = cleanEnvSecret(process.env.PAYPAL_CLIENT_SECRET)
  if (!clientId || !clientSecret) throw new Error("PayPal is not configured. Add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.")
  return { baseUrl: PAYPAL_API[mode], clientId, clientSecret, mode }
}

function cleanEnvSecret(value: string | undefined) {
  return value?.trim().replace(/^["']|["']$/g, "")
}

async function getAccessToken() {
  const { baseUrl, clientId, clientSecret, mode } = getPayPalConfig()
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      authorization: `Basic ${credentials}`,
      "content-type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials",
    cache: "no-store"
  })
  if (!response.ok) throw new Error(`PayPal auth failed: ${response.status}. Check that PAYPAL_MODE=${mode} matches the PayPal app credentials you copied.`)
  const data = await response.json() as { access_token: string }
  return data.access_token
}

export async function createPayPalOrder(planId: string) {
  const plan = getPaidPlan(planId)
  if (!plan) throw new Error("Unknown plan.")
  const token = await getAccessToken()
  const { baseUrl } = getPayPalConfig()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

  const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "paypal-request-id": `reviewintel-${plan.id}-${crypto.randomUUID()}`
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: plan.id,
          description: `${plan.name} - ReviewIntel Reports credits`,
          custom_id: plan.id,
          amount: {
            currency_code: "USD",
            value: plan.price.toFixed(2)
          }
        }
      ],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: "ReviewIntel Reports",
            landing_page: "LOGIN",
            user_action: "PAY_NOW",
            return_url: `${siteUrl}/checkout/paypal/success?plan=${plan.id}`,
            cancel_url: `${siteUrl}/checkout/paypal/cancel?plan=${plan.id}`
          }
        }
      }
    }),
    cache: "no-store"
  })
  if (!response.ok) throw new Error(`PayPal order creation failed: ${response.status}`)
  return response.json() as Promise<{ id: string; status: string; links?: Array<{ href: string; rel: string; method: string }> }>
}

export async function capturePayPalOrder(orderId: string) {
  const token = await getAccessToken()
  const { baseUrl } = getPayPalConfig()
  const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "paypal-request-id": `reviewintel-capture-${orderId}`
    },
    cache: "no-store"
  })
  if (!response.ok) throw new Error(`PayPal capture failed: ${response.status}`)
  return response.json() as Promise<{
    id: string
    status: string
    payer?: { email_address?: string }
    purchase_units?: Array<{ reference_id?: string; payments?: { captures?: Array<{ id: string; status: string; amount?: { value: string; currency_code: string } }> } }>
  }>
}
