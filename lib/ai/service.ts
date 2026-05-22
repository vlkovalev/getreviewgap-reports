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

export async function fetchAmazonReviews(input: ReviewInput): Promise<{ reviews: string[]; source: "apify" | "pasted" | "demo" }> {
  if (input.pastedReviews?.trim()) {
    return {
      reviews: input.pastedReviews.split(/\n+/).map((line) => line.trim()).filter(Boolean).slice(0, 500),
      source: "pasted"
    }
  }

  const apifyToken = cleanEnv(process.env.APIFY_TOKEN)
  const actorId = cleanEnv(process.env.APIFY_AMAZON_REVIEWS_ACTOR_ID)

  if (!apifyToken || !actorId) {
    return { reviews: demoReviews, source: "demo" }
  }

  const apiActorId = normalizeApifyActorId(actorId)
  let lastError = ""
  for (const actorInput of buildApifyInputs(input)) {
    const runResponse = await fetch(`https://api.apify.com/v2/acts/${apiActorId}/run-sync-get-dataset-items?token=${apifyToken}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(actorInput)
    })

    if (!runResponse.ok) {
      lastError = `${apifyStatusMessage(runResponse.status)} ${await apifyErrorDetail(runResponse)}`
      if (runResponse.status === 400) continue
      throw new Error(lastError.trim())
    }

    const items = await runResponse.json() as Array<Record<string, unknown>>
    const reviews = items
      .map((item) => String(item.reviewText || item.review_text || item.review || item.reviewTitle || item.text || item.content || item.body || item.comment || item.description || ""))
      .map((text) => text.trim())
      .filter(Boolean)
      .slice(0, 500)

    return { reviews: reviews.length ? reviews : demoReviews, source: reviews.length ? "apify" : "demo" }
  }

  throw new Error(lastError.trim() || "Apify actor rejected the request input. Set APIFY_INPUT_TEMPLATE for your selected actor.")
}

function buildApifyInputs(input: ReviewInput) {
  if (process.env.APIFY_INPUT_TEMPLATE) {
    try {
      const template = JSON.parse(process.env.APIFY_INPUT_TEMPLATE) as Record<string, unknown>
      return [replaceTemplateValues(template, input.productUrl)]
    } catch {
      return [{ productUrl: input.productUrl, maxItems: 500 }]
    }
  }

  const asin = extractAmazonAsin(input.productUrl)
  const common = { maxItems: 500, maxReviews: 500, reviewsCount: 500, proxyConfiguration: { useApifyProxy: true } }
  const inputs: Array<Record<string, unknown> | null> = [
    { startUrls: [{ url: input.productUrl }], ...common },
    { productUrls: [input.productUrl], ...common },
    { urls: [input.productUrl], ...common },
    { url: input.productUrl, ...common },
    { productUrl: input.productUrl, ...common },
    asin ? { asins: [asin], ...common } : null,
    asin ? { asin, ...common } : null
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
  if (status === 400) return "Apify actor rejected the input format."
  if (status === 401) return "Apify authentication failed. Check APIFY_TOKEN in Vercel and local .env."
  if (status === 403) return "Apify access denied. Check that your token can run the selected Amazon reviews actor."
  if (status === 404) return "Apify actor not found. Check APIFY_AMAZON_REVIEWS_ACTOR_ID and use the actor's exact id."
  if (status === 429) return "Apify rate limit reached. Try again later or increase Apify capacity."
  return `Apify request failed with status ${status}`
}

async function apifyErrorDetail(response: Response) {
  const text = await response.text().catch(() => "")
  if (!text) return ""
  try {
    const data = JSON.parse(text) as { error?: { message?: string }; message?: string }
    return (data.error?.message || data.message || "").slice(0, 240)
  } catch {
    return text.slice(0, 240)
  }
}

function extractAmazonAsin(url: string) {
  return url.match(/\/(?:dp|gp\/product|product)\/([A-Z0-9]{10})/i)?.[1]?.toUpperCase()
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
