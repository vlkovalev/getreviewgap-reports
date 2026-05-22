import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const form = await request.formData()
  const email = String(form.get("email") || "")
  const password = String(form.get("password") || "")
  const adminEmail = process.env.ADMIN_EMAIL || (process.env.NODE_ENV !== "production" ? "admin@example.com" : "")
  const adminPassword = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV !== "production" ? "change-this-password" : "")

  if (email === adminEmail && password === adminPassword) {
    const host = request.headers.get("host") || "127.0.0.1:3000"
    const protocol = request.headers.get("x-forwarded-proto") || "http"
    const response = NextResponse.redirect(`${protocol}://${host}/admin`)
    response.cookies.set("admin_session", "ok", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 8,
      path: "/"
    })
    return response
  }

  return NextResponse.redirect(new URL("/admin/login", request.url))
}
