export type ReportInputQualityLevel = "strong" | "usable" | "warning" | "blocked"

export type ReportInputQualityInput = {
  reportType?: string
  platform?: "amazon" | "shopify"
  productUrl?: string
  pastedReviews?: string
  reviewApp?: string
}

export type ReportInputQuality = {
  level: ReportInputQualityLevel
  score: number
  wordCount: number
  estimatedReviews: number
  creditSafe: boolean
  message: string
  issues: string[]
}

const directShopifyApps = new Set(["judgeme", "stamped", "loox", "yotpo", "okendo"])

export function scoreReportInputQuality(input: ReportInputQualityInput): ReportInputQuality {
  const reportType = input.reportType ?? "REVIEW_RATING"
  const isReviewReport = reportType === "REVIEW_RATING" || reportType === "EXECUTIVE_SUMMARY"
  const platform = input.platform ?? "amazon"
  const pastedText = (input.pastedReviews ?? "").trim()
  const hasPastedReviews = pastedText.length > 0
  const hasProductUrl = Boolean(input.productUrl?.trim())
  const wordCount = countWords(pastedText)
  const estimatedReviews = estimateReviewRows(pastedText)
  const issues: string[] = []

  if (!isReviewReport) {
    return {
      level: "usable",
      score: 80,
      wordCount,
      estimatedReviews,
      creditSafe: true,
      message: "This report type does not require review text preflight.",
      issues
    }
  }

  if (!hasProductUrl && !hasPastedReviews) {
    issues.push("missing_source")
    return {
      level: "blocked",
      score: 0,
      wordCount,
      estimatedReviews,
      creditSafe: false,
      message: "Add a product URL or paste/upload review text before generating. No credit was used.",
      issues
    }
  }

  if (hasPastedReviews) {
    if (wordCount < 20 || pastedText.replace(/\s+/g, " ").length < 120) {
      issues.push("too_little_review_text")
      return {
        level: "blocked",
        score: Math.min(35, Math.round(wordCount * 1.5)),
        wordCount,
        estimatedReviews,
        creditSafe: false,
        message: "The pasted review text is too short to produce a reliable report. Add at least a few complete review sentences or upload a CSV/TXT export. No credit was used.",
        issues
      }
    }

    const score = Math.min(100, 45 + Math.floor(wordCount / 8) + Math.min(20, estimatedReviews * 3))
    const level: ReportInputQualityLevel = score >= 85 ? "strong" : score >= 60 ? "usable" : "warning"
    if (estimatedReviews < 5) issues.push("small_review_sample")
    return {
      level,
      score,
      wordCount,
      estimatedReviews,
      creditSafe: true,
      message: level === "strong"
        ? `Strong import: about ${wordCount} words across roughly ${estimatedReviews} review row${estimatedReviews === 1 ? "" : "s"}.`
        : `Import looks usable: about ${wordCount} words across roughly ${estimatedReviews} review row${estimatedReviews === 1 ? "" : "s"}. More rows will improve confidence.`,
      issues
    }
  }

  if (platform === "shopify") {
    if (!input.reviewApp || !directShopifyApps.has(input.reviewApp)) {
      issues.push("shopify_export_required")
      return {
        level: "blocked",
        score: 20,
        wordCount,
        estimatedReviews,
        creditSafe: false,
        message: "This Shopify review source needs an authorized CSV/TXT export or pasted review text. No credit was used.",
        issues
      }
    }

    issues.push("live_connector_beta")
    return {
      level: "warning",
      score: 58,
      wordCount,
      estimatedReviews,
      creditSafe: true,
      message: "Live Shopify connector test is possible, but an authorized export is more reliable for beta reports.",
      issues
    }
  }

  return {
    level: "usable",
    score: 70,
    wordCount,
    estimatedReviews,
    creditSafe: true,
    message: "Amazon URL is ready for provider preflight. If Amazon exposes too few written reviews, your credit will be returned.",
    issues
  }
}

export function hasEnoughReviewText(text: string) {
  return scoreReportInputQuality({ pastedReviews: text }).creditSafe
}

function countWords(text: string) {
  if (!text.trim()) return 0
  return text.replace(/\s+/g, " ").split(" ").filter(Boolean).length
}

function estimateReviewRows(text: string) {
  if (!text.trim()) return 0
  const lineRows = text.split(/\n+/).filter((item) => item.trim().length > 30).length
  const labelledRows = text.split(/(?:^|\s)review(?:\s+\d+)?:/i).filter((item) => item.trim().length > 30).length
  return Math.max(1, lineRows, labelledRows)
}
