import type { IntelligenceReport, ReportType } from "@/lib/scrapers/types"

export type SampleReportInput = Omit<IntelligenceReport, "id" | "createdAt" | "updatedAt" | "generatedAt" | "status" | "summary" | "data"> & {
  summary: Record<string, unknown>
  data: Record<string, unknown>
}

export function buildSampleReport(customerId: string): SampleReportInput {
  const productName = "Vitamin C Glow Serum"
  const productUrl = "https://www.amazon.com/dp/sample-reviewgap"
  const insight = {
    executiveSummary: "Sample report: customers like the lightweight texture and visible glow, but repeated complaints mention leaking pumps, size/value mismatch, and uncertainty about sensitive-skin use. The highest-confidence action is to make packaging reliability and value expectations explicit in product copy.",
    topComplaints: [
      {
        theme: "Leaking pump",
        evidence: "Multiple sample reviews mention product leaking in transit or the pump failing after a few uses.",
        severity: "High",
        productImplication: "Call out packaging reliability, show the pump design, and audit fulfillment damage before scaling ads."
      },
      {
        theme: "Smaller than expected",
        evidence: "Customers expected more product for the price and compared the bottle unfavorably with larger alternatives.",
        severity: "Medium",
        productImplication: "Make size, usage duration, and cost-per-use obvious above the fold."
      },
      {
        theme: "Sensitive-skin uncertainty",
        evidence: "Some buyers hesitated because the listing did not clearly explain fragrance, actives, or patch-test guidance.",
        severity: "Medium",
        productImplication: "Add ingredient clarity and sensitive-skin guidance without making unsupported medical claims."
      }
    ],
    topCompliments: [
      {
        theme: "Lightweight texture",
        evidence: "Positive reviews repeatedly describe the serum as light, fast-absorbing, and not sticky.",
        marketingImplication: "Use texture language in ads and product-page bullets."
      },
      {
        theme: "Visible glow",
        evidence: "Buyers describe looking brighter or more refreshed after consistent use.",
        marketingImplication: "Position around daily glow and refreshed-looking skin, while keeping claims evidence-bound."
      }
    ],
    buyerLanguage: [
      "[Outcome] gives my skin a glow without feeling sticky",
      "[Objection] the bottle is smaller than I expected",
      "[Comparison] lighter than my usual vitamin C serum",
      "[Unexpected Use] works well under makeup in the morning"
    ],
    productImprovementIdeas: [
      {
        idea: "Add a packaging reliability proof point",
        whyItMatters: "Pump failures are high-friction complaints because they affect both product use and perceived value.",
        confidence: "High"
      },
      {
        idea: "Add a size and usage-duration visual",
        whyItMatters: "Value objections become less damaging when the buyer understands bottle size and expected usage before purchase.",
        confidence: "Medium"
      }
    ],
    adHooks: [
      "Glow without the sticky serum feel.",
      "A lightweight vitamin C step that sits cleanly under makeup.",
      "Know exactly what is in the bottle before it reaches your bathroom shelf."
    ],
    positioningAngles: [
      "Texture-first vitamin C serum for buyers who hate sticky formulas.",
      "Transparent size/value positioning for cautious first-time buyers.",
      "Packaging reliability as a trust signal against competitor pump complaints."
    ],
    assumptions: [
      "This is a static sample report for product walkthroughs and QA; it is not based on a live scrape.",
      "Use real Amazon products or authorized Shopify exports for business decisions."
    ],
    dataQuality: {
      reviewCount: 42,
      limitations: [
        "Sample data is intentionally synthetic and should be used only to inspect report structure and exports.",
        "Real reports can have different confidence depending on written-review availability."
      ]
    },
    competitiveGap: {
      competitorsAnalyzed: ["Sample competitor serum"],
      primaryWins: ["Light texture", "Visible glow language"],
      primaryLosses: ["Pump reliability", "Size/value clarity"],
      openGaps: ["Packaging proof", "Sensitive-skin clarity", "Cost-per-use framing"]
    },
    emergingSignals: [
      { theme: "Makeup layering", count: 6, firstSeen: "2026-05-12" }
    ]
  }

  const rows = [
    ...insight.topComplaints.map((item) => ({ section: "Top complaint", theme: item.theme, evidence: item.evidence, severity: item.severity, recommendation: item.productImplication })),
    ...insight.topCompliments.map((item) => ({ section: "Top compliment", theme: item.theme, evidence: item.evidence, severity: "", recommendation: item.marketingImplication })),
    ...insight.productImprovementIdeas.map((item) => ({ section: "Product idea", theme: item.idea, evidence: item.whyItMatters, severity: item.confidence, recommendation: item.whyItMatters })),
    ...insight.adHooks.map((hook) => ({ section: "Ad hook", theme: hook, evidence: "", severity: "", recommendation: hook }))
  ]

  return {
    customerId,
    reportType: "REVIEW_RATING" as ReportType,
    title: `Sample Review Intelligence Brief - ${productName}`,
    filters: {
      platform: "amazon",
      productUrl,
      productName,
      competitorName: "Sample competitor",
      reviewPageLimit: 5
    },
    summary: {
      productName,
      productUrl,
      platform: "amazon",
      marketplace: "Amazon sample",
      asin: "SAMPLE",
      competitorName: "Sample competitor",
      source: "sample",
      provider: "static-sample",
      model: "sample",
      reviewCount: 42,
      targetReviewCount: 42,
      marketplaceRatingCount: 1240,
      reviewDepth: "Sample",
      executiveSummary: insight.executiveSummary,
      warning: "This is static sample data for beta walkthroughs. It did not use credits, providers, or AI."
    },
    data: {
      rows,
      insight,
      source: "sample"
    }
  }
}
