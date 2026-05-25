import assert from "node:assert/strict"
import { canonicalAmazonProductUrl, fetchAmazonReviews } from "../lib/ai/service"

async function main() {
  const originalFetch = globalThis.fetch
  const originalKey = process.env.CANOPY_API_KEY
  const originalLimit = process.env.CANOPY_REVIEW_PAGE_LIMIT
  const originalSerpApiKey = process.env.SERPAPI_API_KEY
  const originalYepApiKey = process.env.YEPAPI_API_KEY
  const originalJudgeMeToken = process.env.JUDGEME_API_TOKEN
  const originalJudgeMeShop = process.env.JUDGEME_SHOP_DOMAIN
  const requestsMade: string[] = []
  await assertDefaultPageLimit()
  await assertRequestedPageLimit()
  await assertSerpApiFallbackWhenCanopyQuotaFails()
  await assertJudgeMeConnector()

  process.env.CANOPY_API_KEY = "test-key"
  process.env.CANOPY_REVIEW_PAGE_LIMIT = "3"
  process.env.SERPAPI_API_KEY = "serpapi-key"
  process.env.YEPAPI_API_KEY = "yepapi-key"
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input))
    if (url.pathname === "/api/amazon/product" && !url.pathname.endsWith("/reviews") && !url.searchParams.has("page")) {
      return new Response(JSON.stringify({
        title: "Cordless Massage Gun - Product Details",
        reviewCount: 12446
      }), { status: 200, headers: { "content-type": "application/json" } })
    }
    if (url.hostname === "serpapi.com") {
      return new Response(JSON.stringify({
        product_results: { title: "Cordless Massage Gun - SerpApi" },
        reviews_information: {
          authors_reviews: [
            { title: "Helpful", text: "SerpApi fallback review text about quiet operation and strong power." },
            { snippet: "SerpApi second fallback review mentions battery life and attachments." }
          ]
        }
      }), { status: 200, headers: { "content-type": "application/json" } })
    }
    if (url.hostname === "api.yepapi.com") {
      const body = JSON.parse(String(init?.body ?? "{}"))
      const page = typeof body.page === "number" ? body.page : 1
      return new Response(JSON.stringify({
        ok: true,
        data: {
          status: "OK",
          data: {
            total_ratings: 12446,
            reviews: Array.from({ length: 7 }, (_, index) => ({
              review_title: `YepAPI review ${page}-${index}`,
              review_text: `YepAPI detailed review ${page}-${index} with specific customer language about durability, setup, and product expectations.`,
              review_star_rating: String((index % 5) + 1)
            }))
          }
        }
      }), { status: 200, headers: { "content-type": "application/json" } })
    }
    const page = Number(url.searchParams.get("page"))
    const rating = String(url.searchParams.get("rating"))
    requestsMade.push(`${rating}:${page}`)
    const bodies = rating === "ALL"
      ? page === 1
        ? ["First useful review body about battery performance.", "Duplicate review body about product size."]
        : page === 2
          ? ["Duplicate review body about product size.", "Second page review body about attachment safety."]
          : []
      : [`${rating} review body ${page} with distinct customer language about the product.`]
    return new Response(JSON.stringify({
      data: {
        amazonProduct: {
          title: "Cordless Massage Gun",
          reviewsPaginated: {
            reviews: bodies.map((body) => ({ body })),
            pageInfo: { currentPage: page, totalPages: 3, totalResults: 42, hasNextPage: false }
          }
        }
      }
    }), { status: 200, headers: { "content-type": "application/json" } })
  }

  try {
    const result = await fetchAmazonReviews({
      productUrl: "https://www.amazon.ca/Massage-Tissue-Percussion-Muscle-Massager/dp/B082Y114TB/ref=tracking",
      platform: "amazon",
      marketplace: "amazon.ca",
      reviewPageLimit: 10
    })

    assert.deepEqual(requestsMade.slice(0, 10), ["ALL:1", "ALL:2", "ALL:3", "ALL:4", "ALL:5", "ALL:6", "ALL:7", "ALL:8", "ALL:9", "ALL:10"])
    assert.equal(result.source, "canopy+serpapi+yepapi")
    assert.equal(result.productName, "Cordless Massage Gun - Product Details")
    assert.ok((result.pagesFetched ?? 0) > 10)
    assert.equal(result.basePagesFetched, 10)
    assert.ok((result.ratingFilterPagesFetched ?? 0) > 0)
    assert.equal(result.availableReviewCount, 42)
    assert.equal(result.marketplaceRatingCount, 12446)
    assert.equal(result.reviews.length, 100)
    assert.equal(result.fallbackReviewsAdded, 2)
    assert.equal(result.yepApiReviewsAdded, 70)
    assert.equal(result.yepApiPagesFetched, 10)
    assert.equal(result.targetReviewCount, 100)
    assert.match(result.sampleNote ?? "", /10 of 10 requested base pages/)
    assert.match(result.sampleNote ?? "", /star-filter page/)
    assert.equal(canonicalAmazonProductUrl("https://www.amazon.ca/example/dp/B082Y114TB/ref=tracking"), "https://www.amazon.ca/dp/B082Y114TB")
  } finally {
    globalThis.fetch = originalFetch
    if (originalKey === undefined) delete process.env.CANOPY_API_KEY
    else process.env.CANOPY_API_KEY = originalKey
    if (originalLimit === undefined) delete process.env.CANOPY_REVIEW_PAGE_LIMIT
    else process.env.CANOPY_REVIEW_PAGE_LIMIT = originalLimit
    if (originalSerpApiKey === undefined) delete process.env.SERPAPI_API_KEY
    else process.env.SERPAPI_API_KEY = originalSerpApiKey
    if (originalYepApiKey === undefined) delete process.env.YEPAPI_API_KEY
    else process.env.YEPAPI_API_KEY = originalYepApiKey
    if (originalJudgeMeToken === undefined) delete process.env.JUDGEME_API_TOKEN
    else process.env.JUDGEME_API_TOKEN = originalJudgeMeToken
    if (originalJudgeMeShop === undefined) delete process.env.JUDGEME_SHOP_DOMAIN
    else process.env.JUDGEME_SHOP_DOMAIN = originalJudgeMeShop
  }

  console.log("Review connector tests passed for Canopy pagination, Judge.me, metadata, deduplication, and canonical URLs.")
}

