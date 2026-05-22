import { NextResponse } from "next/server"
import { z } from "zod"
import { createStripeCheckoutSession } from "@/lib/stripe"
import { getCurrentCustomer } from "@/lib/customer-session"

const schema = z.object({ planId: z.enum(["one_report", "five_pack", "twenty_pack", "micro", "starter", "growth"]) })

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: "Choose a valid plan." }, { status: 400 })
    const customer = await getCurrentCustomer()
    const session = await createStripeCheckoutSession(parsed.data.planId, customer?.id)
    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not start card checkout." }, { status: 500 })
  }
}
