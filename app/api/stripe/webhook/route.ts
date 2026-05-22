import { createHmac, timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"
import { getDb, hasRealDatabaseUrl } from "@/lib/db"
import { addCreditsOnce, findCustomerById } from "@/lib/customer-store"
import { getPaidPlan, getPlanCredits } from "@/lib/plans"

type StripeCheckoutSessionCompleted = {
  id: string
  amount_total?: number | null
  currency?: string | null
  customer_email?: string | null
  client_reference_id?: string | null
  metadata?: {
    plan_id?: string
    customer_id?: string
  } | null
}

type StripeEvent = {
  id: string
  type: string
  data?: {
    object?: unknown
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.text()
    const signature = request.headers.get("stripe-signature")
    const webhookSecret = cleanEnvSecret(process.env.STRIPE_WEBHOOK_SECRET)

    if (!webhookSecret) {
      return NextResponse.json({ error: "Stripe webhook secret is not configured." }, { status: 500 })
    }
    if (!signature || !verifyStripeSignature(payload, signature, webhookSecret)) {
      return NextResponse.json({ error: "Invalid Stripe webhook signature." }, { status: 400 })
    }

    const event = JSON.parse(payload) as StripeEvent
    if (event.type === "checkout.session.completed") {
      await handleCheckoutSessionCompleted(event.data?.object as StripeCheckoutSessionCompleted)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Stripe webhook failed." }, { status: 500 })
  }
}

async function handleCheckoutSessionCompleted(session: StripeCheckoutSessionCompleted | undefined) {
  if (!session?.id) return
  const plan = getPaidPlan(session.metadata?.plan_id)
  const customerId = session.metadata?.customer_id ?? session.client_reference_id ?? undefined
  if (!plan || !customerId) return

  const customer = await findCustomerById(customerId)
  if (!customer) return

  const credits = getPlanCredits(plan.id)
  await addCreditsOnce(customer.id, credits, "stripe_webhook", session.id)

  if (hasRealDatabaseUrl()) {
    const db = getDb()
    const existingPurchase = await db.customerPurchase.findFirst({ where: { provider: "stripe", providerId: session.id } })
    if (!existingPurchase) {
      await db.customerPurchase.create({
        data: {
          customerId: customer.id,
          provider: "stripe",
          providerId: session.id,
          planId: plan.id,
          amount: session.amount_total ?? plan.price * 100,
          currency: session.currency ?? "usd",
          status: "completed",
          credits,
          raw: session
        }
      })
    }
  }
}

function verifyStripeSignature(payload: string, signature: string, secret: string) {
  const parts = Object.fromEntries(signature.split(",").map((part) => {
    const [key, value] = part.split("=")
    return [key, value]
  }))
  const timestamp = parts.t
  const receivedSignature = parts.v1
  if (!timestamp || !receivedSignature) return false

  const ageSeconds = Math.abs(Date.now() / 1000 - Number(timestamp))
  if (!Number.isFinite(ageSeconds) || ageSeconds > 300) return false

  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex")
  return safeCompare(expected, receivedSignature)
}

function safeCompare(expected: string, received: string) {
  const expectedBuffer = Buffer.from(expected)
  const receivedBuffer = Buffer.from(received)
  if (expectedBuffer.length !== receivedBuffer.length) return false
  return timingSafeEqual(expectedBuffer, receivedBuffer)
}

function cleanEnvSecret(value: string | undefined) {
  return value?.trim().replace(/^["']|["']$/g, "")
}
