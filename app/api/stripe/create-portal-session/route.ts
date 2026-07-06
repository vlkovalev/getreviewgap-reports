import { NextResponse } from "next/server"
import { createStripeBillingPortalSession } from "@/lib/stripe"
import { getCurrentCustomer } from "@/lib/customer-session"

export async function POST() {
  try {
    const customer = await getCurrentCustomer()
    if (!customer) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 })
    }
    if (!customer.stripeCustomerId) {
      return NextResponse.json({ error: "No subscription found for this account yet." }, { status: 400 })
    }
    const session = await createStripeBillingPortalSession(customer.stripeCustomerId)
    return NextResponse.json({ url: session.url })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not open the billing portal." }, { status: 500 })
  }
}
