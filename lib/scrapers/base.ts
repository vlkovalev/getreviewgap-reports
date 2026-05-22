import type { ScrapeResult, ScraperSource } from "./types"

export interface ScraperAdapter {
  id: string
  name: string
  scrape(source: ScraperSource, targetUrls: string[]): Promise<ScrapeResult>
}
