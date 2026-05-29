import { reviewInsightPrompt } from "./prompts"
import { ReviewInput, ReviewInsight, reviewInsightSchema } from "./schemas"
import { extractReviewsFromCsv } from "@/lib/scrapers/shopify-csv-parser"

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

type ReviewSource = "canopy" | "canopy+serpapi" | "canopy+serpapi+yepapi" | "canopy+yepapi" | "serpapi" | "serpapi+yepapi" | "yepapi" | "apify" | "judgeme" | "stamped" | "pasted" | "demo"
type ReviewFetchResult = {
  reviews: string[]
  source: ReviewSource
  warning?: string
  productName?: string
  asin?: string
  pagesFetched?: number
  availableReviewCount?: number
  marketplaceRatingCount?: number
  basePagesFetched?: number
  ratingFilterPagesFetched?: number
  ratingFiltersUsed?: string[]
  fallbackReviewsAdded?: number
  yepApiReviewsAdded?: number
  yepApiPagesFetched?: number
  targetReviewCount?: number
  sampleNote?: string
}

export async function fetchAmazonReviews(input: ReviewInput): Promise<ReviewFetchResult> {
  if (input.pastedReviews?.trim()) {
    return {
      reviews: extractReviewsFromCsv(input.pastedReviews),
      source: "pasted"
    }
  }

  if (input.platform === "shopify") {
    const shopDomain = shopDomainFromUrl(input.productUrl) || new URL(input.productUrl).hostname.replace(/^www\./, "")
    const handle = shopifyProductHandle(input.productUrl)

    if (input.reviewApp === "judgeme") {
      return fetchJudgeMeReviews(input)
    }

    if (input.reviewApp === "stamped" && shopDomain) {
      return fetchStampedPublicReviews(input, shopDomain)
    }

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
  const shopDomain = cleanEnv(process.env.JUDGEME_SHOP_DOMAIN) || shopDomainFromUrl(input.productUrl) || new URL(input.productUrl).hostname.replace(/^www\./, "")
  const handle = shopifyProductHandle(input.productUrl)

  if (!handle) {
    throw new Error("Could not identify the Shopify product handle. Use a product URL like https://store.com/products/product-handle or upload a Judge.me export.")
  }

  if (!apiToken) {
    if (shopDomain && handle) {
      return fetchJudgeMePublicReviews(input, shopDomain, handle)
    }
    throw new Error("Judge.me direct collection is not configured yet. Add JUDGEME_API_TOKEN and JUDGEME_SHOP_DOMAIN in Vercel, or upload a Judge.me CSV/TXT export.")
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
  const productAsin = asin
  const maxPages = canopyReviewPageLimit(input.reviewPageLimit)
  const targetReviews = canopyTargetReviewCount(maxPages)
  const reviews = new Set<string>()
  let pagesFetched = 0
  let basePagesFetched = 0
  let ratingFilterPagesFetched = 0
  const ratingFiltersUsed = new Set<string>()
  let availableReviewCount: number | undefined
  let marketplaceRatingCount: number | undefined
  let productName: string | undefined
  let canopyWarning = ""

  async function fetchReviewPage(rating: string, page: number) {
    const params = new URLSearchParams({
      asin: productAsin,
      domain: amazonMarketplaceCode(input.productUrl),
      page: String(page),
      rating
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
      if (response.status === 402) throw new CanopyProviderUnavailableError("Canopy returned 402, which usually means quota, billing, or plan limits. SerpApi fallback will be used if configured.")
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
    if (rating === "ALL") basePagesFetched += 1
    else {
      ratingFilterPagesFetched += 1
      ratingFiltersUsed.add(rating)
    }
    return reviews.size - previousCount
  }

  try {
    for (let page = 1; page <= maxPages; page += 1) {
      await fetchReviewPage("ALL", page)
    }

    if (reviews.size < targetReviews) {
      const expansionPages = canopyRatingExpansionPages(maxPages)
      for (const rating of ["FIVE_STAR", "FOUR_STAR", "THREE_STAR", "TWO_STAR", "ONE_STAR"]) {
        if (reviews.size >= targetReviews) break
        for (let page = 1; page <= expansionPages; page += 1) {
          await fetchReviewPage(rating, page)
          if (reviews.size >= targetReviews) break
        }
      }
    }
  } catch (error) {
    if (!(error instanceof CanopyProviderUnavailableError)) throw error
    canopyWarning = error.message
  }

  const collectedReviews = [...reviews].slice(0, 500)
  let fallbackReviewsAdded = 0
  let yepApiReviewsAdded = 0
  let yepApiPagesFetched = 0
  const sourceParts = new Set<string>()
  if (collectedReviews.length) sourceParts.add("canopy")
  if (collectedReviews.length < targetReviews || canopyWarning) {
    const serpApiResult = await fetchSerpApiAmazonReviews(input, asin).catch(() => undefined)
    if (serpApiResult?.reviews.length) {
      const beforeFallback = reviews.size
      for (const text of serpApiResult.reviews) reviews.add(text)
      fallbackReviewsAdded = reviews.size - beforeFallback
      if (fallbackReviewsAdded > 0) sourceParts.add("serpapi")
      productName = productName || serpApiResult.productName
      marketplaceRatingCount ||= serpApiResult.marketplaceRatingCount
    }
  }
  if (reviews.size < targetReviews) {
    const serpApiPagedResult = await fetchSerpApiAmazonReviewPages(input, asin, targetReviews - reviews.size).catch(() => undefined)
    if (serpApiPagedResult?.reviews.length) {
      const beforePagedFallback = reviews.size
      for (const text of serpApiPagedResult.reviews) reviews.add(text)
      const pagedReviewsAdded = reviews.size - beforePagedFallback
      fallbackReviewsAdded += pagedReviewsAdded
      if (pagedReviewsAdded > 0) sourceParts.add("serpapi")
      productName = productName || serpApiPagedResult.productName
      marketplaceRatingCount ||= serpApiPagedResult.marketplaceRatingCount
    }
  }
  if (reviews.size < targetReviews) {
    const yepApiResult = await fetchYepApiAmazonReviews(input, asin, targetReviews - reviews.size).catch(() => undefined)
    if (yepApiResult?.reviews.length) {
      const beforeYepApi = reviews.size
      for (const text of yepApiResult.reviews) reviews.add(text)
      yepApiReviewsAdded = reviews.size - beforeYepApi
      yepApiPagesFetched = yepApiResult.pagesFetched
      if (yepApiReviewsAdded > 0) sourceParts.add("yepapi")
      productName = productName || yepApiResult.productName
      marketplaceRatingCount ||= yepApiResult.marketplaceRatingCount
    }
  }
  const finalReviews = [...reviews].slice(0, 500)
  const source = (sourceParts.size ? [...sourceParts].join("+") : "canopy") as ReviewSource
  if (!productName || productName.toLowerCase().startsWith("amazon product") || !marketplaceRatingCount) {
    const productMetadata = await fetchCanopyProductMetadata(input, apiKey, asin).catch(() => undefined)
    productName = productMetadata?.title || productName
    marketplaceRatingCount ||= productMetadata?.marketplaceRatingCount
  }
  const sampleNote = amazonSampleNote({ writtenReviews: finalReviews.length, pagesFetched, requestedPages: maxPages, targetReviewCount: targetReviews, availableReviewCount, marketplaceRatingCount, basePagesFetched, ratingFilterPagesFetched, ratingFiltersUsed: [...ratingFiltersUsed], fallbackReviewsAdded, yepApiReviewsAdded, yepApiPagesFetched })
  return {
    reviews: finalReviews,
    source,
    productName,
    asin,
    pagesFetched,
    availableReviewCount,
    marketplaceRatingCount,
    basePagesFetched,
    ratingFilterPagesFetched,
    ratingFiltersUsed: [...ratingFiltersUsed],
    fallbackReviewsAdded,
    yepApiReviewsAdded,
    yepApiPagesFetched,
    targetReviewCount: targetReviews,
    sampleNote,
    warning: finalReviews.length ? canopyWarning || undefined : canopyWarning || "The configured Amazon review providers returned no review text for this product and marketplace. Try an authorized review export or a different product."
  }
}

class CanopyProviderUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "CanopyProviderUnavailableError"
  }
}

async function fetchSerpApiAmazonReviews(input: ReviewInput, asin: string): Promise<{ reviews: string[]; productName?: string; marketplaceRatingCount?: number }> {
  const apiKey = cleanEnv(process.env.SERPAPI_API_KEY)
  if (!apiKey) return { reviews: [] }
  const params = new URLSearchParams({
    engine: "amazon_product",
    amazon_domain: amazonMarketplaceDomain(input.productUrl),
    asin,
    api_key: apiKey
  })
  const response = await fetch(`https://serpapi.com/search.json?${params}`, { cache: "no-store" })
  if (!response.ok) return { reviews: [] }
  const payload = await response.json() as Record<string, unknown>
  const info = payload.reviews_information && typeof payload.reviews_information === "object" && !Array.isArray(payload.reviews_information)
    ? payload.reviews_information as Record<string, unknown>
    : {}
  return {
    reviews: extractSerpApiReviewTexts(info),
    productName: serpApiProductTitle(payload),
    marketplaceRatingCount: canopyMarketplaceRatingCount(info) ?? canopyMarketplaceRatingCount(payload)
  }
}

async function fetchSerpApiAmazonReviewPages(input: ReviewInput, asin: string, neededReviews: number): Promise<{ reviews: string[]; productName?: string; marketplaceRatingCount?: number }> {
  const apiKey = cleanEnv(process.env.SERPAPI_API_KEY)
  if (!apiKey || neededReviews <= 0) return { reviews: [] }
  const reviews = new Set<string>()
  let productName: string | undefined
  let marketplaceRatingCount: number | undefined
  const maxPages = Math.min(20, Math.ceil(neededReviews / 10) + 4)
  for (let page = 1; page <= maxPages && reviews.size < neededReviews; page += 1) {
    const params = new URLSearchParams({
      engine: "amazon_reviews",
      amazon_domain: amazonMarketplaceDomain(input.productUrl),
      asin,
      page: String(page),
      api_key: apiKey
    })
    const response = await fetch(`https://serpapi.com/search.json?${params}`, { cache: "no-store" })
    if (!response.ok) break
    const payload = await response.json() as Record<string, unknown>
    productName ||= serpApiProductTitle(payload)
    marketplaceRatingCount ||= canopyMarketplaceRatingCount(payload)
    const pageReviews = extractSerpApiPagedReviewTexts(payload)
    if (!pageReviews.length) break
    const previousCount = reviews.size
    for (const text of pageReviews) reviews.add(text)
    if (reviews.size === previousCount) break
  }
  return { reviews: [...reviews], productName, marketplaceRatingCount }
}

function extractSerpApiPagedReviewTexts(payload: Record<string, unknown>) {
  const reviewArrays = [
    ...findArraysByKey(payload, "reviews"),
    ...findArraysByKey(payload, "customer_reviews"),
    ...findArraysByKey(payload, "top_reviews")
  ].flat()
  const texts = new Set<string>()
  for (const review of reviewArrays) collectReviewTexts(review, texts)
  collectSerpApiTextFields({ reviews: reviewArrays }, texts)
  return [...texts].map((text) => text.replace(/\s+/g, " ").trim()).filter((text) => text.length >= 20).slice(0, 300)
}

function extractSerpApiReviewTexts(info: Record<string, unknown>) {
  const texts = new Set<string>()
  collectReviewTexts(info, texts)
  collectSerpApiTextFields(info, texts)
  const insights = Array.isArray(info.insights) ? info.insights : []
  for (const insight of insights) {
    collectReviewTexts(insight, texts)
    collectSerpApiTextFields(insight, texts)
  }
  return [...texts].map((text) => text.replace(/\s+/g, " ").trim()).filter((text) => text.length >= 20).slice(0, 200)
}

function collectSerpApiTextFields(value: unknown, texts: Set<string>) {
  if (Array.isArray(value)) {
    for (const item of value) collectSerpApiTextFields(item, texts)
    return
  }
  if (!value || typeof value !== "object") return
  for (const [key, child] of Object.entries(value)) {
    if (typeof child === "string" && ["snippet", "summary", "text", "review"].some((field) => key.toLowerCase().includes(field))) {
      texts.add(child)
    }
    collectSerpApiTextFields(child, texts)
  }
}

function serpApiProductTitle(payload: Record<string, unknown>) {
  const product = payload.product_results
  if (product && typeof product === "object" && !Array.isArray(product)) {
    const title = (product as Record<string, unknown>).title
    if (typeof title === "string" && title.trim()) return title.trim()
  }
  return canopyProductTitle(payload)
}

async function fetchYepApiAmazonReviews(input: ReviewInput, asin: string, neededReviews: number): Promise<{ reviews: string[]; productName?: string; marketplaceRatingCount?: number; pagesFetched: number }> {
  const apiKey = cleanEnv(process.env.YEPAPI_API_KEY)
  if (!apiKey || neededReviews <= 0) return { reviews: [], pagesFetched: 0 }
  const reviews = new Set<string>()
  let marketplaceRatingCount: number | undefined
  let productName: string | undefined
  let pagesFetched = 0
  const maxPages = Math.min(25, Math.ceil(neededReviews / 7) + 4)
  for (let page = 1; page <= maxPages && reviews.size < neededReviews; page += 1) {
    const response = await fetch("https://api.yepapi.com/v1/amazon/product-reviews", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        asin,
        country: amazonMarketplaceCountry(input.productUrl),
        sort_by: "TOP_REVIEWS",
        page
      }),
      cache: "no-store"
    })
    if (!response.ok) break
    const payload = await response.json() as Record<string, unknown>
    pagesFetched += 1
    marketplaceRatingCount ||= canopyMarketplaceRatingCount(payload)
    productName ||= canopyProductTitle(payload)
    const pageReviews = extractYepApiReviewTexts(payload)
    if (!pageReviews.length) break
    const previousCount = reviews.size
    for (const text of pageReviews) reviews.add(text)
    if (reviews.size === previousCount) break
  }
  return { reviews: [...reviews], productName, marketplaceRatingCount, pagesFetched }
}

