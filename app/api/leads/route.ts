import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { leadConfirmationHtml, sendEmail } from "@/lib/email"
import { isRateLimited } from "@/lib/rate-limit"
import { leadSchema } from "@/lib/validators"

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "local"
    if (isRateLimited(`lead:${ip}`)) {
      return NextResponse.json({ message: "Too many submissions. Please try again soon." }, { status: 429 })
    }

    const form = await request.formData()
    const parsed = leadSchema.safeParse(Object.fromEntries(form))
    if (!parsed.success) {
      return NextResponse.json({ message: "Please check the form fields." }, { status: 400 })
    }
    if (parsed.data.website) {
      return NextResponse.json({ message: "Thanks." })
    }

    const db = getDb()
    const lead = await db.lead.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
        company: parsed.data.company || null,
        message: parsed.data.message || null,
        source: parsed.data.source || "lead-magnet"
      }
    })

    await sendEmail({
      to: lead.email,
      subject: "Your ReviewIntel sample report request",
      html: leadConfirmationHtml(lead.name)
    })

    if (process.env.OWNER_EMAIL) {
      await sendEmail({
        to: process.env.OWNER_EMAIL,
        subject: "New lead: ReviewIntel Reports",
        html: `<p>${lead.name} (${lead.email}) requested the sample report.</p>`
      })
    }

    return NextResponse.json({ message: "Success. Check your inbox for next steps." })
  } catch {
    return NextResponse.json({ message: "Something went wrong. Please try again." }, { status: 500 })
  }
}
