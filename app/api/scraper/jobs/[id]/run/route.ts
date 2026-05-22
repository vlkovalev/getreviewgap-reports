import { NextResponse } from "next/server"
import { runScrapeJob } from "@/lib/scrapers/run-scrape-job"

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  try {
    const run = await runScrapeJob(id)
    return NextResponse.json({ run, result: { products: run.productsFound, blocked: run.status === "BLOCKED" } })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not run job" }, { status: 404 })
  }
}
