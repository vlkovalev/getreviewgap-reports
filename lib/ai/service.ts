import { reviewInsightPrompt } from "./prompts"
import { ReviewInput, ReviewInsight, reviewInsightSchema } from "./schemas"

const demoReviews = [
  "Love the texture and the packaging feels premium, but the pump stopped working after two weeks.",
  "The product works well for sensitive skin. I wish the scent was lighter.",
  "Great results after a few days, but the bottle is smaller than expected for the price.",
  "Absorbs quickly and does not feel sticky. Shipping took longer than promised.",
  "I bought this after trying a competitor. This one feels cleaner, but I need clearer ingredient information.",
  "The cap leaks in my travel bag. Formula is good, packaging needs improvement.",
  "Nice glow without irritation. Would buy again if they offered a larger size.",
  "Marketing photos made it look bigger. Still a solid product, just expensive."
]

type ReviewSource = "canopy" | "apify" | "judgeme" | "pasted" | "demo"
type ReviewFetchResult = {
  reviews: string[]
  source: ReviewSource
  warning?: string
  productName?: string
  asin?: string
  pagesFetched?: number
  availableReviewCount?: number
  marketplaceRatingCount?: number
  sampleNote?: string
}

export async function fetchAmazonReviews(input: ReviewInput): Promise<ReviewFetchResult> {
  if (input.pastedReviews?.trim()) {
    return {
      reviews: input.pastedReviews.split(/\n+/).map((line) => line.trim()).filter(Boolean).slice(0, 500),
      source: "pasted"
    }
  }

  if (input.platform === "shopify") {
    if (input.reviewApp === "judgeme") return fetchJudgeMeReviews(input)
    throw new Error("Shopify reports need a review export for now. Upload a CSV/TXT file or paste review text from your review app, then generate the report.")
  }

  const canopyKey = cleanEnv(process.env.CANOPY_API_KEY)
  if (canopyKey) return fetchCanopyReviews(input, canopyKey)

  const apifyToken = cleanEnv(process.env.APIFY_TOKEN)
  const actorId = cleanEnv(process.env.APIFY_AMAZON_REVIEWS_ACTOR_ID)

  if (!apifyToken || !actorId) {
    return { reviews: demoReviews, source: "demo" }
  }

  const apiActorId = normalizeApifyActorId(actorId)
  let lastError = ""
  for (const actorInput of buildApifyInputs(input, actorId)) {
    const runResponse = await fetch(`https://api.apify.com/v2/acts/${apiActorId}/run-sync-get-dataset-items?token=${apifyToken}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(actorInput)
    })

    if (!runResponse.ok) {
      lastError = `${apifyStatusMessage(runResponse.status)} ${await apifyErrorDetail(runResponse, apifyToken)}`
      if (runResponse.status === 400) continue
      throw new Error(lastError.trim())
    }

    const items = await runResponse.json() as Array<Record<string, unknown>>
    const reviews = extractReviewTexts(items).slice(0, 500)

    return {
      reviews,
      source: "apify",
      warning: reviews.length ? undefined : `The configured Apify actor returned no review text from ${items.length} dataset item(s). Amazon can restrict access to review pages even when ratings are visible. Connect CANOPY_API_KEY for structured Amazon review retrieval, or import review text from an authorized export.`
    }
  }

  throw new Error(lastError.trim() || "Apify actor rejected the request input. Set APIFY_INPUT_TEMPLATE for your selected actor.")
}

async function fetchJudgeMeReviews(input: ReviewInput): Promise<ReviewFetchResult> {
  const apiToken = cleanEnv(process.env.JUDGEME_API_TOKEN)
  const shopDomain = cleanEnv(process.env.JUDGEME_SHOP_DOMAIN) || shopDomainFromUrl(input.productUrl)
  if (!apiToken || !shopDomain) {
    throw new Error("Judge.me direct collection is not configured yet. Add JUDGEME_API_TOKEN and JUDGEME_SHOP_DOMAIN in Vercel, or upload a Judge.me CSV/TXT export.")
  }

  const handle = shopifyProductHandle(input.productUrl)
  if (!handle) {
    throw new Error("Could not identify the Shopify product handle. Use a product URL like https://store.com/products/product-handle or upload a Judge.me export.")
  }

  const externalId = await fetchShopifyProductExternalId(input.productUrl)
  const product = await fetchJudgeMeProduct({ apiToken, shopDomain, externalId })
  const productId = product.id
  if (!productId) {
    throw new Error("Judge.me could not match that Shopify product ID. Check that JUDGEME_SHOP_DOMAIN belongs to the same Shopify store as the product URL, or upload a Judge.me export.")
  }

  const maxPages = canopyReviewPageLimit(input.reviewPageLimit)
  const reviews = new Set<string>()
  let pagesFetched = 0
  let availableReviewCount: number | undefined
  let previousPageAddedReviews = true

  while (pagesFetched < maxPages && previousPageAddedReviews && reviews.size < 500) {
    const params = new URLSearchParams({
      api_token: apiToken,
      shop_domain: shopDomain,
      product_id: String(productId),
      published: "true",
      per_page: "100",
      page: String(pagesFetched + 1)
    })
    const response = await fetch(`https://judge.me/api/v1/reviews?${params}`, { cache: "no-store" })
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) throw new Error("Judge.me authentication failed. Use the private API token and the exact myshopify.com shop domain shown in Judge.me Settings > Integrations.")
      throw new Error(`Judge.me review request failed with status ${response.status}.`)
    }
    const payload = await response.json() as Record<string, unknown>
    const pageReviews = judgeMeReviewTexts(payload)
    const previousCount = reviews.size
    for (const text of pageReviews) reviews.add(text)
    availableReviewCount ||= judgeMeReviewCount(payload)
    pagesFetched += 1
    previousPageAddedReviews = pageReviews.length > 0 && reviews.size > previousCount && pageReviews.length >= 100
  }

  const collectedReviews = [...reviews].slice(0, 500)
  return {
    reviews: collectedReviews,
    source: "judgeme",
    productName: product.title || input.productName || `Shopify product ${handle}`,
    pagesFetched,
    availableReviewCount,
    sampleNote: `Judge.me returned ${collectedReviews.length} published written review text${collectedReviews.length === 1 ? "" : "s"} after checking ${pagesFetched} page${pagesFetched === 1 ? "" : "s"}.`,
    warning: collectedReviews.length ? undefined : "Judge.me returned no published review text for this product. Upload a Judge.me export or verify the product handle."
  }
}

