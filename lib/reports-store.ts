import { getDb } from "@/lib/db"
import type { ReviewInsight } from "@/lib/ai/schemas"

export type StoredReport = {
  id: string
  createdAt: string
  productUrl: string
  productName: string
  competitorName?: string | null
  email?: string | null
  status: "READY" | "FAILED" | "RUNNING" | "NEEDS_REVIEW" | "DRAFT"
  reviewCount: number
  summary?: ReviewInsight
  errorMessage?: string | null
}

const memory = globalThis as unknown as { reviewIntelReports?: StoredReport[]; reviewIntelAgentRuns?: unknown[] }
if (!memory.reviewIntelReports) memory.reviewIntelReports = []

export async function createReportRecord(input: {
  productUrl: string
  productName: string
  competitorName?: string
  email?: string
  status: StoredReport["status"]
  reviewCount: number
  summary?: ReviewInsight
  errorMessage?: string
}) {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes("USER:PASSWORD")) {
    const report: StoredReport = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      productUrl: input.productUrl,
      productName: input.productName,
      competitorName: input.competitorName || null,
      email: input.email || null,
      status: input.status,
      reviewCount: input.reviewCount,
      summary: input.summary,
      errorMessage: input.errorMessage || null
    }
    memory.reviewIntelReports!.unshift(report)
    return report
  }

  const db = getDb()
  const record = await db.reviewReport.create({
    data: {
      productUrl: input.productUrl,
      productName: input.productName,
      competitorName: input.competitorName || null,
      email: input.email || null,
      status: input.status,
      reviewCount: input.reviewCount,
      summary: input.summary || undefined,
      errorMessage: input.errorMessage || null
    }
  })

  return {
    id: record.id,
    createdAt: record.createdAt.toISOString(),
    productUrl: record.productUrl,
    productName: record.productName,
    competitorName: record.competitorName,
    email: record.email,
    status: record.status,
    reviewCount: record.reviewCount,
    summary: record.summary as ReviewInsight | undefined,
    errorMessage: record.errorMessage
  } satisfies StoredReport
}

export async function listReports() {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes("USER:PASSWORD")) {
    return memory.reviewIntelReports!.slice(0, 25)
  }

  const db = getDb()
  const reports = await db.reviewReport.findMany({ orderBy: { createdAt: "desc" }, take: 25 })
  return reports.map((record) => ({
    id: record.id,
    createdAt: record.createdAt.toISOString(),
    productUrl: record.productUrl,
    productName: record.productName,
    competitorName: record.competitorName,
    email: record.email,
    status: record.status,
    reviewCount: record.reviewCount,
    summary: record.summary as ReviewInsight | undefined,
    errorMessage: record.errorMessage
  } satisfies StoredReport))
}

export async function logAgentRun(input: {
  reportId?: string
  name: string
  status: "SUCCEEDED" | "FAILED" | "RUNNING" | "QUEUED"
  provider?: string
  model?: string
  agentInput: unknown
  output?: unknown
  errorMessage?: string
}) {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes("USER:PASSWORD")) {
    return
  }

  const db = getDb()
  await db.agentRun.create({
    data: {
      reportId: input.reportId,
      name: input.name,
      status: input.status,
      provider: input.provider,
      model: input.model,
      input: input.agentInput as object,
      output: input.output as object,
      errorMessage: input.errorMessage
    }
  })
}
