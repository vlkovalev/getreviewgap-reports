import { NextRequest, NextResponse } from "next/server"
import { CUSTOMER_COOKIE } from "@/lib/customer-session"
import { createCustomer, validateCustomerPassword } from "@/lib/customer-store"

export async function POST(request: NextRequest) {
  const form = await request.formData()
  const mode = String(form.get("mode") || "login")
  const email = String(form.get("email") || "").trim().toLowerCase()
  const password = String(form.get("password") || "")
  const redirectTo = String(form.get("redirectTo") || (mode === "signup" ? "/signup?created=1" : "/login?signedIn=1"))

  if (!email || password.length < 6) {
    return NextResponse.redirect(new URL("/login?error=invalid", request.url))
  }

  const customer = mode === "signup" ? await createCustomer(email, password) : await validateCustomerPassword(email, password)
  if (!customer) {
    return NextResponse.redirect(new URL("/login?error=credentials", request.url))
  }

  const host = request.headers.get("host") || "127.0.0.1:3000"
  const protocol = request.headers.get("x-forwarded-proto") || "http"
  const response = NextResponse.redirect(`${protocol}://${host}${redirectTo}`)
  response.cookies.set(CUSTOMER_COOKIE, customer.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/"
  })
  return response
}