async function assertJudgeMeConnector() {
  delete process.env.CANOPY_API_KEY
  process.env.JUDGEME_API_TOKEN = "judge-token"
  process.env.JUDGEME_SHOP_DOMAIN = "demo.myshopify.com"
  const requestedUrls: string[] = []
  globalThis.fetch = async (input) => {
    const url = new URL(String(input))
    requestedUrls.push(url.toString())
    if (url.pathname === "/products/glow-serum.js") {
      return new Response(JSON.stringify({ product: { id: 987654321, title: "Glow Serum" } }), { status: 200, headers: { "content-type": "application/json" } })
    }
    if (url.pathname.includes("/products/-1")) {
      assert.equal(url.searchParams.get("external_id"), "987654321")
      return new Response(JSON.stringify({ product: { id: 321, title: "Glow Serum" } }), { status: 200, headers: { "content-type": "application/json" } })
    }
    if (url.pathname.includes("/reviews")) {
      assert.equal(url.searchParams.get("product_id"), "321")
      assert.equal(url.searchParams.get("per_page"), "100")
      return new Response(JSON.stringify({
        reviews: [
          { title: "Love it", body: "This serum feels light and absorbs quickly with no sticky finish.", rating: 5 },
          { title: "Pump issue", body: "The formula is good but the pump stopped working after a few uses.", rating: 3 }
        ],
        count: 2
      }), { status: 200, headers: { "content-type": "application/json" } })
    }
    return new Response("not found", { status: 404 })
  }

  const result = await fetchAmazonReviews({
    productUrl: "https://demo.com/products/glow-serum",
    platform: "shopify",
    marketplace: "Shopify / DTC store",
    reviewApp: "judgeme",
    reviewPageLimit: 5
  })
  assert.equal(result.source, "judgeme")
  assert.equal(result.productName, "Glow Serum")
  assert.equal(result.pagesFetched, 1)
  assert.equal(result.availableReviewCount, 2)
  assert.equal(result.reviews.length, 2)
  assert.equal(requestedUrls.length, 3)
}

