import { average, isValidHttpUrl, percent, toCsv } from "@/lib/scrapers/parser-utils"
import { addReport, getStore } from "@/lib/scrapers/store"
import type { IntelligenceReport, ProductRecord, ProductSnapshot, ReportFilters, ReportType } from "@/lib/scrapers/types"
import { getDb, hasRealDatabaseUrl } from "@/lib/db"
import { fetchAmazonReviews, generateReviewInsight } from "@/lib/ai/service"

const reportLabels: Record<ReportType, string> = {
  PRICE_MONITORING: "Price Monitoring Report",
  AVAILABILITY: "Availability / Stock Report",
  COMPETITOR_ASSORTMENT: "Competitor Assortment Report",
  DISCOUNT_PROMOTION: "Discount and Promotion Report",
  REVIEW_RATING: "Review and Rating Report",
  DATA_QUALITY: "Data Quality Report",
  EXECUTIVE_SUMMARY: "Executive Summary Report"
}

type ProductWithSource = ProductRecord & { sourceName: string; snapshots: ProductSnapshot[] }

export function getReportTypeLabel(type: ReportType) {
  return reportLabels[type]
}

export function listReportTypes() {
  return Object.entries(reportLabels).map(([value, label]) => ({ value: value as ReportType, label }))
}

export async function generateReport(type: ReportType, filters: ReportFilters = {}, customerId?: string) {
  if ((type === "REVIEW_RATING" || type === "EXECUTIVE_SUMMARY") && (filters.productUrl || filters.pastedReviews)) {
    return generateReviewIntelligenceReport(type, filters, customerId)
  }

  const products = getFilteredProducts(filters)
  const payload = buildReportPayload(type, products, filters)
  const reportInput = {
    reportType: type,
    customerId,
    title: `${reportLabels[type]} - ${new Date().toLocaleDateString("en-US")}`,
    filters,
    summary: { sourceFilter: filters.sourceId ?? "all", productCount: products.length, ...payload.summary },
    data: payload.data
  }

  if (hasRealDatabaseUrl()) {
    const now = new Date()
    const report = await getDb().intelligenceReport.create({
      data: {
        customerId,
        reportType: type,
        title: reportInput.title,
        status: "COMPLETED",
        filters,
        summary: reportInput.summary,
        data: reportInput.data,
        generatedAt: now
      }
    })
    return {
      id: report.id,
      customerId: report.customerId ?? undefined,
      reportType: type,
      title: report.title,
      status: report.status,
      filters: (report.filters as ReportFilters) ?? {},
      summary: (report.summary as Record<string, unknown>) ?? {},
      data: (report.data as Record<string, unknown>) ?? {},
      generatedAt: report.generatedAt?.toISOString(),
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString()
    } satisfies IntelligenceReport
  }

  return addReport(reportInput)
}

async function generateReviewIntelligenceReport(type: ReportType, filters: ReportFilters, customerId?: string) {
  const productUrl = filters.productUrl || "https://www.amazon.com/dp/demo"
  const productName = filters.productName || "Amazon product"
  const reviewResult = await fetchAmazonReviews({
    productUrl,
    productName,
    competitorName: filters.competitorName,
    pastedReviews: filters.pastedReviews,
    marketplace: "amazon.com"
  })
  const { insight, provider, model } = await generateReviewInsight({
    productUrl,
    productName,
    competitorName: filters.competitorName,
    pastedReviews: filters.pastedReviews,
    marketplace: "amazon.com"
  }, reviewResult.reviews)
  const now = new Date()
  const rows = [
    ...insight.topComplaints.map((item) => ({ section: "Top complaint", theme: item.theme, evidence: item.evidence, severity: item.severity, recommendation: item.productImplication })),
    ...insight.topCompliments.map((item) => ({ section: "Top compliment", theme: item.theme, evidence: item.evidence, severity: "", recommendation: item.marketingImplication })),
    ...insight.productImprovementIdeas.map((item) => ({ section: "Product idea", theme: item.idea, evidence: item.whyItMatters, severity: item.confidence, recommendation: item.whyItMatters })),
    ...insight.adHooks.map((hook) => ({ section: "Ad hook", theme: hook, evidence: "", severity: "", recommendation: hook }))
  ]
  const reportInput = {
    reportType: type,
    customerId,
    title: `${type === "EXECUTIVE_SUMMARY" ? "Executive Review Intelligence" : "Review and Rating Report"} - ${productName}`,
    filters,
    summary: {
      productName,
      productUrl,
      competitorName: filters.competitorName ?? "",
      source: reviewResult.source,
      provider,
      model,
      reviewCount: reviewResult.reviews.length,
      warning: reviewResult.warning ?? "",
      executiveSummary: insight.executiveSummary,
      topComplaints: insight.topComplaints.slice(0, 5),
      topCompliments: insight.topCompliments.slice(0, 5),
      buyerLanguage: insight.buyerLanguage.slice(0, 12),
      assumptions: insight.assumptions,
      dataQuality: insight.dataQuality
    },
    data: {
      rows,
      insight,
      source: reviewResult.source,
      warning: reviewResult.warning ?? ""
    }
  }

  if (hasRealDatabaseUrl()) {
    const report = await getDb().intelligenceReport.create({
      data: {
        customerId,
        reportType: type,
        title: reportInput.title,
        status: "COMPLETED",
        filters,
        summary: reportInput.summary,
        data: reportInput.data,
        generatedAt: now
      }
    })
    return {
      id: report.id,
      customerId: report.customerId ?? undefined,
      reportType: type,
      title: report.title,
      status: report.status,
      filters: (report.filters as ReportFilters) ?? {},
      summary: (report.summary as Record<string, unknown>) ?? {},
      data: (report.data as Record<string, unknown>) ?? {},
      generatedAt: report.generatedAt?.toISOString(),
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString()
    } satisfies IntelligenceReport
  }

  return addReport(reportInput)
}