async function fetchJudgeMeProduct({ apiToken, shopDomain, externalId }: { apiToken: string; shopDomain: string; externalId: string }) {
  const params = new URLSearchParams({
    api_token: apiToken,
    shop_domain: shopDomain,
    external_id: externalId
  })
  const response = await fetch(`https://judge.me/api/v1/products/-1?${params}`, { cache: "no-store" })
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new Error("Judge.me authentication failed. Use the private API token and the exact myshopify.com shop domain shown in Judge.me Settings > Integrations.")
    throw new Error(`Judge.me product lookup failed with status ${response.status}.`)
  }
  const payload = await response.json() as Record<string, unknown>
  const product = payload.product && typeof payload.product === "object" && !Array.isArray(payload.product)
    ? payload.product as Record<string, unknown>
    : {}
  return {
    id: typeof product.id === "number" || typeof product.id === "string" ? product.id : undefined,
    title: typeof product.title === "string" ? product.title.trim() : undefined
  }
}

async function fetchShopifyProductExternalId(productUrl: string) {
  const productJsonUrl = shopifyProductJsonUrl(productUrl)
  const response = await fetch(productJsonUrl, { cache: "no-store" })
  if (!response.ok) {
    throw new Error("Could not read the Shopify product JSON needed for Judge.me matching. Check that the product URL is public, or upload a Judge.me export.")
  }
  const payload = await response.json() as Record<string, unknown>
  const product = payload.product && typeof payload.product === "object" && !Array.isArray(payload.product)
    ? payload.product as Record<string, unknown>
    : payload
  const id = product.id
  if (typeof id !== "number" && typeof id !== "string") {
    throw new Error("The Shopify product JSON did not include a product ID. Upload a Judge.me export instead.")
  }
  return String(id)
}

