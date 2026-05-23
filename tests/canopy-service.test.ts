import assert from "node:assert/strict"
import { canonicalAmazonProductUrl, fetchAmazonReviews } from "../lib/ai/service"

async function main() {
  const originalFetch = globalThis.fetch
  const originalKey = process.env.CANOPY_API_KEY
  const originalLimit = process.env.CANOPY_REVIEW_PAGE_LIMIT
  const pagesRequested: number[] = []

  process.env.CANOPY_API_KEY = "test-key"
  process.env.CANOPY_REVIEW_PAGE_LIMIT = "3"
  globalThis.fetch = async (input) => {
    const url = new URL(String(input))
    const page = Number(url.searchParams.get("page"))
    pagesRequested.push(page)
    const bodies = page === 1
      ? ["First useful review body about battery performance.", "Duplicate review body about product size."]
      : ["Duplicate review body about product size.", "Second page review body about attachment safety."]
    return new Response(JSON.stringify({
      data: {
        amazonProduct: {
          title: "Cordless Massage Gun",
          reviewsPaginated: {
            reviews: bodies.map((body) => ({ body })),
            pageInfo: { currentPage: page, totalPages: 2, totalResults: 42, hasNextPage: page === 1 }
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

    assert.deepEqual(pagesRequested, [1, 2])
    assert.equal(result.source, "canopy")
    assert.equal(result.productName, "Cordless Massage Gun")
    assert.equal(result.pagesFetched, 2)
    assert.equal(result.availableReviewCount, 42)
    assert.equal(result.reviews.length, 3)
    assert.match(result.sampleNote ?? "", /3 of 42 available reviews/)
    assert.equal(canonicalAmazonProductUrl("https://www.amazon.ca/example/dp/B082Y114TB/ref=tracking"), "https://www.amazon.ca/dp/B082Y114TB")
  } finally {
    globalThis.fetch = originalFetch
    if (originalKey === undefined) delete process.env.CANOPY_API_KEY
    else process.env.CANOPY_API_KEY = originalKey
    if (originalLimit === undefined) delete process.env.CANOPY_REVIEW_PAGE_LIMIT
    else process.env.CANOPY_REVIEW_PAGE_LIMIT = originalLimit
  }

  console.log("Canopy service tests passed for pagination, metadata, deduplication, and canonical URLs.")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
