import { NextResponse } from "next/server"
import { z } from "zod"
import { generateReport, listReportTypes, NoReviewDataError } from "@/lib/reports/report-engine"
import { getStore } from "@/lib/scrapers/store"
import { getCurrentCustomer } from "@/lib/customer-session"
import { addCredits, consumeCredit } from "@/lib/customer-store"
import { getDb, hasRealDatabaseUrl, isDatabaseConnectionError } from "@/lib/db"
import { scoreReportInputQuality } from "@/lib/report-input-quality"

const createReportSchema = z.object({
  reportType: z.enum(["PRICE_MONITORING", "AVAILABILITY", "COMPETITOR_ASSORTMENT", "DISCOUNT_PROMOTION", "REVIEW_RATING", "DATA_QUALITY", "EXECUTIVE_SUMMARY"]),
  sourceId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  platform: z.enum(["amazon", "shopify"]).optional().default("amazon"),
  productUrl: z.preprocess(val => {
    if (!val || typeof val !== "string" || val === "") return val
    try { new URL(val); return val } catch {}
    return val.startsWith("//") ? `https:${val}` : `https://${val}`
  }, z.string().url().max(2000).optional().or(z.literal(""))),
  productName: z.string().trim().max(160).optional().or(z.literal("")),
  competitorName: z.string().trim().max(160).optional().or(z.literal("")),
  pastedReviews: z.string().trim().max(30000).optional().or(z.literal("")),
  reviewApp: z.enum(["judgeme", "loox", "yotpo", "okendo", "stamped", "shopify-product-reviews", "other"]).optional(),
  reviewPageLimit: z.union([z.literal(5), z.literal(10), z.literal(50)]).optional().default(10)
})

export async function GET() {
  const customer = await getCurrentCustomer()
  if (!customer) return NextResponse.json({ reports: [], reportTypes: listReportTypes(), customer: null })
  if (hasRealDatabaseUrl()) {
    const reports = await getDb().intelligenceReport.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: "desc" }
    })
    return NextResponse.json({ reports, reportTypes: listReportTypes(), customer })
  }
  const reports = getStore().reports.filter((report) => report.customerId === customer.id)
  return NextResponse.json({ reports, reportTypes: listReportTypes(), customer })
}

export async function POST(request: Request) {
  let consumedCustomerId: string | undefined
  try {
    const parsed = createReportSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid report request", details: parsed.error.flatten() }, { status: 400 })
    }
    const { reportType, sourceId, dateFrom, dateTo, platform, productUrl, productName, competitorName, pastedReviews, reviewApp, reviewPageLimit } = parsed.data
    const customer = await getCurrentCustomer()
    if (!customer) return NextResponse.json({ error: "Sign in to generate and save reports." }, { status: 401 })
    const inputQuality = scoreReportInputQuality(parsed.data)
    if (!inputQuality.creditSafe) {
      return NextResponse.json({ error: inputQuality.message, inputQuality, creditUsed: false }, { status: 400 })
    }
    const debitedCustomer = await consumeCredit(customer.id)
    if (!debitedCustomer) return NextResponse.json({ error: "You are out of report credits. Choose a plan or bundle from Billing." }, { status: 402 })
    consumedCustomerId = customer.id
    const report = await generateReport(reportType, { sourceId, dateFrom, dateTo, platform, productUrl: productUrl || undefined, productName: productName || undefined, competitorName: competitorName || undefined, pastedReviews: pastedReviews || undefined, reviewApp, reviewPageLimit }, customer.id)
    return NextResponse.json({ report, credits: debitedCustomer.credits, inputQuality }, { status: 201 })
  } catch (error) {
    if (consumedCustomerId) await addCredits(consumedCustomerId, 1, "report_generation_refund").catch(() => null)
    console.error("Report generation failed", error)
    if (error instanceof NoReviewDataError) {
      return NextResponse.json({ error: "No reviews found. Your credit has been returned.", details: error.message, creditRefunded: Boolean(consumedCustomerId) }, { status: 422 })
    }
    return NextResponse.json({ error: consumedCustomerId ? "Could not generate report. Your credit has been returned." : "Could not generate report", details: publicErrorDetails(error), creditRefunded: Boolean(consumedCustomerId) }, { status: 500 })
  }
}

function publicErrorDetails(error: unknown) {
  if (isDatabaseConnectionError(error)) {
    return "The database is temporarily unavailable. Please retry in a minute. If the report did not start, your credit was not used."
  }
  return error instanceof Error ? error.message : "Unknown error"
}
