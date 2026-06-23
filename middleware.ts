import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifySession } from "./lib/session-crypto"

const CUSTOMER_COOKIE = "reviewgap_customer"

function siteGatePasses(request: NextRequest): boolean {
  const user = process.env.SITE_GATE_USER
  const password = process.env.SITE_GATE_PASSWORD
  if (!user || !password) return true // gate is off until both env vars are set

  const header = request.headers.get("authorization")
  if (!header?.startsWith("Basic ")) return false
  let decoded: string
  try {
    decoded = atob(header.slice(6))
  } catch {
    return false
  }
  const separatorIndex = decoded.indexOf(":")
  if (separatorIndex === -1) return false
  return decoded.slice(0, separatorIndex) === user && decoded.slice(separatorIndex + 1) === password
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Exempt Stripe webhooks
  if (pathname === "/api/stripe/webhook") {
    return NextResponse.next()
  }

  // Site-wide gate for private beta. No-op until SITE_GATE_USER/SITE_GATE_PASSWORD are set.
  // The homepage stays public so visitors don't hit a Basic Auth prompt before signing up.
  if (pathname !== "/" && !siteGatePasses(request)) {
    return new NextResponse("Authentication required.", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="ReviewGap private beta"' }
    })
  }

  // Determine if path is protected
  const isDashboard = pathname.startsWith("/dashboard")
  const isScraperApi = pathname.startsWith("/api/scraper")
  const isStripeApi = pathname.startsWith("/api/stripe")
  const isChangePasswordApi = pathname.startsWith("/api/auth/change-password")

  if (isDashboard || isScraperApi || isStripeApi || isChangePasswordApi) {
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