function extractYepApiReviewTexts(payload: Record<string, unknown>) {
  const reviews = findArraysByKey(payload, "reviews").flat()
  return reviews.flatMap((review) => {
    if (!review || typeof review !== "object" || Array.isArray(review)) return []
    const row = review as Record<string, unknown>
    const title = typeof row.review_title === "string" ? row.review_title : typeof row.title === "string" ? row.title : ""
    const body = typeof row.review_text === "string" ? row.review_text : typeof row.text === "string" ? row.text : typeof row.review_body === "string" ? row.review_body : ""
    const rating = typeof row.review_star_rating === "string" || typeof row.review_star_rating === "number" ? `Rating: ${row.review_star_rating}.` : ""
    const text = [rating, title, body].filter(Boolean).join(" ").replace(/\s+/g, " ").trim()
    return text.length >= 20 ? [text] : []
  })
}

function findArraysByKey(value: unknown, keyName: string): unknown[][] {
  if (Array.isArray(value)) return value.flatMap((item) => findArraysByKey(item, keyName))
  if (!value || typeof value !== "object") return []
  const out: unknown[][] = []
  for (const [key, child] of Object.entries(value)) {
    if (key === keyName && Array.isArray(child)) out.push(child)
    out.push(...findArraysByKey(child, keyName))
  }
  return out
}

