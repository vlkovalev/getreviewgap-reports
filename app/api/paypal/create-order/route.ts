import { NextResponse } from "next/server"
import { z } from "zod"
import { createPayPalOrder } from "@/lib/paypal"
import { getCurrentCustomer } from "@/lib/customer-session"

const schema = z.object({ planId: z.enum(["one_report", "five_pack", "twenty_pack", "micro", "starter", "growth"]) })

export async function POST(request: Request) {
  try {
    const customer = await getCurrentCustomer()
    if (!customer) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 })
    }
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: "Choose a valid plan." }, { status: 400 })
    const order = await createPayPalOrder(parsed.data.planId, customer.id)
    const approvalUrl = order.links?.find((link) => link.rel === "payer-action" || link.rel === "approve")?.href
    if (!approvalUrl) return NextResponse.json({ error: "PayPal did not return an approval link." }, { status: 502 })
    return NextResponse.json({ orderId: order.id, approvalUrl })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not start PayPal checkout." }, { status: 500 })
  }
}
