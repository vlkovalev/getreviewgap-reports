import { NextRequest, NextResponse } from "next/server"
import { amazonMarketplaceLabel, generateReviewInsight, fetchAmazonReviews } from "@/lib/ai/service"
import { reviewInputSchema } from "@/lib/ai/schemas"
import { isRateLimited } from "@/lib/rate-limit"
import { createReportRecord, listReports, logAgentRun } from "@/lib/reports-store"

export async function GET() {
  try {
    return NextResponse.json({ reports: await listReports() })
  } catch {
    return NextResponse.json({ message: "Could not load reports." }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "local"
    if (isRateLimited(`reports:${ip}`, 5, 60_000)) {
      return NextResponse.json({ message: "Too many report requests. Please try again soon." }, { status: 429 })
    }

    const body = await request.json()
    const parsed = reviewInputSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ message: "Please provide a valid Amazon product URL and report details." }, { status: 400 })
    }
    if (parsed.data.website) {
      return NextResponse.json({ message: "Thanks." })
    }

    const reportInput = { ...parsed.data, marketplace: parsed.data.platform === "shopify" ? "Shopify / DTC store" : amazonMarketplaceLabel(parsed.data.productUrl) }
    const reviewResult = await fetchAmazonReviews(reportInput)
    const { insight, provider, model } = await generateReviewInsight(reportInput, reviewResult.reviews)
    const report = await createReportRecord({
      productUrl: parsed.data.productUrl,
      productName: parsed.data.productName || "Amazon product",
      competitorName: parsed.data.competitorName || undefined,
      email: parsed.data.email || undefined,
      status: reviewResult.source === "demo" ? "NEEDS_REVIEW" : "READY",
      reviewCount: reviewResult.reviews.length,
      summary: insight
    })

    await logAgentRun({
      reportId: report.id,
      name: "review-intelligence-report",
      status: "SUCCEEDED",
      provider,
      model,
      agentInput: { ...reportInput, pastedReviews: parsed.data.pastedReviews ? "[provided]" : "" },
      output: insight
    })

    return NextResponse.json({ report, source: reviewResult.source })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Report generation failed."
    await logAgentRun({
      name: "review-intelligence-report",
      status: "FAILED",
      agentInput: {},
      errorMessage: message
    })
    return NextResponse.json({ message }, { status: 500 })
  }
}