export function regenerateReport(reportId: string) {
  const store = getStore()
  const existing = store.reports.find((report) => report.id === reportId)
  if (!existing) return null
  const payload = buildReportPayload(existing.reportType, getFilteredProducts(existing.filters), existing.filters)
  const now = new Date().toISOString()
  existing.status = "COMPLETED"
  existing.summary = payload.summary
  existing.data = payload.data
  existing.generatedAt = now
  existing.updatedAt = now
  existing.errorMessage = undefined
  return existing
}

export function reportRowsForExport(report: IntelligenceReport): Record<string, unknown>[] {
  const data = report.data ?? {}
  if (Array.isArray(data.rows)) return data.rows as Record<string, unknown>[]
  if (Array.isArray(data.alerts)) return data.alerts as Record<string, unknown>[]
  return [{ title: report.title, reportType: report.reportType, status: report.status, ...report.summary }]
}

export function exportReportCsv(report: IntelligenceReport) {
  return toCsv(reportRowsForExport(report))
}

export function exportReportJson(report: IntelligenceReport) {
  return JSON.stringify(report, null, 2)
}

export function exportReportPdf(report: IntelligenceReport) {
  const lines = buildPdfLines(report)
  const objects: string[] = []
  const pages: number[] = []
  const chunks = chunk(lines, 34)

  objects.push("<< /Type /Catalog /Pages 2 0 R >>")
  objects.push("<< /Type /Pages /Kids [] /Count 0 >>")
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")

  chunks.forEach((pageLines) => {
    const content = [
      "BT",
      "/F1 11 Tf",
      "50 760 Td",
      "14 TL",
      ...pageLines.map((line, index) => `${index === 0 ? "" : "T* "}${pdfText(line)}`),
      "ET"
    ].join("\n")
    const contentObjectNumber = objects.length + 1
    objects.push(`<< /Length ${Buffer.byteLength(content, "utf8")} >>\nstream\n${content}\nendstream`)
    const pageObjectNumber = objects.length + 1
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`)
    pages.push(pageObjectNumber)
  })

  objects[1] = `<< /Type /Pages /Kids [${pages.map((page) => `${page} 0 R`).join(" ")}] /Count ${pages.length} >>`

  const header = "%PDF-1.4\n"
  let body = ""
  const offsets = [0]
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(header + body, "utf8"))
    body += `${index + 1} 0 obj\n${object}\nendobj\n`
  })
  const xrefOffset = Buffer.byteLength(header + body, "utf8")
  const xref = [
    "xref",
    `0 ${objects.length + 1}`,
    "0000000000 65535 f ",
    ...offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `),
    "trailer",
    `<< /Size ${objects.length + 1} /Root 1 0 R >>`,
    "startxref",
    String(xrefOffset),
    "%%EOF"
  ].join("\n")

  return Buffer.from(header + body + xref, "utf8")
}

