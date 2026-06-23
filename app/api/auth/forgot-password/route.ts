import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createPasswordResetToken } from "@/lib/password-reset"
import { passwordResetHtml, sendEmail } from "@/lib/email"
import { isRateLimited } from "@/lib/rate-limit"

const schema = z.object({
  email: z.string().trim().email().max(120)
})

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "local"
  if (isRateLimited(`forgot-password:${ip}`, 5, 10 * 60_000)) {
    return NextResponse.redirect(new URL("/forgot-password?sent=1", request.url))
  }

  const form = await request.formData()
  const parsed = schema.safeParse({ email: form.get("email") })
  if (parsed.success) {
    const token = await createPasswordResetToken(parsed.data.email)
    if (token) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin
      const resetUrl = `${siteUrl}/reset-password?token=${encodeURIComponent(token)}`
      await sendEmail({
        to: parsed.data.email,
        subject: "Reset your ReviewGap password",
        html: passwordResetHtml(resetUrl)
      }).catch((error) => {
        console.error("Password reset email failed", error)
      })
    }
  }

  return NextResponse.redirect(new URL("/forgot-password?sent=1", request.url))
}