function amazonMarketplaceCountry(url: string) {
  const hostname = new URL(url).hostname.toLowerCase()
  if (hostname.endsWith(".ca")) return "CA"
  if (hostname.endsWith(".co.uk")) return "GB"
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

function canopyTargetReviewCount(maxPages: number) {
  if (maxPages >= 50) return 250
  if (maxPages >= 10) return 100
  return 25
}

function canopyRatingExpansionPages(maxPages: number) {
  if (maxPages >= 50) return 20
  if (maxPages >= 10) return 5
  return 2
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
  targetReviewCount,
  availableReviewCount,
  marketplaceRatingCount,
  basePagesFetched,
  ratingFilterPagesFetched,
  ratingFiltersUsed,
  fallbackReviewsAdded,
  yepApiReviewsAdded,
  yepApiPagesFetched
}: {
  writtenReviews: number
  pagesFetched: number
  requestedPages: number
  targetReviewCount: number
  availableReviewCount?: number
  marketplaceRatingCount?: number
  basePagesFetched?: number
  ratingFilterPagesFetched?: number
  ratingFiltersUsed?: string[]
  fallbackReviewsAdded?: number
  yepApiReviewsAdded?: number
  yepApiPagesFetched?: number
}) {
  const baseText = `${basePagesFetched ?? requestedPages} of ${requestedPages} requested base page${requestedPages === 1 ? "" : "s"}`
  const expansionText = ratingFilterPagesFetched
    ? ` plus ${ratingFilterPagesFetched} star-filter page${ratingFilterPagesFetched === 1 ? "" : "s"} across ${ratingFiltersUsed?.length ?? 0} rating bucket${(ratingFiltersUsed?.length ?? 0) === 1 ? "" : "s"}`
    : ""
  const fallbackText = fallbackReviewsAdded ? ` SerpApi fallback added ${fallbackReviewsAdded} unique written review text${fallbackReviewsAdded === 1 ? "" : "s"}.` : ""
  const targetText = writtenReviews < targetReviewCount ? ` Target sample was ${targetReviewCount}, but providers exposed ${writtenReviews} unique written texts for this run.` : ` Target sample of ${targetReviewCount} was met.`
  const pageText = `${baseText}${expansionText}`
  const yepApiText = yepApiReviewsAdded ? ` YepAPI fallback added ${yepApiReviewsAdded} unique written review text${yepApiReviewsAdded === 1 ? "" : "s"} from ${yepApiPagesFetched ?? 0} page${(yepApiPagesFetched ?? 0) === 1 ? "" : "s"}.` : ""
  if (marketplaceRatingCount && marketplaceRatingCount > writtenReviews) {
    return `Amazon may show ${marketplaceRatingCount.toLocaleString("en-US")} ratings for this listing, but the providers returned ${writtenReviews} unique written review text${writtenReviews === 1 ? "" : "s"} after checking ${pageText}. Ratings and written review text are different data sets.${fallbackText}${yepApiText}${targetText}`
  }
  if (availableReviewCount && availableReviewCount > writtenReviews) {
    return `The providers found ${availableReviewCount.toLocaleString("en-US")} available review record${availableReviewCount === 1 ? "" : "s"} and returned ${writtenReviews} unique written review text${writtenReviews === 1 ? "" : "s"} after checking ${pageText}.${fallbackText}${yepApiText}${targetText}`
  }
  return `The providers returned ${writtenReviews} unique written review text${writtenReviews === 1 ? "" : "s"} after checking ${pageText}. Amazon star ratings can be much higher than retrievable written review text.${fallbackText}${yepApiText}${targetText}`
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

function amazonMarketplaceDomain(url: string) {
  const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, "")
  return hostname.startsWith("amazon.") ? hostname : "amazon.com"
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
        { role: "system", content: `${prompt.role}\nObjective: ${prompt.objective}\nQuality rules:\n${prompt.qualityRules.map((rule, idx) => `${idx + 1}. ${rule}`).join("\n")}\n\nRequired JSON Output Schema:\n${JSON.stringify(prompt.outputSchema, null, 2)}` },
        { role: "user", content: prompt.userMessage }
      ]
    })
  })

  if (!response.ok) {
    throw new Error(`OpenAI request failed with status ${response.status}`)
  }

  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> }
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error("OpenAI returned an empty response")

  const parsedJson = JSON.parse(content) as Record<string, any>

  // Map insufficient data format
  if (parsedJson.insufficient_data) {
    const fallbackInsight = {
      executiveSummary: `Insufficient data: ${parsedJson.reason || "Not enough reviews provided"}. Analyzed ${parsedJson.reviews_provided || 0} reviews, but require at least ${parsedJson.reviews_required || 15} to establish high-confidence patterns.`,
      topComplaints: [],
      topCompliments: [],
      buyerLanguage: [],
      productImprovementIdeas: [],
      adHooks: [],
      positioningAngles: [],
      assumptions: [`Insufficient reviews provided: ${parsedJson.reviews_provided || 0} (Required: ${parsedJson.reviews_required || 15})`],
      dataQuality: {
        reviewCount: parsedJson.reviews_provided || 0,
        limitations: [`Insufficient data: ${parsedJson.reason || "Sparse customer reviews available."}`]
      }
    }
    return { insight: reviewInsightSchema.parse(fallbackInsight), provider: "openai", model }
  }

  // Map the new high-fidelity schema to our standard ReviewInsight schema
  const executiveSummary = parsedJson.executive_summary
    ? `${parsedJson.executive_summary.headline || ""} ${parsedJson.executive_summary.context || ""}`.trim()
    : "Review analysis complete."

  const topComplaints = Array.isArray(parsedJson.top_complaints)
    ? parsedJson.top_complaints.map((item: any) => {
        const pctStr = typeof item.percentage === 'number' ? ` (${item.percentage}%)` : ""
        const subPatternsStr = Array.isArray(item.sub_patterns) && item.sub_patterns.length ? ` Sub-patterns: ${item.sub_patterns.join(", ")}.` : ""
        const quotesStr = Array.isArray(item.verbatim_quotes) && item.verbatim_quotes.length
          ? ` Verbatim quotes: ${item.verbatim_quotes.map((q: any) => `"${q.text}" (${q.rating}★, ${q.date}${q.verified ? ', Verified' : ''})`).join(" | ")}`
          : ""
        const temporalStr = item.temporal_signal ? ` Temporal shift noted: ${item.temporal_signal}.` : ""

        return {
          theme: item.theme || "Complaint theme",
          severity: item.severity === 'high' || item.severity === 'medium' || item.severity === 'low' ? item.severity : "medium",
          evidence: `${item.count || 0} of ${item.total || reviews.length} reviews${pctStr}.${subPatternsStr}${quotesStr}${temporalStr}`,
          productImplication: item.action || "No recommendation specified."
        }
      })
    : []

  const topCompliments = Array.isArray(parsedJson.top_compliments)
    ? parsedJson.top_compliments.map((item: any) => {
        const pctStr = typeof item.percentage === 'number' ? ` (${item.percentage}%)` : ""
        const subPatternsStr = Array.isArray(item.sub_patterns) && item.sub_patterns.length ? ` Sub-patterns: ${item.sub_patterns.join(", ")}.` : ""
        const quotesStr = Array.isArray(item.verbatim_quotes) && item.verbatim_quotes.length
          ? ` Verbatim quotes: ${item.verbatim_quotes.map((q: any) => `"${q.text}" (${q.rating}★, ${q.date}${q.verified ? ', Verified' : ''})`).join(" | ")}`
          : ""

        return {
          theme: item.theme || "Compliment theme",
          evidence: `${item.count || 0} of ${item.total || reviews.length} reviews${pctStr}.${subPatternsStr}${quotesStr}`,
          marketingImplication: item.action || "No marketing angle specified."
        }
      })
    : []

  // Grouped buyer language extraction
  const buyerLang: string[] = []
  if (parsedJson.buyer_language && typeof parsedJson.buyer_language === 'object') {
    const { outcomes, objections, comparisons, unexpected_uses } = parsedJson.buyer_language
    if (Array.isArray(outcomes)) outcomes.forEach((p: string) => buyerLang.push(`[Outcome] ${p}`))
    if (Array.isArray(objections)) objections.forEach((p: string) => buyerLang.push(`[Objection] ${p}`))
    if (Array.isArray(comparisons)) comparisons.forEach((p: string) => buyerLang.push(`[Comparison] ${p}`))
    if (Array.isArray(unexpected_uses)) unexpected_uses.forEach((p: string) => buyerLang.push(`[Unexpected Use] ${p}`))
  }

  const finalBuyerLanguage = buyerLang.length ? buyerLang : (Array.isArray(parsedJson.buyer_language) ? parsedJson.buyer_language : [])

  const productImprovementIdeas = topComplaints.map((item) => ({
    idea: item.productImplication,
    whyItMatters: `Mitigates top complaint theme: ${item.theme}. Evidence: ${item.evidence.split(".")[0]}`,
    confidence: item.severity
  }))

  const adHooks = Array.isArray(parsedJson.ad_hooks)
    ? parsedJson.ad_hooks.map((item: any) => {
        if (typeof item === 'object' && item !== null) {
          return `${item.hook || ""} (Source: ${item.source_type || ""} - ${item.source_evidence || ""})`.trim()
        }
        return String(item)
      })
    : []

  const positioningAngles = Array.isArray(parsedJson.positioning_angles)
    ? parsedJson.positioning_angles.map((item: any) => {
        if (typeof item === 'object' && item !== null) {
          return `${item.angle || ""} (Evidence: ${item.supported_by || ""})`.trim()
        }
        return String(item)
      })
    : []

  const assumptions: string[] = []
  if (Array.isArray(parsedJson.assumptions_and_limitations)) {
    assumptions.push(...parsedJson.assumptions_and_limitations)
  }
  if (parsedJson.competitive_gap && typeof parsedJson.competitive_gap === 'object') {
    const gap = parsedJson.competitive_gap
    assumptions.push(
      `[Competitor Moat Analysis] Competitors Analyzed: ${(gap.competitors_analyzed || []).join(", ") || "N/A"}`,
      `[Moat Analysis] Primary Wins: ${(gap.primary_wins || []).join("; ") || "N/A"}`,
      `[Moat Analysis] Primary Losses: ${(gap.primary_losses || []).join("; ") || "N/A"}`,
      `[Moat Analysis] Open Gaps/Unmet Needs: ${(gap.open_gaps || []).join("; ") || "N/A"}`
    )
  }

  const metaCount = parsedJson.report_meta?.reviews_analyzed
  const limitationsList: string[] = []
  if (parsedJson.report_meta) {
    limitationsList.push(`Confidence Level: ${parsedJson.report_meta.confidence || "Medium"} - ${parsedJson.report_meta.confidence_reason || "Analyzed provided sample."}`)
  }
  if (Array.isArray(parsedJson.emerging_signals)) {
    parsedJson.emerging_signals.forEach((sig: any) => {
      limitationsList.push(`[Emerging Signal] ${sig.theme || ""} (Count: ${sig.count || 0}, First seen: ${sig.first_seen || ""})`)
    })
  }

  const mappedInsight = {
    executiveSummary,
    topComplaints,
    topCompliments,
    buyerLanguage: finalBuyerLanguage,
    productImprovementIdeas,
    adHooks,
    positioningAngles,
    assumptions: assumptions.length ? assumptions : ["Standard review intelligence assumptions applied."],
    dataQuality: {
      reviewCount: typeof metaCount === 'number' ? metaCount : reviews.length,
      limitations: limitationsList.length ? limitationsList : ["Live reviews analyzed using senior model constraints."]
    }
  }

  return { insight: reviewInsightSchema.parse(mappedInsight), provider: "openai", model }
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