function buildPdfLines(report: IntelligenceReport) {
  const rows = reportRowsForExport(report).slice(0, 20)
  const summary = report.summary ?? {}
  const insight = report.data?.insight as {
    topComplaints?: Array<{ theme?: string; evidence?: string; severity?: string; productImplication?: string }>
    topCompliments?: Array<{ theme?: string; evidence?: string; marketingImplication?: string }>
    buyerLanguage?: string[]
    productImprovementIdeas?: Array<{ idea?: string; whyItMatters?: string; confidence?: string }>
    adHooks?: string[]
    positioningAngles?: string[]
    assumptions?: string[]
    dataQuality?: { reviewCount?: number; limitations?: string[] }
  } | undefined
  const reviewCount = Number(summary.reviewCount ?? insight?.dataQuality?.reviewCount ?? 0)
  return [
    "ReviewGap",
    "AI Review Intelligence Brief",
    `Product: ${stringifyPdfValue(summary.productName ?? report.title)}`,
    `URL: ${stringifyPdfValue(summary.productUrl ?? "-")}`,
    `Type: ${report.reportType}`,
    `Status: ${report.status}`,
    `Generated: ${report.generatedAt ?? report.createdAt}`,
    `Source: ${stringifyPdfValue(summary.source ?? summary.sourceFilter ?? "-")}`,
    `Reviews analyzed: ${reviewCount}`,
    `Confidence: ${pdfConfidence(reviewCount)}`,
    "",
    "Executive Summary",
    wrapPdfLine(stringifyPdfValue(summary.executiveSummary ?? "No executive summary was generated.")),
    ...(summary.warning ? ["", "Data Source Warning", wrapPdfLine(stringifyPdfValue(summary.warning))] : []),
    "",
    "Next Best Actions",
    ...pdfActions(insight).map((item, index) => `${index + 1}. ${wrapPdfLine(item)}`),
    "",
    "Top Complaints",
    ...pdfComplaintLines(insight),
    "",
    "Top Compliments",
    ...pdfComplimentLines(insight),
    "",
    "Buyer Language",
    wrapPdfLine((insight?.buyerLanguage ?? []).slice(0, 16).join("; ") || "No buyer language available."),
    "",
    "Ad Hooks",
    ...(insight?.adHooks?.length ? insight.adHooks.slice(0, 6).map((item, index) => `${index + 1}. ${wrapPdfLine(item)}`) : ["No ad hooks available."]),
    "",
    "Positioning Angles",
    ...(insight?.positioningAngles?.length ? insight.positioningAngles.slice(0, 6).map((item, index) => `${index + 1}. ${wrapPdfLine(item)}`) : ["No positioning angles available."]),
    "",
    "Assumptions and Limitations",
    ...[...(insight?.assumptions ?? []), ...(insight?.dataQuality?.limitations ?? [])].slice(0, 8).map((item, index) => `${index + 1}. ${wrapPdfLine(item)}`),
    "",
    "Appendix Rows",
    ...rows.flatMap((row, index) => [
      `${index + 1}. ${stringifyPdfValue(row.theme ?? row.productName ?? row.title ?? row.source ?? "Report row")}`,
      ...Object.entries(row).slice(0, 5).map(([key, value]) => `   ${key}: ${stringifyPdfValue(value)}`)
    ])
  ].flatMap((line) => splitPdfLine(String(line))).map((line) => line.slice(0, 100))
}

function stringifyPdfValue(value: unknown): string {
  if (value === null || value === undefined) return "-"
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value)
  if (Array.isArray(value)) return value.map((item) => stringifyPdfValue(item)).join("; ").slice(0, 160)
  return JSON.stringify(value).slice(0, 160)
}

function pdfConfidence(reviewCount: number) {
  if (reviewCount >= 100) return "High"
  if (reviewCount >= 20) return "Medium"
  return "Low"
}

function pdfActions(insight: { productImprovementIdeas?: Array<{ idea?: string }>; topComplaints?: Array<{ theme?: string }>; adHooks?: string[] } | undefined) {
  const ideas = insight?.productImprovementIdeas?.map((item) => item.idea).filter(Boolean) as string[] | undefined
  const complaints = insight?.topComplaints?.map((item) => item.theme ? `Address ${item.theme} in product, listing, or support copy.` : "").filter(Boolean) as string[] | undefined
  const hooks = insight?.adHooks?.map((item) => `Test hook: ${item}`) ?? []
  const actions = [...(ideas ?? []), ...(complaints ?? []), ...hooks].slice(0, 5)
  return actions.length ? actions : ["Collect more review data before making product decisions.", "Paste reviews manually if the connector returns no text."]
}