function shopifyProductJsonUrl(productUrl: string) {
  const parsed = new URL(productUrl)
  parsed.search = ""
  parsed.hash = ""
  if (!parsed.pathname.endsWith(".js")) parsed.pathname = `${parsed.pathname.replace(/\/$/, "")}.js`
  return parsed.toString()
}

function judgeMeReviewTexts(payload: Record<string, unknown>) {
  const reviews = Array.isArray(payload.reviews) ? payload.reviews : []
  return reviews.flatMap((review) => {
    if (!review || typeof review !== "object" || Array.isArray(review)) return []
    const row = review as Record<string, unknown>
    const title = typeof row.title === "string" ? row.title.trim() : ""
    const body = typeof row.body === "string" ? row.body.trim() : ""
    const rating = typeof row.rating === "number" || typeof row.rating === "string" ? `Rating: ${row.rating}.` : ""
    const text = [rating, title, body].filter(Boolean).join(" ").replace(/\s+/g, " ").trim()
    return text.length >= 20 ? [text] : []
  })
}

function judgeMeReviewCount(payload: Record<string, unknown>) {
  const count = payload.count ?? payload.total_count ?? payload.total
  return typeof count === "number" ? count : undefined
}

async function fetchCanopyReviews(input: ReviewInput, apiKey: string): Promise<ReviewFetchResult> {
  const asin = extractAmazonAsin(input.productUrl)
  if (!asin) throw new Error("Could not identify an Amazon ASIN in this URL. Use a product URL containing /dp/ASIN.")
  const maxPages = canopyReviewPageLimit(input.reviewPageLimit)
  const reviews = new Set<string>()
  let pagesFetched = 0
  let availableReviewCount: number | undefined
  let marketplaceRatingCount: number | undefined
  let productName: string | undefined
  let emptyPages = 0

  while (pagesFetched < maxPages && emptyPages < 3) {
    const params = new URLSearchParams({
      asin,
      domain: amazonMarketplaceCode(input.productUrl),
      page: String(pagesFetched + 1),
      rating: "ALL"
    })
    let response: Response
    try {
      response = await fetch(`https://rest.canopyapi.co/api/amazon/product/reviews?${params}`, {
        headers: { "API-KEY": apiKey },
        cache: "no-store"
      })
    } catch {
      throw new Error("Could not connect to the Amazon reviews provider. Please retry shortly; your credit has been returned.")
    }
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) throw new Error("Canopy authentication failed. Check CANOPY_API_KEY in Vercel.")
      throw new Error(`Canopy review request failed with status ${response.status}.`)
    }
    const payload = await response.json() as Record<string, unknown>
    const product = canopyProduct(payload)
    const pageInfo = canopyPageInfo(product)
    productName ||= canopyProductTitle(product) || canopyProductTitle(payload)
    availableReviewCount ||= typeof pageInfo?.totalResults === "number" ? pageInfo.totalResults : undefined
    marketplaceRatingCount ||= canopyMarketplaceRatingCount(product) ?? canopyMarketplaceRatingCount(payload)
    const pageReviews = canopyPaginatedReviewTexts(product)
    const usableReviews = pageReviews.length ? pageReviews : extractReviewTexts([payload])
    const previousCount = reviews.size
    for (const text of usableReviews) reviews.add(text)
    pagesFetched += 1
    const addedNewReviews = usableReviews.length > 0 && reviews.size > previousCount
    emptyPages = addedNewReviews ? 0 : emptyPages + 1
  }

  const collectedReviews = [...reviews].slice(0, 500)
  if (!productName || productName.toLowerCase().startsWith("amazon product") || !marketplaceRatingCount) {
    const productMetadata = await fetchCanopyProductMetadata(input, apiKey, asin).catch(() => undefined)
    productName = productMetadata?.title || productName
    marketplaceRatingCount ||= productMetadata?.marketplaceRatingCount
  }
  const sampleNote = amazonSampleNote({ writtenReviews: collectedReviews.length, pagesFetched, requestedPages: maxPages, availableReviewCount, marketplaceRatingCount, stoppedAfterEmptyPages: emptyPages >= 3 })
  return {
    reviews: collectedReviews,
    source: "canopy",
    productName,
    asin,
    pagesFetched,
    availableReviewCount,
    marketplaceRatingCount,
    sampleNote,
    warning: collectedReviews.length ? undefined : "Canopy returned no review text for this product and marketplace. Try an authorized review export or a different product."
  }
}

