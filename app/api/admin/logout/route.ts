import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const host = request.headers.get("host") || "127.0.0.1:3000"
  const protocol = request.headers.get("x-forwarded-proto") || "http"
  const response = NextResponse.redirect(`${protocol}://${host}/admin/login`)
  response.cookies.set("admin_session", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/"
  })
  return response
}
