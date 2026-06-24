import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifySession } from "./lib/session-crypto"

const CUSTOMER_COOKIE = "reviewgap_customer"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Exempt Stripe webhooks
  if (pathname === "/api/stripe/webhook") {
    return NextResponse.next()
  }

  // Determine if path is protected
  const isDashboard = pathname.startsWith("/dashboard")
  const isScraperApi = pathname.startsWith("/api/scraper")
  const isStripeApi = pathname.startsWith("/api/stripe")
  const isChangePasswordApi = pathname.startsWith("/api/auth/change-password")
  const isGated = isDashboard || isScraperApi || isStripeApi || isChangePasswordApi

  if (isGated) {
    const token = request.cookies.get(CUSTOMER_COOKIE)?.value
    const customerId = await verifySession(token)

    if (!customerId) {
      if (isDashboard) {
        // Redirect dashboard pages to login
        const loginUrl = new URL("/login", request.url)
        loginUrl.searchParams.set("redirectTo", pathname)
        return NextResponse.redirect(loginUrl)
      } else {
        // Return 401 Unauthorized for API requests
        return new NextResponse(
          JSON.stringify({ error: "Authentication required." }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        )
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/stripe/webhook).*)",
  ],
}
