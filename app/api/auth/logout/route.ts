import { NextRequest, NextResponse } from "next/server"
import { CUSTOMER_COOKIE } from "@/lib/customer-session"

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/", request.url))
  response.cookies.set(CUSTOMER_COOKIE, "", { maxAge: 0, path: "/" })
  return response
}
