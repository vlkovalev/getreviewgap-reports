import assert from "node:assert/strict"
import { scoreReportInputQuality } from "../lib/report-input-quality"

async function main() {
  console.log("Starting report input quality tests...")

  const missing = scoreReportInputQuality({ reportType: "REVIEW_RATING", platform: "amazon" })
  assert.equal(missing.creditSafe, false, "Missing URL/text should not be credit safe")
  assert.equal(missing.level, "blocked")
  assert.deepEqual(missing.issues, ["missing_source"])

  const thinText = scoreReportInputQuality({
    reportType: "REVIEW_RATING",
    platform: "amazon",
    pastedReviews: "Great product. Loved it."
  })
  assert.equal(thinText.creditSafe, false, "Thin review text should not be credit safe")
  assert.equal(thinText.issues.includes("too_little_review_text"), true)

  const strongText = scoreReportInputQuality({
    reportType: "EXECUTIVE_SUMMARY",
    platform: "shopify",
    pastedReviews: [
      "Review 1: The serum absorbed quickly, smelled clean, and reduced redness after a week of nightly use.",
      "Review 2: Packaging felt premium, shipping was fast, and the dropper made the product easy to dose.",
      "Review 3: I liked the texture and saw brighter skin, though the bottle is smaller than expected.",
      "Review 4: Good value compared with my previous brand, and it layered well under moisturizer.",
      "Review 5: The formula did not irritate sensitive skin and the scent faded quickly after applying.",
      "Review 6: Customer support answered my ingredient question clearly, which made me comfortable reordering.",
      "Review 7: I noticed fewer dry patches, but I would prefer a larger bottle for daily use.",
      "Review 8: The product arrived sealed, the instructions were simple, and the pump worked consistently.",
      "Review 9: My only complaint is the price, but the results were strong enough to justify it.",
      "Review 10: It performed better than the competitor product I used last month and left no sticky residue."
    ].join("\n")
  })
  assert.equal(strongText.creditSafe, true, "Adequate pasted reviews should be credit safe")
  assert.equal(strongText.level, "strong")
  assert.equal(strongText.estimatedReviews, 10)

  const shopifyExportRequired = scoreReportInputQuality({
    reportType: "REVIEW_RATING",
    platform: "shopify",
    productUrl: "https://example.com/products/test",
    reviewApp: "other"
  })
  assert.equal(shopifyExportRequired.creditSafe, false, "Custom Shopify source should require pasted/exported reviews")
  assert.equal(shopifyExportRequired.issues.includes("shopify_export_required"), true)

  const shopifyConnector = scoreReportInputQuality({
    reportType: "REVIEW_RATING",
    platform: "shopify",
    productUrl: "https://example.com/products/test",
    reviewApp: "judgeme"
  })
  assert.equal(shopifyConnector.creditSafe, true, "Known Shopify connector should be allowed through preflight")
  assert.equal(shopifyConnector.level, "warning")
  assert.equal(shopifyConnector.issues.includes("live_connector_beta"), true)

  console.log("Report input quality tests passed successfully.")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