function parseJudgeMeWidgetHtml(html: string): string[] {
  const reviews: string[] = [];
  const blocks = html.split(/<div\s+[^>]*class=['"]jdgm-rev(?:\s+|['"])/);

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const ratingMatch = block.match(/data-score=['"](\d+)['"]/);
    const rating = ratingMatch ? ratingMatch[1] : "";

    const titleMatch = block.match(/<b\s+[^>]*class=['"]jdgm-rev__title['"][^>]*>([\s\S]*?)<\/b>/);
    const title = titleMatch ? titleMatch[1].trim() : "";

    const bodyMatch = block.match(/<div\s+[^>]*class=['"]jdgm-rev__body['"][^>]*>([\s\S]*?)<\/div>/) ||
                      block.match(/<p\s+[^>]*class=['"]jdgm-rev__body-text['"][^>]*>([\s\S]*?)<\/p>/);
    let body = bodyMatch ? bodyMatch[1].trim() : "";

    body = body.replace(/<\/?[^>]+(>|$)/g, "").replace(/\s+/g, " ").trim();
    const cleanTitle = title.replace(/<\/?[^>]+(>|$)/g, "").replace(/\s+/g, " ").trim();

    if (body) {
      let text = "";
      if (rating) text += `Rating: ${rating}. `;
      if (cleanTitle) text += `${cleanTitle}. `;
      text += body;
      reviews.push(text.trim());
    }
  }
  return reviews;
}

async function fetchJudgeMePublicReviews(input: ReviewInput, shopDomain: string, handle: string): Promise<ReviewFetchResult> {
  const maxPages = canopyReviewPageLimit(input.reviewPageLimit);
  const reviews = new Set<string>();
  let pagesFetched = 0;
  let totalReviewsCount = 0;
  let previousPageAddedReviews = true;

  while (pagesFetched < maxPages && previousPageAddedReviews && reviews.size < 500) {
    const pageNum = pagesFetched + 1;
    const params = new URLSearchParams({
      shop_domain: shopDomain,
      platform: "shopify",
      product_handle: handle,
      page: String(pageNum)
    });

    const response = await fetch(`https://judge.me/api/v1/widgets/reviews?${params}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Judge.me public widget request failed with status ${response.status}.`);
    }

    const payload = await response.json() as Record<string, unknown>;
    const htmlString = typeof payload.reviews === "string" ? payload.reviews : "";
    const pageReviews = parseJudgeMeWidgetHtml(htmlString);

    if (typeof payload.total_reviews === "number") {
      totalReviewsCount = payload.total_reviews;
    }

    const previousCount = reviews.size;
    for (const text of pageReviews) reviews.add(text);

    pagesFetched += 1;
    previousPageAddedReviews = pageReviews.length > 0 && reviews.size > previousCount;
  }

  const collectedReviews = [...reviews].slice(0, 500);
  return {
    reviews: collectedReviews,
    source: "judgeme",
    productName: input.productName || `Shopify product ${handle}`,
    pagesFetched,
    availableReviewCount: totalReviewsCount || collectedReviews.length,
    sampleNote: `Judge.me public crawler retrieved ${collectedReviews.length} written review${collectedReviews.length === 1 ? "" : "s"} across ${pagesFetched} widget page${pagesFetched === 1 ? "" : "s"}.`,
    warning: collectedReviews.length ? undefined : "Judge.me returned no public review text for this product."
  };
}

async function fetchStampedPublicReviews(input: ReviewInput, shopDomain: string): Promise<ReviewFetchResult> {
  const externalId = await fetchShopifyProductExternalId(input.productUrl);
  if (!externalId) {
    throw new Error("Could not find the Shopify external product ID. Make sure the URL is public or upload a CSV export.");
  }

  const maxPages = canopyReviewPageLimit(input.reviewPageLimit);
  const reviews = new Set<string>();
  let pagesFetched = 0;
  let totalReviewsCount = 0;
  let previousPageAddedReviews = true;

  while (pagesFetched < maxPages && previousPageAddedReviews && reviews.size < 500) {
    const pageNum = pagesFetched + 1;
    const params = new URLSearchParams({
      shopUrl: shopDomain,
      productId: externalId,
      page: String(pageNum)
    });

    const response = await fetch(`https://stamped.io/api/widget/reviews?${params}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Stamped.io public widget request failed with status ${response.status}.`);
    }

    const payload = await response.json() as Record<string, unknown>;
    const dataList = Array.isArray(payload.data) ? payload.data : [];

    if (typeof payload.total === "number") {
      totalReviewsCount = payload.total;
    }

    const previousCount = reviews.size;
    for (const item of dataList) {
      if (!item || typeof item !== "object") continue;
      const row = item as Record<string, unknown>;
      const rating = row.reviewRating ?? row.rating ?? "";
      const title = String(row.reviewTitle ?? row.title ?? "").trim();
      const body = String(row.reviewMessage ?? row.reviewBody ?? row.body ?? "").trim();

      if (!body) continue;

      const cleanBody = body.replace(/<\/?[^>]+(>|$)/g, "").replace(/\s+/g, " ").trim();
      const cleanTitle = title.replace(/<\/?[^>]+(>|$)/g, "").replace(/\s+/g, " ").trim();

      let text = "";
      if (rating) text += `Rating: ${rating}. `;
      if (cleanTitle) text += `${cleanTitle}. `;
      text += cleanBody;
      reviews.add(text.trim());
    }

    pagesFetched += 1;
    previousPageAddedReviews = dataList.length > 0 && reviews.size > previousCount;
  }

  const collectedReviews = [...reviews].slice(0, 500);
  return {
    reviews: collectedReviews,
    source: "stamped",
    productName: input.productName || `Shopify product ${shopifyProductHandle(input.productUrl)}`,
    pagesFetched,
    availableReviewCount: totalReviewsCount || collectedReviews.length,
    sampleNote: `Stamped.io public crawler retrieved ${collectedReviews.length} written review${collectedReviews.length === 1 ? "" : "s"} across ${pagesFetched} widget page${pagesFetched === 1 ? "" : "s"}.`,
    warning: collectedReviews.length ? undefined : "Stamped.io returned no public review text for this product."
  };
}
