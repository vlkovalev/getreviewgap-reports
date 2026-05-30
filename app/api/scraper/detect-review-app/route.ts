import { NextResponse } from "next/server"

// Signals used to detect which review app a Shopify store uses.
// Ordered by specificity — first match wins.
const SIGNALS: Array<{ app: string; patterns: RegExp[] }> = [
  {
    app: "judgeme",
    patterns: [/judge\.me/i, /jdgm-/i, /cdn\.judge\.me/i]
  },
  {
    app: "stamped",
    patterns: [/stamped\.io/i, /cdn\.stamped\.io/i, /data-apikey=["'][^"']*["']/i]
  },
  {
    app: "loox",
    patterns: [/loox\.io/i, /cdn\.loox\.io/i, /looxReviews/i]
  },
  {
    app: "yotpo",
    patterns: [/yotpo\.com/i, /staticw2\.yotpo\.com/i, /yotpoWidgetsContainer/i]
  },
  {
    app: "okendo",
    patterns: [/okendo\.io/i, /d3hw6dc1ow8pp2\.cloudfront\.net/i, /okendo-reviews/i]
  },
  {
    app: "shopify-product-reviews",
    patterns: [/shopify-product-reviews/i, /spr-container/i]
  }
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get("url")

  if (!url) {
    return NextResponse.json({ error: "url parameter required" }, { status: 400 })
  }

  try {
    new URL(url) // validate
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      cache: "no-store",
      signal: AbortSignal.timeout(8000)
    })

    if (!response.ok) {
      return NextResponse.json({ app: null, reason: `Page returned ${response.status}` })
    }

    const html = await response.text()

    for (const { app, patterns } of SIGNALS) {
      if (patterns.some((pattern) => pattern.test(html))) {
        return NextResponse.json({ app })
      }
    }

    return NextResponse.json({ app: null, reason: "No known review app detected" })
  } catch (error: any) {
    return NextResponse.json({ app: null, reason: error?.message ?? "Fetch failed" })
  }
}
