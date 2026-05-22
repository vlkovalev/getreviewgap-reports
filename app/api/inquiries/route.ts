import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { inquiryConfirmationHtml, sendEmail } from "@/lib/email"
import { isRateLimited } from "@/lib/rate-limit"
import { inquirySchema } from "@/lib/validators"

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "local"
    if (isRateLimited(`inquiry:${ip}`)) {
      return NextResponse.json({ message: "Too many submissions. Please try again soon." }, { status: 429 })
    }

    const form = await request.formData()
    const raw = Object.fromEntries(form) as Record<string, FormDataEntryValue | boolean>
    raw.consent = raw.consent === "true"
    const parsed = inquirySchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ message: "Please check the form fields and consent checkbox." }, { status: 400 })
    }
    if (parsed.data.website) {
      return NextResponse.json({ message: "Thanks." })
    }

    const db = getDb()
    const inquiry = await db.inquiry.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        company: parsed.data.company || null,
        serviceInterest: parsed.data.serviceInterest,
        budgetRange: parsed.data.budgetRange || null,
        message: parsed.data.message,
        consent: parsed.data.consent
      }
    })

    await sendEmail({
      to: inquiry.email,
      subject: "We received your AI Presentation Lab inquiry",
      html: inquiryConfirmationHtml(inquiry.name)
    })

    if (process.env.OWNER_EMAIL) {
      await sendEmail({
        to: process.env.OWNER_EMAIL,
        subject: "New inquiry: AI Presentation Lab",
        html: `<p>${inquiry.name} (${inquiry.email}) asked about ${inquiry.serviceInterest}.</p><p>${inquiry.message}</p>`
      })
    }

    return NextResponse.json({ message: "Inquiry received. We will reply soon." })
  } catch {
    return NextResponse.json({ message: "Something went wrong. Please try again." }, { status: 500 })
  }
}
