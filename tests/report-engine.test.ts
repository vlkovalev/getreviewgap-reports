import assert from "node:assert/strict"
import { exportReportCsv, exportReportJson, generateReport, listReportTypes, reportRowsForExport } from "../lib/reports/report-engine"
import type { ReportType } from "../lib/scrapers/types"

async function main() {
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

  console.log("Report engine tests passed for all report types and CSV/JSON exports.")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