async function fetchCanopyProductMetadata(input: ReviewInput, apiKey: string, asin: string) {
  const params = new URLSearchParams({
    asin,
    domain: amazonMarketplaceCode(input.productUrl)
  })
  const response = await fetch(`https://rest.canopyapi.co/api/amazon/product?${params}`, {
    headers: { "API-KEY": apiKey, Accept: "application/json" },
    cache: "no-store"
  })
  if (!response.ok) return undefined
  const payload = await response.json() as Record<string, unknown>
  const product = canopyProduct(payload)
  return {
    title: canopyProductTitle(product) || canopyProductTitle(payload),
    marketplaceRatingCount: canopyMarketplaceRatingCount(product) ?? canopyMarketplaceRatingCount(payload)
  }
}

function amazonSampleNote({
  writtenReviews,
  pagesFetched,
  requestedPages,
  availableReviewCount,
  marketplaceRatingCount,
  stoppedAfterEmptyPages
}: {
  writtenReviews: number
  pagesFetched: number
  requestedPages: number
  availableReviewCount?: number
  marketplaceRatingCount?: number
  stoppedAfterEmptyPages?: boolean
}) {
  const pageText = `${pagesFetched} of ${requestedPages} requested page${requestedPages === 1 ? "" : "s"}`
  const stopText = stoppedAfterEmptyPages ? " The scan stopped after 3 consecutive pages returned no new written review text." : ""
  if (marketplaceRatingCount && marketplaceRatingCount > writtenReviews) {
    return `Amazon may show ${marketplaceRatingCount.toLocaleString("en-US")} ratings for this listing, but the provider returned ${writtenReviews} unique written review text${writtenReviews === 1 ? "" : "s"} after checking ${pageText}. Ratings and written review text are different data sets.${stopText}`
  }
  if (availableReviewCount && availableReviewCount > writtenReviews) {
    return `The provider found ${availableReviewCount.toLocaleString("en-US")} available review record${availableReviewCount === 1 ? "" : "s"} and returned ${writtenReviews} unique written review text${writtenReviews === 1 ? "" : "s"} after checking ${pageText}.${stopText}`
  }
  return `The provider returned ${writtenReviews} unique written review text${writtenReviews === 1 ? "" : "s"} after checking ${pageText}. Amazon star ratings can be much higher than retrievable written review text.${stopText}`
}

function canopyReviewPageLimit(requestedLimit?: number) {
  const configured = Number(requestedLimit ?? process.env.CANOPY_REVIEW_PAGE_LIMIT ?? 50)
  return Number.isFinite(configured) ? Math.max(1, Math.min(50, Math.floor(configured))) : 50
}

function canopyProduct(payload: Record<string, unknown>) {
  const data = payload.data
  if (!data || typeof data !== "object" || Array.isArray(data)) return undefined
  const product = (data as Record<string, unknown>).amazonProduct
  return product && typeof product === "object" && !Array.isArray(product) ? product as Record<string, unknown> : undefined
}

function canopyPageInfo(product: Record<string, unknown> | undefined) {
  const pagination = product?.reviewsPaginated
  if (!pagination || typeof pagination !== "object" || Array.isArray(pagination)) return undefined
  const info = (pagination as Record<string, unknown>).pageInfo
  return info && typeof info === "object" && !Array.isArray(info) ? info as Record<string, unknown> : undefined
}

function canopyProductTitle(value: unknown): string | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined
  const record = value as Record<string, unknown>
  for (const key of ["title", "productTitle", "name"]) {
    const item = record[key]
    if (typeof item === "string" && item.trim()) return item.trim()
  }
  for (const key of ["amazonProduct", "product", "data"]) {
    const nested = record[key]
    const title = canopyProductTitle(nested)
    if (title) return title
  }
  return undefined
}

