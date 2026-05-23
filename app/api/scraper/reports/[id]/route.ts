import { NextResponse } from "next/server"
import { regenerateReport } from "@/lib/reports/report-engine"
import { getStore } from "@/lib/scrapers/store"
import { getCurrentCustomer } from "@/lib/customer-session"
import { getDb, hasRealDatabaseUrl } from "@/lib/db"

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const customer = await getCurrentCustomer()
  if (!customer) return NextResponse.json({ error: "Sign in to view saved reports." }, { status: 401 })
  if (hasRealDatabaseUrl()) {
    const report = await getDb().intelligenceReport.findFirst({ where: { id, customerId: customer.id } })
    if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 })
    return NextResponse.json({ report })
  }
  const report = getStore().reports.find((item) => item.id === id && item.customerId === customer.id)
  if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 })
  return NextResponse.json({ report })
}

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const customer = await getCurrentCustomer()
  if (!customer) return NextResponse.json({ error: "Sign in to update saved reports." }, { status: 401 })
  const report = regenerateReport(id)
  if (!report || report.customerId !== customer.id) return NextResponse.json({ error: "Report not found" }, { status: 404 })
  return NextResponse.json({ report })
}