function pdfComplaintLines(insight: { topComplaints?: Array<{ theme?: string; severity?: string; evidence?: string; productImplication?: string }> } | undefined) {
  const items = insight?.topComplaints ?? []
  if (!items.length) return ["No complaints available."]
  return items.slice(0, 5).flatMap((item, index) => [
    `${index + 1}. ${stringifyPdfValue(item.theme)} (${stringifyPdfValue(item.severity)})`,
    `   Evidence: ${wrapPdfLine(stringifyPdfValue(item.evidence))}`,
    `   Action: ${wrapPdfLine(stringifyPdfValue(item.productImplication))}`
  ])
}

function pdfComplimentLines(insight: { topCompliments?: Array<{ theme?: string; evidence?: string; marketingImplication?: string }> } | undefined) {
  const items = insight?.topCompliments ?? []
  if (!items.length) return ["No compliments available."]
  return items.slice(0, 5).flatMap((item, index) => [
    `${index + 1}. ${stringifyPdfValue(item.theme)}`,
    `   Evidence: ${wrapPdfLine(stringifyPdfValue(item.evidence))}`,
    `   Use: ${wrapPdfLine(stringifyPdfValue(item.marketingImplication))}`
  ])
}

function wrapPdfLine(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

function splitPdfLine(value: string) {
  const lines: string[] = []
  for (let index = 0; index < value.length; index += 100) lines.push(value.slice(index, index + 100))
  return lines.length ? lines : [""]
}

function pdfText(text: string) {
  const escaped = text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)").replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "")
  return `(${escaped}) Tj`
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size))
  return chunks.length ? chunks : [[]]
}

