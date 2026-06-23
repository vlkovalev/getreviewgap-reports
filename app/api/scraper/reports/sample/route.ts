import { NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { buildSampleReport } from "@/lib/sample-report"
import { getCurrentCustomer } from "@/lib/customer-session"
import { getStore, addReport } from "@/lib/scrapers/store"
import { getDb, hasRealDatabaseUrl } from "@/lib/db"
import { mapPrismaIntelligenceReport } from "@/lib/reports/report-engine"

export async function POST() {
  const customer = await getCurrentCustomer()
  if (!customer) return NextResponse.json({ error: "Sign in to create a sample report." }, { status: 401 })

  const sample = buildSampleReport(customer.id)

  if (hasRealDatabaseUrl()) {
    const existing = await getDb().intelligenceReport.findFirst({
      where: {
        customerId: customer.id,
        title: sample.title
      },
      orderBy: { createdAt: "desc" }
    })
    if (existing) return NextResponse.json({ report: mapPrismaIntelligenceReport(existing), credits: customer.credits, reused: true })

    const report = await getDb().intelligenceReport.create({
      data: {
        customerId: customer.id,
        reportType: sample.reportType,
        title: sample.title,
        status: "COMPLETED",
        filters: sample.filters as Prisma.InputJsonValue,
        summary: sample.summary as Prisma.InputJsonValue,
        data: sample.data as Prisma.InputJsonValue,
        generatedAt: new Date()
      }
    })
    return NextResponse.json({ report: mapPrismaIntelligenceReport(report), credits: customer.credits, reused: false }, { status: 201 })
  }

  const existing = getStore().reports.find((report) => report.customerId === customer.id && report.title === sample.title)
  if (existing) return NextResponse.json({ report: existing, credits: customer.credits, reused: true })

  const report = addReport(sample)
  return NextResponse.json({ report, credits: customer.credits, reused: false }, { status: 201 })
}
