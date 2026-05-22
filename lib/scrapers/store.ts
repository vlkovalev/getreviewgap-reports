import { demoJobs, demoProducts, demoRuns, demoSnapshots, demoSources } from "./demo-data"
import type { IntelligenceReport, ProductRecord, ProductSnapshot, ReportFilters, ReportType, ScrapeJob, ScrapeRun, ScraperSource } from "./types"

const memory = globalThis as unknown as {
  estSources?: ScraperSource[]
  estJobs?: ScrapeJob[]
  estRuns?: ScrapeRun[]
  estProducts?: ProductRecord[]
  estSnapshots?: ProductSnapshot[]
  estReports?: IntelligenceReport[]
}

export function getStore() {
  memory.estSources ||= structuredClone(demoSources)
  memory.estJobs ||= structuredClone(demoJobs)
  memory.estRuns ||= structuredClone(demoRuns)
  memory.estProducts ||= structuredClone(demoProducts)
  memory.estSnapshots ||= structuredClone(demoSnapshots)
  memory.estReports ||= []
  return {
    sources: memory.estSources,
    jobs: memory.estJobs,
    runs: memory.estRuns,
    products: memory.estProducts,
    snapshots: memory.estSnapshots,
    reports: memory.estReports
  }
}

export function addSource(input: Pick<ScraperSource, "name" | "baseUrl" | "sourceType" | "rateLimitSeconds" | "robotsNote" | "notes">) {
  const store = getStore()
  const now = new Date().toISOString()
  const source: ScraperSource = { id: crypto.randomUUID(), status: "ACTIVE", createdAt: now, updatedAt: now, ...input }
  store.sources.unshift(source)
  return source
}

export function addJob(input: Pick<ScrapeJob, "sourceId" | "name" | "targetUrls" | "schedule">) {
  const store = getStore()
  const now = new Date().toISOString()
  const job: ScrapeJob = { id: crypto.randomUUID(), status: "ACTIVE", createdAt: now, updatedAt: now, ...input }
  store.jobs.unshift(job)
  return job
}

export function addRun(run: ScrapeRun) {
  const store = getStore()
  store.runs.unshift(run)
  return run
}

export function addReport(input: { userId?: string; customerId?: string; reportType: ReportType; title: string; filters: ReportFilters; summary: Record<string, unknown>; data: Record<string, unknown> }) {
  const store = getStore()
  const now = new Date().toISOString()
  const report: IntelligenceReport = { id: crypto.randomUUID(), status: "COMPLETED", generatedAt: now, createdAt: now, updatedAt: now, ...input }
  store.reports.unshift(report)
  return report
}