function getFilteredProducts(filters: ReportFilters): ProductWithSource[] {
  const store = getStore()
  const from = filters.dateFrom ? new Date(filters.dateFrom).getTime() : Number.NEGATIVE_INFINITY
  const to = filters.dateTo ? new Date(filters.dateTo).getTime() : Number.POSITIVE_INFINITY
  return store.products
    .filter((product) => !filters.sourceId || product.sourceId === filters.sourceId)
    .map((product) => {
      const sourceName = store.sources.find((source) => source.id === product.sourceId)?.name ?? "Unknown source"
      const snapshots = store.snapshots
        .filter((snapshot) => snapshot.productId === product.id)
        .filter((snapshot) => {
          const captured = new Date(snapshot.capturedAt).getTime()
          return captured >= from && captured <= to
        })
        .sort((a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime())
      return { ...product, sourceName, snapshots }
    })
}

function buildReportPayload(type: ReportType, products: ProductWithSource[], filters: ReportFilters) {
  switch (type) {
    case "PRICE_MONITORING":
      return buildPriceReport(products)
    case "AVAILABILITY":
      return buildAvailabilityReport(products)
    case "COMPETITOR_ASSORTMENT":
      return buildAssortmentReport(products)
    case "DISCOUNT_PROMOTION":
      return buildDiscountReport(products)
    case "REVIEW_RATING":
      return buildReviewReport(products)
    case "DATA_QUALITY":
      return buildDataQualityReport(products)
    case "EXECUTIVE_SUMMARY":
      return buildExecutiveSummary(products, filters)
  }
}

function buildPriceReport(products: ProductWithSource[]) {
  const rows = products.map((product) => {
    const prices = product.snapshots.map((snapshot) => snapshot.price).filter((price): price is number => typeof price === "number")
    const previous = prices.length > 1 ? prices[prices.length - 2] : prices[0]
    const change = typeof product.currentPrice === "number" && typeof previous === "number" ? round(product.currentPrice - previous) : null
    return {
      productName: product.title ?? "Missing title",
      source: product.sourceName,
      currentPrice: product.currentPrice ?? null,
      previousPrice: previous ?? null,
      priceChangeAmount: change,
      priceChangePercentage: change !== null && previous ? round(percent(change, previous)) : null,
      highestPrice: prices.length ? Math.max(...prices) : product.currentPrice ?? null,
      lowestPrice: prices.length ? Math.min(...prices) : product.currentPrice ?? null,
      averagePrice: prices.length ? round(average(prices)) : product.currentPrice ?? null,
      lastUpdated: product.lastSeenAt ?? product.updatedAt
    }
  })
  const sorted = [...rows].sort((a, b) => Number(a.priceChangeAmount ?? 0) - Number(b.priceChangeAmount ?? 0))
  return {
    summary: {
      averageCurrentPrice: round(average(rows.map((row) => Number(row.currentPrice)).filter(Number.isFinite))),
      biggestDrops: sorted.slice(0, 3),
      biggestIncreases: sorted.slice(-3).reverse()
    },
    data: { rows }
  }
}

function buildAvailabilityReport(products: ProductWithSource[]) {
  const rows = products.map((product) => {
    const previous = product.snapshots.length > 1 ? product.snapshots[product.snapshots.length - 2]?.availability : product.snapshots[0]?.availability
    return {
      productName: product.title ?? "Missing title",
      source: product.sourceName,
      currentAvailability: product.availability ?? "unknown",
      previousAvailability: previous ?? "unknown",
      availabilityChange: previous && previous !== product.availability ? `${previous} -> ${product.availability ?? "unknown"}` : "none",
      firstSeenTimestamp: product.createdAt,
      lastSeenTimestamp: product.lastSeenAt ?? product.updatedAt
    }
  })
  return {
    summary: {
      outOfStockProducts: rows.filter((row) => row.currentAvailability === "out_of_stock"),
      newlyRestockedProducts: rows.filter((row) => row.previousAvailability === "out_of_stock" && row.currentAvailability === "in_stock"),
      inStockPercentage: round(percent(rows.filter((row) => row.currentAvailability === "in_stock").length, rows.length))
    },
    data: { rows }
  }
}

function buildAssortmentReport(products: ProductWithSource[]) {
  const sourceGroups = groupBy(products, (product) => product.sourceName)
  const rows = Object.entries(sourceGroups).map(([source, group]) => ({
    source,
    productCount: group.length,
    brandCount: uniqueCount(group.map((product) => product.brand).filter(Boolean)),
    categoryCount: uniqueCount(group.map((product) => product.category).filter(Boolean)),
    averagePrice: round(average(group.map((product) => product.currentPrice).filter((price): price is number => typeof price === "number"))),
    discountedProductCount: group.filter((product) => (product.discountPercentage ?? 0) > 0).length,
    inStockPercentage: round(percent(group.filter((product) => product.availability === "in_stock").length, group.length)),
    topBrands: topCounts(group.map((product) => product.brand).filter(Boolean) as string[]),
    topCategories: topCounts(group.map((product) => product.category).filter(Boolean) as string[])
  }))
  return { summary: { sourceRows: rows.length }, data: { rows } }
}

function buildDiscountReport(products: ProductWithSource[]) {
  const rows = products.map((product) => {
    const previous = product.snapshots.length > 1 ? product.snapshots[product.snapshots.length - 2] : undefined
    const wasOnSale = previous?.originalPrice && previous.price ? previous.originalPrice > previous.price : false
    const isOnSale = Boolean(product.originalPrice && product.currentPrice && product.originalPrice > product.currentPrice)
    return {
      productName: product.title ?? "Missing title",
      source: product.sourceName,
      currentPrice: product.currentPrice ?? null,
      originalPrice: product.originalPrice ?? null,
      discountAmount: product.discountAmount ?? round((product.originalPrice ?? 0) - (product.currentPrice ?? 0)),
      discountPercentage: product.discountPercentage ?? null,
      discountStatus: isOnSale ? "on_sale" : "not_on_sale",
      newlyOnSale: !wasOnSale && isOnSale,
      noLongerOnSale: wasOnSale && !isOnSale
    }
  })
  return {
    summary: {
      topDiscountedProducts: [...rows].sort((a, b) => Number(b.discountPercentage ?? 0) - Number(a.discountPercentage ?? 0)).slice(0, 5),
      productsNewlyOnSale: rows.filter((row) => row.newlyOnSale),
      productsNoLongerOnSale: rows.filter((row) => row.noLongerOnSale)
    },
    data: { rows }
  }
}

function buildReviewReport(products: ProductWithSource[]) {
  const rows = products.map((product) => {
    const previous = product.snapshots.length > 1 ? product.snapshots[product.snapshots.length - 2] : undefined
    return {
      productName: product.title ?? "Missing title",
      source: product.sourceName,
      rating: product.rating ?? null,
      reviewCount: product.reviewCount ?? null,
      ratingChange: typeof product.rating === "number" && typeof previous?.rating === "number" ? round(product.rating - previous.rating) : null,
      reviewCountChange: typeof product.reviewCount === "number" && typeof previous?.reviewCount === "number" ? product.reviewCount - previous.reviewCount : null
    }
  })
  return {
    summary: {
      highestRatedProducts: [...rows].sort((a, b) => Number(b.rating ?? 0) - Number(a.rating ?? 0)).slice(0, 5),
      lowestRatedProducts: [...rows].sort((a, b) => Number(a.rating ?? 999) - Number(b.rating ?? 999)).slice(0, 5),
      fastestGrowingReviewCounts: [...rows].sort((a, b) => Number(b.reviewCountChange ?? 0) - Number(a.reviewCountChange ?? 0)).slice(0, 5)
    },
    data: { rows }
  }
}

function buildDataQualityReport(products: ProductWithSource[]) {
  const store = getStore()
  const duplicateKeys = new Set<string>()
  const seen = new Set<string>()
  products.forEach((product) => {
    const key = `${product.sourceId}:${product.externalId ?? product.url}`
    if (seen.has(key)) duplicateKeys.add(key)
    seen.add(key)
  })
  const rows = products.map((product) => {
    const missingFields = [
      !product.title ? "title" : null,
      typeof product.currentPrice !== "number" ? "price" : null,
      !product.imageUrl ? "image" : null,
      !product.category ? "category" : null,
      !isValidHttpUrl(product.url) ? "valid_url" : null
    ].filter(Boolean)
    return {
      productName: product.title ?? "Missing title",
      source: product.sourceName,
      missingFields: missingFields.join(", ") || "none",
      invalidUrl: !isValidHttpUrl(product.url),
      duplicate: duplicateKeys.has(`${product.sourceId}:${product.externalId ?? product.url}`),
      completenessScore: round(percent(5 - missingFields.length, 5))
    }
  })
  const parseErrors = store.runs.filter((run) => run.status === "FAILED" || run.status === "PARTIAL").map((run) => ({
    runId: run.id,
    sourceId: run.sourceId,
    errorMessage: run.errorMessage ?? "No error message captured"
  }))
  return {
    summary: {
      missingProductTitles: rows.filter((row) => String(row.missingFields).includes("title")).length,
      missingPrices: rows.filter((row) => String(row.missingFields).includes("price")).length,
      missingImages: rows.filter((row) => String(row.missingFields).includes("image")).length,
      missingCategories: rows.filter((row) => String(row.missingFields).includes("category")).length,
      invalidUrls: rows.filter((row) => row.invalidUrl).length,
      duplicateProducts: rows.filter((row) => row.duplicate).length,
      parseErrors,
      sourceLevelCompletenessScore: round(average(rows.map((row) => row.completenessScore)))
    },
    data: { rows, parseErrors }
  }
}

function buildExecutiveSummary(products: ProductWithSource[], filters: ReportFilters) {
  const store = getStore()
  const price = buildPriceReport(products)
  const availability = buildAvailabilityReport(products)
  const assortment = buildAssortmentReport(products)
  const alerts = [
    ...(price.summary.biggestDrops as Record<string, unknown>[]).slice(0, 2).map((row) => ({ type: "price_drop", ...row })),
    ...(availability.summary.outOfStockProducts as Record<string, unknown>[]).slice(0, 2).map((row) => ({ type: "out_of_stock", ...row }))
  ]
  return {
    summary: {
      totalSourcesMonitored: filters.sourceId ? 1 : store.sources.length,
      totalProductsTracked: products.length,
      totalScrapeRuns: store.runs.length,
      latestSuccessfulScrape: store.runs.find((run) => run.status === "SUCCESS")?.finishedAt ?? null,
      failedScrapeCount: store.runs.filter((run) => run.status === "FAILED" || run.status === "BLOCKED").length,
      averageProductPrice: price.summary.averageCurrentPrice,
      inStockPercentage: availability.summary.inStockPercentage,
      topPriceDrops: price.summary.biggestDrops,
      topCategories: topCounts(products.map((product) => product.category).filter(Boolean) as string[]),
      keyAlerts: alerts
    },
    data: { rows: assortment.data.rows, alerts }
  }
}

function topCounts(values: string[]) {
  const counts = values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1
    return acc
  }, {})
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }))
}

function groupBy<T>(items: T[], getKey: (item: T) => string) {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const key = getKey(item)
    acc[key] ||= []
    acc[key].push(item)
    return acc
  }, {})
}

function uniqueCount(values: unknown[]) {
  return new Set(values).size
}

function round(value: number) {
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : 0
}
