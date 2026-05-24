import assert from "node:assert/strict"
import { canonicalAmazonProductUrl, fetchAmazonReviews } from "../lib/ai/service"

async function main() {
  const originalFetch = globalThis.fetch
  const originalKey = process.env.CANOPY_API_KEY
  const originalLimit = process.env.CANOPY_REVIEW_PAGE_LIMIT
  const originalJudgeMeToken = process.env.JUDGEME_API_TOKEN
  const originalJudgeMeShop = process.env.JUDGEME_SHOP_DOMAIN
  const pagesRequested: number[] = []
  await assertDefaultPageLimit()
  await assertRequestedPageLimit()
  await assertJudgeMeConnector()

  process.env.CANOPY_API_KEY = "test-key"
  process.env.CANOPY_REVIEW_PAGE_LIMIT = "3"
  globalThis.fetch = async (input) => {
    const url = new URL(String(input))
    const page = Number(url.searchParams.get("page"))
    pagesRequested.push(page)
    const bodies = page === 1
      ? ["First useful review body about battery performance.", "Duplicate review body about product size."]
      : page === 2
        ? ["Duplicate review body about product size.", "Second page review body about attachment safety."]
        : []
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
      marketplace: "amazon.ca"
    })

    assert.deepEqual(pagesRequested, [1, 2, 3])
    assert.equal(result.source, "canopy")
    assert.equal(result.productName, "Cordless Massage Gun")
    assert.equal(result.pagesFetched, 3)
    assert.equal(result.availableReviewCount, 42)
    assert.equal(result.reviews.length, 3)
    assert.match(result.sampleNote ?? "", /3 unique written review texts from 42 available review records/)
    assert.equal(canonicalAmazonProductUrl("https://www.amazon.ca/example/dp/B082Y114TB/ref=tracking"), "https://www.amazon.ca/dp/B082Y114TB")
  } finally {
    globalThis.fetch = originalFetch
    if (originalKey === undefined) delete process.env.CANOPY_API_KEY
    else process.env.CANOPY_API_KEY = originalKey
    if (originalLimit === undefined) delete process.env.CANOPY_REVIEW_PAGE_LIMIT
    else process.env.CANOPY_REVIEW_PAGE_LIMIT = originalLimit
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

async function assertRequestedPageLimit() {
  process.env.CANOPY_API_KEY = "test-key"
  process.env.CANOPY_REVIEW_PAGE_LIMIT = "50"
  const requestedPages: number[] = []
  globalThis.fetch = async (input) => {
    const page = Number(new URL(String(input)).searchParams.get("page"))
    requestedPages.push(page)
    return new Response(JSON.stringify({
      data: {
        amazonProduct: {
          title: "Quick Depth Product",
          reviewsPaginated: {
            reviews: [{ body: `Quick depth review page ${page} with enough text to count.` }],
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
  assert.equal(result.pagesFetched, 5)
  assert.equal(result.reviews.length, 5)
  assert.deepEqual(requestedPages, [1, 2, 3, 4, 5])
}

async function assertDefaultPageLimit() {
  process.env.CANOPY_API_KEY = "test-key"
  delete process.env.CANOPY_REVIEW_PAGE_LIMIT
  const requestedPages: number[] = []
  globalThis.fetch = async (input) => {
    const page = Number(new URL(String(input)).searchParams.get("page"))
    requestedPages.push(page)
    return new Response(JSON.stringify({
      data: {
        amazonProduct: {
          title: "Full Depth Product",
          reviewsPaginated: {
            reviews: page <= 50 ? [{ body: `Review body number ${page} with enough text to count.` }] : [],
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
  assert.equal(result.pagesFetched, 50)
  assert.equal(result.reviews.length, 50)
  assert.equal(requestedPages.at(-1), 50)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
