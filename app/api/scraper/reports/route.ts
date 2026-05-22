import { NextResponse } from "next/server"
import { z } from "zod"
import { generateReport, listReportTypes } from "@/lib/reports/report-engine"
import { getStore } from "@/lib/scrapers/store"
import { getCurrentCustomer } from "@/lib/customer-session"
import { consumeCredit } from "@/lib/customer-store"
import { getDb, hasRealDatabaseUrl } from "@/lib/db"

const createReportSchema = z.object({
  reportType: z.enum(["PRICE_MONITORING", "AVAILABILITY", "COMPETITOR_ASSORTMENT", "DISCOUNT_PROMOTION", "REVIEW_RATING", "DATA_QUALITY", "EXECUTIVE_SUMMARY"]),
  sourceId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional()
})

export async function GET() {
  const customer = await getCurrentCustomer()
  if (hasRealDatabaseUrl()) {
    const reports = await getDb().intelligenceReport.findMany({
      where: customer ? { customerId: customer.id } : {},
      orderBy: { createdAt: "desc" }
    })
    return NextResponse.json({ reports, reportTypes: listReportTypes(), customer })
  }
  const reports = getStore().reports.filter((report) => !customer || !report.customerId || report.customerId === customer.id)
  return NextResponse.json({ reports, reportTypes: listReportTypes(), customer })
}

export async function POST(request: Request) {
  try {
    const parsed = createReportSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid report request", details: parsed.error.flatten() }, { status: 400 })
    }
    const { reportType, sourceId, dateFrom, dateTo } = parsed.data
    const customer = await getCurrentCustomer()
    if (!customer) return NextResponse.json({ error: "Sign in to generate and save reports." }, { status: 401 })
    if (!(await consumeCredit(customer.id))) return NextResponse.json({ error: "You are out of report credits. Choose a plan or bundle from Billing." }, { status: 402 })
    const report = await generateReport(reportType, { sourceId, dateFrom, dateTo }, customer.id)
    const updatedCustomer = await getCurrentCustomer()
    return NextResponse.json({ report, credits: updatedCustomer?.credits ?? Math.max(customer.credits - 1, 0) }, { status: 201 })
  } catch (error) {
    console.error("Report generation failed", error)
    return NextResponse.json({ error: "Could not generate report", details: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
