import assert from "node:assert/strict"
import { exportReportCsv, exportReportJson, exportReportPdf, generateReport, listReportTypes, reportRowsForExport } from "../lib/reports/report-engine"
import type { IntelligenceReport, ReportType } from "../lib/scrapers/types"

async function main() {
  process.env.DATABASE_URL = "postgresql://USER:PASSWORD@HOST:5432/DATABASE"

  const requiredTypes: ReportType[] = [
    "PRICE_MONITORING",
    "AVAILABILITY",
    "COMPETITOR_ASSORTMENT",
    "DISCOUNT_PROMOTION",
    "REVIEW_RATING",
    "DATA_QUALITY",
    "EXECUTIVE_SUMMARY"
  ]

  assert.equal(listReportTypes().length, requiredTypes.length)

  for (const type of requiredTypes) {
    const report = await generateReport(type)
    assert.equal(report.status, "COMPLETED")
    assert.equal(report.reportType, type)
    assert.ok(report.summary)
    assert.ok(report.data)
    const rows = reportRowsForExport(report)
    assert.ok(rows.length > 0, `${type} should export at least one row`)
    assert.ok(exportReportCsv(report).includes(",") || rows.length === 1, `${type} should produce CSV`)
    assert.equal(JSON.parse(exportReportJson(report)).reportType, type)
    assert.ok(exportReportPdf(report).toString("utf8", 0, 8).startsWith("%PDF-1."), `${type} should produce PDF`)
  }

  const priceReport = await generateReport("PRICE_MONITORING")
  assert.ok(Array.isArray(priceReport.summary?.biggestDrops))
  assert.ok(reportRowsForExport(priceReport)[0].hasOwnProperty("currentPrice"))

  const qualityReport = await generateReport("DATA_QUALITY")
  assert.ok(Number(qualityReport.summary?.sourceLevelCompletenessScore) >= 0)
  assert.ok(qualityReport.summary?.parseErrors)

  const executiveReport = await generateReport("EXECUTIVE_SUMMARY")
  assert.ok(Number(executiveReport.summary?.totalProductsTracked) > 0)
  assert.ok(Array.isArray(executiveReport.summary?.keyAlerts))

  const polishedPdfReport: IntelligenceReport = {
    id: "test-review-pdf",
    reportType: "REVIEW_RATING",
    title: "Review Intelligence Brief - Test Product",
    status: "COMPLETED",
    filters: { platform: "amazon", productUrl: "https://www.amazon.com/dp/B000000000", productName: "Test Product" },
    summary: {
      productName: "Test Product",
      platform: "amazon",
      asin: "B000000000",
      productUrl: "https://www.amazon.com/dp/B000000000",
      reviewDepth: "Standard",
      reviewCount: 57,
      targetReviewCount: 100,
      marketplaceRatingCount: 5669,
      executiveSummary: "Customers like the concept, but repeated durability complaints require follow-up (watch this"
    },
    data: {
      insight: {
        topComplaints: Array.from({ length: 5 }, (_, index) => ({
          theme: `Complaint theme ${index + 1}`,
          severity: "high",
          evidence: "Repeated durability complaints from customer reviews [provider sample.",
          productImplication: "Inspect quality before promotion {owner review."
        })),
        topCompliments: [],
        buyerLanguage: [],
        productImprovementIdeas: [],
        adHooks: [],
        positioningAngles: [],
        assumptions: [],
        dataQuality: { reviewCount: 57, limitations: [] }
      },
      rows: []
    },
    createdAt: "2026-06-07T02:34:00.000Z",
    updatedAt: "2026-06-07T02:34:00.000Z",
    generatedAt: "2026-06-07T02:34:00.000Z"
  }
  const pdfText = exportReportPdf(polishedPdfReport).toString("utf8")
  assert.ok(pdfText.includes("Buyer sentiment signals, risks, and next actions"), "PDF should include the polished header subtitle")
  assert.ok(pdfText.includes("0.88 0.97 0.98 rg"), "PDF should draw section highlight bands")
  assert.match(pdfText, /\/F2 9 Tf 58 \d+ Td \(ASIN: B000000000\)/)
  assert.ok(pdfText.includes("(SOURCE URL)"), "PDF should render Source URL as a section heading")
  assert.ok(pdfText.includes("TOP COMPLAINTS \\(CONTINUED\\)"), "PDF should label continued long sections")
  assert.ok(pdfText.includes("watch this\\)"), "PDF should close dangling parentheses")
  assert.ok(pdfText.includes("provider sample.]"), "PDF should close dangling square brackets")
  assert.ok(pdfText.includes("owner review.}) Tj"), "PDF should close dangling braces before the PDF text wrapper")

  console.log("Report engine tests passed for all report types and CSV/JSON/PDF exports.")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
