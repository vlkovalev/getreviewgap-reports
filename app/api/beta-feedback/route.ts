import { NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentCustomer } from "@/lib/customer-session"
import { getDb, hasRealDatabaseUrl } from "@/lib/db"
import { isRateLimited } from "@/lib/rate-limit"
import { trackServerEvent } from "@/lib/analytics"

const feedbackSchema = z.object({
  reportId: z.string().trim().min(1).max(120),
  rating: z.coerce.number().int().min(1).max(5),
  usefulness: z.string().trim().max(1200).optional().or(z.literal("")),
  confusing: z.string().trim().max(1200).optional().or(z.literal("")),
  missing: z.string().trim().max(1200).optional().or(z.literal(""))
})

export async function POST(request: Request) {
  const customer = await getCurrentCustomer()
  if (!customer) return NextResponse.json({ error: "Sign in to send beta feedback." }, { status: 401 })
  if (isRateLimited(`beta-feedback:${customer.id}`)) {
    return NextResponse.json({ error: "Too many feedback submissions. Please try again soon." }, { status: 429 })
  }

  const parsed = feedbackSchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json({ error: "Please choose a rating and keep feedback under the character limit." }, { status: 400 })
  }

  if (hasRealDatabaseUrl()) {
    await getDb().auditEvent.create({
      data: {
        actorId: customer.id,
        action: "beta_feedback_submitted",
        entity: "intelligence_report",
        entityId: parsed.data.reportId,
        metadata: {
          rating: parsed.data.rating,
          usefulness: parsed.data.usefulness || "",
          confusing: parsed.data.confusing || "",
          missing: parsed.data.missing || ""
        }
      }
    })
  }

  await trackServerEvent({
    name: "beta_feedback_submitted",
    properties: {
      reportId: parsed.data.reportId,
      rating: parsed.data.rating
    }
  })

  return NextResponse.json({ ok: true })
}
