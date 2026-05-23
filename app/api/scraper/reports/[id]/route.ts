import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { z } from "zod"
import { regenerateReport } from "@/lib/reports/report-engine"
import { getStore } from "@/lib/scrapers/store"
import { getCurrentCustomer } from "@/lib/customer-session"
import { getDb, hasRealDatabaseUrl } from "@/lib/db"

const reportActionSchema = z.object({
  action: z.enum(["archive", "restore"])
})

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

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const customer = await getCurrentCustomer()
  if (!customer) return NextResponse.json({ error: "Sign in to manage saved reports." }, { status: 401 })
  const parsed = reportActionSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: "Invalid report action." }, { status: 400 })

  if (hasRealDatabaseUrl()) {
    const existing = await getDb().intelligenceReport.findFirst({ where: { id, customerId: customer.id } })
    if (!existing) return NextResponse.json({ error: "Report not found" }, { status: 404 })
    const currentSummary = asSummary(existing.summary)
    const summary: Prisma.InputJsonObject = parsed.data.action === "archive"
      ? { ...currentSummary, archivedAt: new Date().toISOString() }
      : Object.fromEntries(Object.entries(currentSummary).filter(([key]) => key !== "archivedAt")) as Prisma.InputJsonObject
    const report = await getDb().intelligenceReport.update({ where: { id }, data: { summary } })
    return NextResponse.json({ report })
  }

  const report = getStore().reports.find((item) => item.id === id && item.customerId === customer.id)
  if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 })
  report.summary ||= {}
  if (parsed.data.action === "archive") report.summary.archivedAt = new Date().toISOString()
  else delete report.summary.archivedAt
  report.updatedAt = new Date().toISOString()
  return NextResponse.json({ report })
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const customer = await getCurrentCustomer()
  if (!customer) return NextResponse.json({ error: "Sign in to manage saved reports." }, { status: 401 })

  if (hasRealDatabaseUrl()) {
    const deleted = await getDb().intelligenceReport.deleteMany({ where: { id, customerId: customer.id } })
    if (!deleted.count) return NextResponse.json({ error: "Report not found" }, { status: 404 })
    return NextResponse.json({ deleted: true })
  }

  const reports = getStore().reports
  const index = reports.findIndex((item) => item.id === id && item.customerId === customer.id)
  if (index < 0) return NextResponse.json({ error: "Report not found" }, { status: 404 })
  reports.splice(index, 1)
  return NextResponse.json({ deleted: true })
}

function asSummary(value: unknown): Prisma.InputJsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? { ...(value as Prisma.JsonObject) }
    : {}
}
