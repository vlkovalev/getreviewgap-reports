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

type ReviewSource = "canopy" | "apify" | "pasted" | "demo"
type ReviewFetchResult = {
  reviews: string[]
  source: ReviewSource
  warning?: string
  productName?: string
  asin?: string
  pagesFetched?: number
  availableReviewCount?: number
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
    throw new Error("Shopify reports need pasted or exported customer reviews for now. Paste review text from your store or approved review app export to generate a report.")
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

async function fetchCanopyReviews(input: ReviewInput, apiKey: string): Promise<ReviewFetchResult> {
  const asin = extractAmazonAsin(input.productUrl)
  if (!asin) throw new Error("Could not identify an Amazon ASIN in this URL. Use a product URL containing /dp/ASIN.")
  const maxPages = canopyReviewPageLimit(input.reviewPageLimit)
  const reviews = new Set<string>()
  let pagesFetched = 0
  let availableReviewCount: number | undefined
  let productName: string | undefined
  let previousPageAddedReviews = true

  while (pagesFetched < maxPages && previousPageAddedReviews) {
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
    productName ||= typeof product?.title === "string" ? product.title.trim() : undefined
    availableReviewCount ||= typeof pageInfo?.totalResults === "number" ? pageInfo.totalResults : undefined
    const pageReviews = canopyPaginatedReviewTexts(product)
    const usableReviews = pageReviews.length ? pageReviews : extractReviewTexts([payload])
    const previousCount = reviews.size
    for (const text of usableReviews) reviews.add(text)
    pagesFetched += 1
    previousPageAddedReviews = usableReviews.length > 0 && reviews.size > previousCount
  }

  const collectedReviews = [...reviews].slice(0, 500)
  const sampleNote = availableReviewCount && availableReviewCount > collectedReviews.length
    ? `The provider returned ${collectedReviews.length} unique written review texts from ${availableReviewCount} available review records after checking ${pagesFetched} page${pagesFetched === 1 ? "" : "s"}.`
    : `The provider returned ${collectedReviews.length} unique written review text${collectedReviews.length === 1 ? "" : "s"} after checking ${pagesFetched} page${pagesFetched === 1 ? "" : "s"}. Marketplace star ratings can be much higher than retrievable written review text.`
  return {
    reviews: collectedReviews,
    source: "canopy",
    productName,
    asin,
    pagesFetched,
    availableReviewCount,
    sampleNote,
    warning: collectedReviews.length ? undefined : "Canopy returned no review text for this product and marketplace. Try an authorized review export or a different product."
  }
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
