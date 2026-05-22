import type { ProductRecord, ProductSnapshot, ScrapeJob, ScrapeRun, ScraperSource } from "./types"

const now = new Date("2026-05-20T12:00:00.000Z")
const iso = (daysAgo: number) => new Date(now.getTime() - daysAgo * 86400000).toISOString()

export const demoSources: ScraperSource[] = [
  { id: "src-amazon", name: "Amazon Competitors", baseUrl: "https://www.amazon.com", sourceType: "marketplace", status: "ACTIVE", rateLimitSeconds: 10, robotsNote: "Use configured Apify actor or official APIs where required. Do not bypass access controls.", notes: "Demo source for Amazon seller research.", createdAt: iso(20), updatedAt: iso(1) },
  { id: "src-shopify", name: "Shopify Brand Watchlist", baseUrl: "https://example-shopify-store.test", sourceType: "shopify", status: "ACTIVE", rateLimitSeconds: 15, robotsNote: "Check source permissions before scraping. Demo adapter uses mock data.", notes: "Demo Shopify competitor catalog.", createdAt: iso(14), updatedAt: iso(1) }
]

export const demoJobs: ScrapeJob[] = [
  { id: "job-amazon-serums", sourceId: "src-amazon", name: "Serum competitor watch", targetUrls: ["https://www.amazon.com/dp/demo-serum", "https://www.amazon.com/dp/demo-cream"], schedule: "manual", status: "ACTIVE", lastRunAt: iso(0), createdAt: iso(10), updatedAt: iso(0) },
  { id: "job-shopify-skincare", sourceId: "src-shopify", name: "Shopify skincare catalog", targetUrls: ["https://example-shopify-store.test/products/glow"], schedule: "weekly", status: "ACTIVE", lastRunAt: iso(1), createdAt: iso(9), updatedAt: iso(1) }
]

export const demoRuns: ScrapeRun[] = [
  { id: "run-1", jobId: "job-amazon-serums", sourceId: "src-amazon", status: "SUCCESS", startedAt: iso(0), finishedAt: iso(0), durationMs: 4200, productsFound: 4, productsCreated: 0, productsUpdated: 4, log: ["Fetched demo Amazon records", "No private data collected"], createdAt: iso(0) },
  { id: "run-2", jobId: "job-shopify-skincare", sourceId: "src-shopify", status: "PARTIAL", startedAt: iso(1), finishedAt: iso(1), durationMs: 6200, productsFound: 3, productsCreated: 0, productsUpdated: 2, errorMessage: "One demo URL returned a blocked/source-policy warning.", log: ["Fetched demo Shopify records", "Skipped blocked URL"], createdAt: iso(1) }
]

export const demoProducts: ProductRecord[] = [
  { id: "prod-1", sourceId: "src-amazon", externalId: "B0SERUM1", url: "https://www.amazon.com/dp/demo-serum", title: "Vitamin C Glow Serum", brand: "GlowLab", category: "Skincare", imageUrl: "https://example.com/serum.jpg", currency: "USD", currentPrice: 24.99, originalPrice: 34.99, discountAmount: 10, discountPercentage: 28.58, availability: "in_stock", rating: 4.6, reviewCount: 1820, sellerName: "GlowLab Official", lastSeenAt: iso(0), createdAt: iso(20), updatedAt: iso(0) },
  { id: "prod-2", sourceId: "src-amazon", externalId: "B0CREAM2", url: "https://www.amazon.com/dp/demo-cream", title: "Barrier Repair Cream", brand: "DermaNorth", category: "Skincare", imageUrl: "", currency: "USD", currentPrice: 31.5, originalPrice: 31.5, discountAmount: 0, discountPercentage: 0, availability: "out_of_stock", rating: 4.2, reviewCount: 940, sellerName: "DermaNorth", lastSeenAt: iso(0), createdAt: iso(18), updatedAt: iso(0) },
  { id: "prod-3", sourceId: "src-shopify", externalId: "shop-glow-mask", url: "https://example-shopify-store.test/products/glow-mask", title: "Overnight Glow Mask", brand: "LumaSkin", category: "Masks", imageUrl: "https://example.com/mask.jpg", currency: "USD", currentPrice: 18, originalPrice: 24, discountAmount: 6, discountPercentage: 25, availability: "in_stock", rating: 4.8, reviewCount: 310, sellerName: "LumaSkin", lastSeenAt: iso(1), createdAt: iso(12), updatedAt: iso(1) },
  { id: "prod-4", sourceId: "src-shopify", externalId: "shop-cleanser", url: "not-a-valid-url", title: "", brand: "LumaSkin", category: "", imageUrl: "", currency: "USD", currentPrice: undefined, originalPrice: undefined, availability: "unknown", rating: 3.9, reviewCount: 42, sellerName: "LumaSkin", lastSeenAt: iso(1), createdAt: iso(12), updatedAt: iso(1) }
]

export const demoSnapshots: ProductSnapshot[] = [
  { id: "snap-1a", productId: "prod-1", scrapeRunId: "run-1", price: 29.99, originalPrice: 34.99, currency: "USD", availability: "in_stock", rating: 4.5, reviewCount: 1760, capturedAt: iso(7) },
  { id: "snap-1b", productId: "prod-1", scrapeRunId: "run-1", price: 24.99, originalPrice: 34.99, currency: "USD", availability: "in_stock", rating: 4.6, reviewCount: 1820, capturedAt: iso(0) },
  { id: "snap-2a", productId: "prod-2", scrapeRunId: "run-1", price: 28, originalPrice: 31.5, currency: "USD", availability: "in_stock", rating: 4.1, reviewCount: 900, capturedAt: iso(7) },
  { id: "snap-2b", productId: "prod-2", scrapeRunId: "run-1", price: 31.5, originalPrice: 31.5, currency: "USD", availability: "out_of_stock", rating: 4.2, reviewCount: 940, capturedAt: iso(0) },
  { id: "snap-3a", productId: "prod-3", scrapeRunId: "run-2", price: 24, originalPrice: 24, currency: "USD", availability: "out_of_stock", rating: 4.7, reviewCount: 280, capturedAt: iso(8) },
  { id: "snap-3b", productId: "prod-3", scrapeRunId: "run-2", price: 18, originalPrice: 24, currency: "USD", availability: "in_stock", rating: 4.8, reviewCount: 310, capturedAt: iso(1) }
]