function canopyMarketplaceRatingCount(value: unknown): number | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined
  const record = value as Record<string, unknown>
  for (const key of ["ratingCount", "ratingsCount", "totalRatings", "ratingsTotal", "reviewCount", "reviewsCount", "totalReviews"]) {
    const parsed = parseCount(record[key])
    if (parsed) return parsed
  }
  for (const key of ["rating", "ratings", "reviews", "reviewSummary", "aggregateRating", "amazonProduct", "product", "data"]) {
    const nested = canopyMarketplaceRatingCount(record[key])
    if (nested) return nested
  }
  return undefined
}

function parseCount(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return Math.floor(value)
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d]/g, ""))
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
  }
  return undefined
}

function canopyPaginatedReviewTexts(product: Record<string, unknown> | undefined) {
  const pagination = product?.reviewsPaginated
  if (!pagination || typeof pagination !== "object" || Array.isArray(pagination)) return []
  const rows = (pagination as Record<string, unknown>).reviews
  if (!Array.isArray(rows)) return []
  return rows.flatMap((row) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) return []
    const body = (row as Record<string, unknown>).body
    return typeof body === "string" && body.trim().length >= 20 ? [body.replace(/\s+/g, " ").trim()] : []
  })
}

function buildApifyInputs(input: ReviewInput, actorId: string) {
  const asin = extractAmazonAsin(input.productUrl)
  if (actorId.toLowerCase().includes("junipr/amazon-reviews-scraper") && asin) {
    return [{
      asins: [asin],
      marketplace: amazonMarketplaceCode(input.productUrl),
      maxReviews: 100,
      filterRating: "all",
      sortBy: "recent",
      includeImages: false,
      includeProductInfo: true
    }]
  }

  if (process.env.APIFY_INPUT_TEMPLATE) {
    try {
      const template = JSON.parse(process.env.APIFY_INPUT_TEMPLATE) as Record<string, unknown>
      return [replaceTemplateValues(template, input.productUrl)]
    } catch {
      return [{ productUrl: input.productUrl, maxItems: 500 }]
    }
  }

  const common = { maxItems: 500, maxReviews: 500, reviewsCount: 500, proxyConfiguration: { useApifyProxy: true } }
  const reviewCommon = { scrapeMode: "AUTO", sortReview: "Most recent", maxReviewResults: 500, additionalReviewProperties: true, proxyConfiguration: { useApifyProxy: true } }
  const inputs: Array<Record<string, unknown> | null> = [
    { reviewDetailsUrls: [input.productUrl], ...reviewCommon },
    { reviewDetailsUrls: [{ url: input.productUrl }], ...reviewCommon },
    { reviewListingUrls: [input.productUrl], ...reviewCommon },
    { reviewListingUrls: [{ url: input.productUrl }], ...reviewCommon },
    asin ? { keywordReviews: asin, marketplacesReviews: ["Amazon"], ...reviewCommon } : null,
    { startUrls: [{ url: input.productUrl }], ...common },
    { startUrls: [input.productUrl], ...common },
    { productUrls: [input.productUrl], ...common },
    { productUrls: [{ url: input.productUrl }], ...common },
    { productURLs: [input.productUrl], ...common },
    { urls: [input.productUrl], ...common },
    { urls: [{ url: input.productUrl }], ...common },
    { reviewUrls: [input.productUrl], ...common },
    { searchUrls: [input.productUrl], ...common },
    { products: [input.productUrl], ...common },
    { url: input.productUrl, ...common },
    { productUrl: input.productUrl, ...common },
    { productURL: input.productUrl, ...common },
    { input: input.productUrl, ...common },
    { input: [input.productUrl], ...common },
    asin ? { asins: [asin], ...common } : null,
    asin ? { asinList: [asin], ...common } : null,
    asin ? { productAsins: [asin], ...common } : null,
    asin ? { asin, ...common } : null,
    asin ? { input: asin, ...common } : null
  ]
  return inputs.filter((item): item is Record<string, unknown> => Boolean(item))
}

function replaceTemplateValues(value: unknown, productUrl: string): unknown {
  if (typeof value === "string") return value.replaceAll("{{PRODUCT_URL}}", productUrl)
  if (Array.isArray(value)) return value.map((item) => replaceTemplateValues(item, productUrl))
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replaceTemplateValues(item, productUrl)]))
  }
  return value
}

