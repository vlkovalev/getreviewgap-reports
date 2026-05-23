import assert from "node:assert/strict"
import { canonicalAmazonProductUrl, fetchAmazonReviews } from "../lib/ai/service"

async function main() {
  const originalFetch = globalThis.fetch
  const originalKey = process.env.CANOPY_API_KEY
  const originalLimit = process.env.CANOPY_REVIEW_PAGE_LIMIT
  const pagesRequested: number[] = []
  await assertDefaultPageLimit()

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
  }

  console.log("Canopy service tests passed for pagination, metadata, deduplication, and canonical URLs.")
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
