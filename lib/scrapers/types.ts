export type SourceStatus = "ACTIVE" | "DISABLED" | "BLOCKED"
export type JobStatus = "ACTIVE" | "PAUSED" | "RUNNING" | "FAILED"
export type RunStatus = "QUEUED" | "RUNNING" | "SUCCESS" | "PARTIAL" | "FAILED" | "BLOCKED"
export type ReportStatus = "DRAFT" | "GENERATING" | "COMPLETED" | "FAILED"
export type ReportType =
  | "PRICE_MONITORING"
  | "AVAILABILITY"
  | "COMPETITOR_ASSORTMENT"
  | "DISCOUNT_PROMOTION"
  | "REVIEW_RATING"
  | "DATA_QUALITY"
  | "EXECUTIVE_SUMMARY"

export type ScraperSource = {
  id: string
  userId?: string
  name: string
  baseUrl: string
  sourceType: string
  status: SourceStatus
  rateLimitSeconds: number
  robotsNote?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export type ScrapeJob = {
  id: string
  userId?: string
  sourceId: string
  name: string
  targetUrls: string[]
  schedule?: string
  status: JobStatus
  lastRunAt?: string
  createdAt: string
  updatedAt: string
}

export type ScrapeRun = {
  id: string
  jobId: string
  sourceId: string
  status: RunStatus
  startedAt?: string
  finishedAt?: string
  durationMs?: number
  productsFound: number
  productsCreated: number
  productsUpdated: number
  errorMessage?: string
  log?: string[]
  createdAt: string
}

export type ProductRecord = {
  id: string
  sourceId: string
  externalId?: string
  url: string
  title?: string
  brand?: string
  category?: string
  imageUrl?: string
  currency: string
  currentPrice?: number
  originalPrice?: number
  discountAmount?: number
  discountPercentage?: number
  availability?: "in_stock" | "out_of_stock" | "unknown"
  rating?: number
  reviewCount?: number
  sellerName?: string
  lastSeenAt?: string
  createdAt: string
  updatedAt: string
}

export type ProductSnapshot = {
  id: string
  productId: string
  scrapeRunId: string
  price?: number
  originalPrice?: number
  currency: string
  availability?: "in_stock" | "out_of_stock" | "unknown"
  rating?: number
  reviewCount?: number
  capturedAt: string
}

export type IntelligenceReport = {
  id: string
  userId?: string
  customerId?: string
  reportType: ReportType
  title: string
  status: ReportStatus
  filters: ReportFilters
  summary?: Record<string, unknown>
  data?: Record<string, unknown>
  errorMessage?: string
  generatedAt?: string
  createdAt: string
  updatedAt: string
}

export type ReportFilters = {
  sourceId?: string
  dateFrom?: string
  dateTo?: string
}

export type ScrapeResult = {
  products: ProductRecord[]
  log: string[]
  blocked?: boolean
  errorMessage?: string
}
