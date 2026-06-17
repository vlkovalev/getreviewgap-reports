import { NextRequest, NextResponse } from "next/server"
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-session"

export async function POST(request: NextRequest) {
  const host = request.headers.get("host") || "127.0.0.1:3000"
  const protocol = request.headers.get("x-forwarded-proto") || "http"
  const response = NextResponse.redirect(`${protocol}://${host}/admin/login`)
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/"
  })
  return response
}
