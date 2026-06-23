import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { resetPasswordWithToken } from "@/lib/password-reset"
import { isRateLimited } from "@/lib/rate-limit"

const schema = z.object({
  token: z.string().trim().min(20).max(300),
  password: z.string().min(6).max(200),
  confirmPassword: z.string().min(6).max(200)
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"]
})

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "local"
  if (isRateLimited(`reset-password:${ip}`, 8, 10 * 60_000)) {
    return NextResponse.redirect(new URL("/reset-password?error=rate", request.url))
  }

  const form = await request.formData()
  const parsed = schema.safeParse({
    token: form.get("token"),
    password: form.get("password"),
    confirmPassword: form.get("confirmPassword")
  })
  if (!parsed.success) {
    const token = String(form.get("token") || "")
    return NextResponse.redirect(new URL(`/reset-password?token=${encodeURIComponent(token)}&error=invalid`, request.url))
  }

  const ok = await resetPasswordWithToken(parsed.data.token, parsed.data.password)
  if (!ok) {
    return NextResponse.redirect(new URL("/reset-password?error=expired", request.url))
  }

  return NextResponse.redirect(new URL("/login?reset=1", request.url))
}