async function assertSerpApiFallbackWhenCanopyQuotaFails() {
  process.env.CANOPY_API_KEY = "test-key"
  process.env.SERPAPI_API_KEY = "serpapi-key"
  delete process.env.YEPAPI_API_KEY
  globalThis.fetch = async (input) => {
    const url = new URL(String(input))
    if (url.hostname === "rest.canopyapi.co") return new Response(JSON.stringify({ error: "quota exceeded" }), { status: 402 })
    if (url.hostname === "serpapi.com") {
      return new Response(JSON.stringify({
        product_results: { title: "Fallback Balloons", reviewCount: 12456 },
        reviews_information: {
          authors_reviews: [
            { title: "Nice colors", text: "Fallback review text about bright colors and party setup." },
            { title: "Hard to inflate", text: "Fallback review text about inflation difficulty and durability." }
          ]
        }
      }), { status: 200, headers: { "content-type": "application/json" } })
    }
    return new Response("not found", { status: 404 })
  }
  const result = await fetchAmazonReviews({
    productUrl: "https://www.amazon.ca/dp/B0BZCHMVTK",
    platform: "amazon",
    marketplace: "amazon.ca",
    reviewPageLimit: 10
  })
  assert.equal(result.source, "serpapi")
  assert.equal(result.reviews.length, 2)
  assert.equal(result.fallbackReviewsAdded, 2)
  assert.match(result.warning ?? "", /Canopy returned 402/)
}

async function assertRequestedPageLimit() {
  process.env.CANOPY_API_KEY = "test-key"
  process.env.CANOPY_REVIEW_PAGE_LIMIT = "50"
  const requestedPages: string[] = []
  globalThis.fetch = async (input) => {
    const url = new URL(String(input))
    if (!url.searchParams.has("page")) {
      return new Response(JSON.stringify({ title: "Quick Depth Product", reviewCount: 99 }), { status: 200, headers: { "content-type": "application/json" } })
    }
    const page = Number(url.searchParams.get("page"))
    const rating = String(url.searchParams.get("rating"))
    requestedPages.push(`${rating}:${page}`)
    return new Response(JSON.stringify({
      data: {
        amazonProduct: {
          title: "Quick Depth Product",
          reviewsPaginated: {
            reviews: rating === "ALL" ? [{ body: `Quick depth review page ${page} with enough text to count.` }] : [],
            pageInfo: { currentPage: page, hasNextPage: true }
          }
        }
      }
    }), { status: 200, headers: { "content-type": "application/json" } })
  }
  const result = await fetchAmazonReviews({
    productUrl: "https://www.amazon.com/dp/B082Y114TB",
    platform: "amazon",
    marketplace: "amazon.com",
    reviewPageLimit: 5
  })
  assert.equal(result.pagesFetched, 15)
  assert.equal(result.basePagesFetched, 5)
  assert.equal(result.ratingFilterPagesFetched, 10)
  assert.equal(result.targetReviewCount, 25)
  assert.equal(result.reviews.length, 5)
  assert.deepEqual(requestedPages.slice(0, 5), ["ALL:1", "ALL:2", "ALL:3", "ALL:4", "ALL:5"])
}

async function assertDefaultPageLimit() {
  process.env.CANOPY_API_KEY = "test-key"
  delete process.env.CANOPY_REVIEW_PAGE_LIMIT
  const requestedPages: string[] = []
  globalThis.fetch = async (input) => {
    const url = new URL(String(input))
    if (!url.searchParams.has("page")) {
      return new Response(JSON.stringify({ title: "Full Depth Product", reviewCount: 500 }), { status: 200, headers: { "content-type": "application/json" } })
    }
    const page = Number(url.searchParams.get("page"))
    const rating = String(url.searchParams.get("rating"))
    requestedPages.push(`${rating}:${page}`)
    return new Response(JSON.stringify({
      data: {
        amazonProduct: {
          title: "Full Depth Product",
          reviewsPaginated: {
            reviews: rating === "ALL" && page <= 50 ? [{ body: `Review body number ${page} with enough text to count.` }] : [],
            pageInfo: { currentPage: page, hasNextPage: true }
          }
        }
      }
    }), { status: 200, headers: { "content-type": "application/json" } })
  }
  const result = await fetchAmazonReviews({
    productUrl: "https://www.amazon.com/dp/B082Y114TB",
    platform: "amazon",
    marketplace: "amazon.com"
  })
  assert.equal(result.pagesFetched, 150)
  assert.equal(result.basePagesFetched, 50)
  assert.equal(result.ratingFilterPagesFetched, 100)
  assert.equal(result.targetReviewCount, 250)
  assert.equal(result.reviews.length, 50)
  assert.equal(requestedPages[0], "ALL:1")
  assert.equal(requestedPages[49], "ALL:50")
  assert.equal(requestedPages.at(-1), "ONE_STAR:20")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
