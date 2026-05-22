import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { capturePayPalOrder } from "@/lib/paypal"
import { getPaidPlan, getPlanCredits } from "@/lib/plans"
import { addCreditsOnce } from "@/lib/customer-store"
import { getCurrentCustomer } from "@/lib/customer-session"

export async function POST(request: Request) {
  try {
    const body = await request.json() as { orderId?: string; planId?: string }
    if (!body.orderId) return NextResponse.json({ error: "Missing PayPal order ID." }, { status: 400 })
    const capture = await capturePayPalOrder(body.orderId)
    const planId = body.planId || capture.purchase_units?.[0]?.reference_id
    const plan = getPaidPlan(planId)
    const customer = await getCurrentCustomer()
    if (customer && plan) {
      const credits = getPlanCredits(plan.id)
      await addCreditsOnce(customer.id, credits, "paypal_checkout", capture.id)
      const existingPurchase = await getDb().customerPurchase.findFirst({ where: { provider: "paypal", providerId: capture.id } }).catch(() => null)
      if (!existingPurchase) await getDb().customerPurchase.create({
        data: {
          customerId: customer.id,
          provider: "paypal",
          providerId: capture.id,
          planId: plan.id,
          amount: plan.price * 100,
          currency: "usd",
          status: capture.status,
          credits,
          raw: capture
        }
      }).catch(() => null)
    }

    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("USER:PASSWORD") && plan) {
      const db = getDb()
      await db.purchase.create({
        data: {
          email: capture.payer?.email_address ?? "paypal-buyer@example.com",
          amount: plan.price * 100,
          currency: "usd",
          status: capture.status,
          stripeId: capture.id
        }
      })
    }

    return NextResponse.json({ capture, plan })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not capture PayPal order." }, { status: 500 })
  }
}