function cleanEnv(value: string | undefined) {
  return value?.trim().replace(/^["']|["']$/g, "")
}

function shopDomainFromUrl(url: string) {
  try {
    const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, "")
    return hostname.endsWith(".myshopify.com") ? hostname : ""
  } catch {
    return ""
  }
}

function shopifyProductHandle(url: string) {
  try {
    const parsed = new URL(url)
    const parts = parsed.pathname.split("/").filter(Boolean)
    const productsIndex = parts.findIndex((part) => part === "products")
    return productsIndex >= 0 ? parts[productsIndex + 1] : ""
  } catch {
    return ""
  }
}

function normalizeApifyActorId(actorId: string) {
  return encodeURIComponent(actorId.replace("/", "~"))
}

function apifyStatusMessage(status: number) {
  if (status === 400) return "Apify actor could not complete the run."
  if (status === 401) return "Apify authentication failed. Check APIFY_TOKEN in Vercel and local .env."
  if (status === 403) return "Apify access denied. Check that your token can run the selected Amazon reviews actor."
  if (status === 404) return "Apify actor not found. Check APIFY_AMAZON_REVIEWS_ACTOR_ID and use the actor's exact id."
  if (status === 429) return "Apify rate limit reached. Try again later or increase Apify capacity."
  return `Apify request failed with status ${status}`
}

async function apifyErrorDetail(response: Response, token: string) {
  const text = await response.text().catch(() => "")
  if (!text) return ""
  const runId = text.match(/run ID:\s*([A-Za-z0-9_-]+)/i)?.[1]
  const logTail = runId ? await apifyRunLogTail(runId, token) : ""
  try {
    const data = JSON.parse(text) as { error?: { message?: string }; message?: string }
    return `${data.error?.message || data.message || ""}${logTail ? ` Log tail: ${logTail}` : ""}`.slice(0, 2000)
  } catch {
    return `${text}${logTail ? ` Log tail: ${logTail}` : ""}`.slice(0, 2000)
  }
}

function extractAmazonAsin(url: string) {
  return url.match(/\/(?:dp|gp\/product|product)\/([A-Z0-9]{10})/i)?.[1]?.toUpperCase()
}

function amazonMarketplaceCode(url: string) {
  const hostname = new URL(url).hostname.toLowerCase()
  if (hostname.endsWith(".ca")) return "CA"
  if (hostname.endsWith(".co.uk")) return "UK"
  if (hostname.endsWith(".de")) return "DE"
  if (hostname.endsWith(".fr")) return "FR"
  if (hostname.endsWith(".it")) return "IT"
  if (hostname.endsWith(".es")) return "ES"
  if (hostname.endsWith(".com.au")) return "AU"
  if (hostname.endsWith(".co.jp")) return "JP"
  if (hostname.endsWith(".in")) return "IN"
  if (hostname.endsWith(".com.br")) return "BR"
  if (hostname.endsWith(".com.mx")) return "MX"
  return "US"
}

export function amazonMarketplaceLabel(url: string) {
  return new URL(url).hostname.toLowerCase().replace(/^www\./, "")
}

export function canonicalAmazonProductUrl(url: string) {
  const parsed = new URL(url)
  const asin = extractAmazonAsin(url)
  return asin ? `${parsed.protocol}//${parsed.hostname}/dp/${asin}` : url
}

function extractReviewTexts(items: Array<Record<string, unknown>>) {
  const texts = new Set<string>()
  for (const item of items) collectReviewTexts(item, texts)
  return [...texts]
    .map((text) => text.replace(/\s+/g, " ").trim())
    .filter((text) => text.length >= 20)
}

function collectReviewTexts(value: unknown, texts: Set<string>, key = "") {
  if (typeof value === "string") {
    const normalizedKey = key.toLowerCase()
    const looksLikeReviewField = [
      "reviewtext",
      "review_text",
      "review",
      "comment",
      "body",
      "content",
      "text",
      "description"
    ].some((field) => normalizedKey.includes(field))
    if (looksLikeReviewField) texts.add(value)
    return
  }

  if (Array.isArray(value)) {
    for (const item of value) collectReviewTexts(item, texts, key)
    return
  }

  if (value && typeof value === "object") {
    for (const [childKey, childValue] of Object.entries(value)) {
      collectReviewTexts(childValue, texts, childKey)
    }
  }
}

async function apifyRunLogTail(runId: string, token: string) {
  const response = await fetch(`https://api.apify.com/v2/logs/${runId}?token=${token}`).catch(() => null)
  if (!response?.ok) return ""
  const log = await response.text().catch(() => "")
  return log
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(-16)
    .join(" | ")
    .replace(/[A-Za-z0-9_-]{32,}/g, "[redacted]")
    .slice(0, 1400)
}

export async function generateReviewInsight(input: ReviewInput, reviews: string[]): Promise<{ insight: ReviewInsight; provider: string; model: string }> {
  if (!process.env.OPENAI_API_KEY) {
    return { insight: generateDemoInsight(input, reviews), provider: "demo", model: "local-demo" }
  }

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini"
  const prompt = reviewInsightPrompt(input, reviews)
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: `${prompt.role}\nObjective: ${prompt.objective}\nQuality rules: ${prompt.qualityRules.join(" ")}` },
        { role: "user", content: JSON.stringify(prompt) }
      ]
    })
  })

  if (!response.ok) {
    throw new Error(`OpenAI request failed with status ${response.status}`)
  }

  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> }
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error("OpenAI returned an empty response")

  return { insight: reviewInsightSchema.parse(JSON.parse(content)), provider: "openai", model }
}

