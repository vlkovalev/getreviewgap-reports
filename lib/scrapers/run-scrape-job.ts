import { getScraperAdapter } from "./registry"
import { addRun, getStore } from "./store"
import type { ScrapeRun } from "./types"

export async function runScrapeJob(jobId: string) {
  const store = getStore()
  const job = store.jobs.find((item) => item.id === jobId)
  if (!job) throw new Error("Scrape job not found")
  const source = store.sources.find((item) => item.id === job.sourceId)
  if (!source) throw new Error("Source not found")

  const started = Date.now()
  const adapter = getScraperAdapter(source.sourceType)
  const result = await adapter.scrape(source, job.targetUrls)
  const finished = Date.now()
  const finishedAt = new Date(finished).toISOString()
  const run: ScrapeRun = {
    id: crypto.randomUUID(),
    jobId: job.id,
    sourceId: source.id,
    status: result.blocked ? "BLOCKED" : result.errorMessage ? "FAILED" : "SUCCESS",
    startedAt: new Date(started).toISOString(),
    finishedAt,
    durationMs: finished - started,
    productsFound: result.products.length,
    productsCreated: 0,
    productsUpdated: result.products.length,
    errorMessage: result.errorMessage,
    log: result.log,
    createdAt: new Date().toISOString()
  }
  job.lastRunAt = finishedAt
  job.updatedAt = finishedAt
  return addRun(run)
}