function generateDemoInsight(input: ReviewInput, reviews: string[]): ReviewInsight {
  return {
    executiveSummary: `${input.productName || "This competitor product"} appears to win on perceived formula quality, but customers repeatedly mention packaging reliability, size/value mismatch, and unclear expectations. The fastest opportunity is to position against those gaps with clearer product education and stronger packaging claims.`,
    topComplaints: [
      { theme: "Packaging reliability", evidence: "Customers mention broken pumps, leaking caps, and travel mess.", severity: "high", productImplication: "Use sturdier packaging and make leak-proof design a visible proof point." },
      { theme: "Value perception", evidence: "Several reviews say the bottle is smaller or more expensive than expected.", severity: "medium", productImplication: "Clarify size, usage duration, and cost-per-use before purchase." },
      { theme: "Scent and ingredient clarity", evidence: "Buyers want lighter scent and clearer ingredient information.", severity: "medium", productImplication: "Make sensitive-skin and ingredient transparency central to the product page." }
    ],
    topCompliments: [
      { theme: "Texture", evidence: "Reviews praise quick absorption and non-sticky feel.", marketingImplication: "Lead with sensory claims like fast-absorbing and lightweight." },
      { theme: "Sensitive skin fit", evidence: "Customers mention no irritation and good results.", marketingImplication: "Use gentle-performance messaging for cautious buyers." }
    ],
    buyerLanguage: ["absorbs quickly", "does not feel sticky", "smaller than expected", "packaging needs improvement", "nice glow without irritation"],
    productImprovementIdeas: [
      { idea: "Upgrade pump and cap durability", whyItMatters: "Packaging complaints can destroy repeat purchase even when formula sentiment is positive.", confidence: "high" },
      { idea: "Add larger size or clearer size education", whyItMatters: "Value objections are easier to address before purchase than after disappointment.", confidence: "medium" },
      { idea: "Publish a plain-English ingredient explainer", whyItMatters: "Transparency can convert cautious buyers comparing alternatives.", confidence: "medium" }
    ],
    adHooks: ["The glow serum that feels light, not sticky.", "Premium formula, travel-proof packaging.", "Sensitive-skin glow without the guesswork."],
    positioningAngles: ["Better packaging than competitor", "Transparent ingredients", "Lightweight daily-use formula"],
    assumptions: ["Demo mode used because OpenAI or Apify keys are not configured.", "Insights are based on sample review patterns, not live Amazon data."],
    dataQuality: {
      reviewCount: reviews.length,
      limitations: ["Live scraping is disabled until APIFY_TOKEN and APIFY_AMAZON_REVIEWS_ACTOR_ID are configured."]
    }
  }
}
