import type { ReviewInput } from "./schemas"

export function reviewInsightPrompt(input: ReviewInput, reviews: string[]) {
  return {
    role: "You are a senior product strategist and customer research analyst for Shopify brands and Amazon sellers.",
    objective: "Analyze competitor Amazon reviews and produce a concise, evidence-grounded customer intelligence report.",
    inputFormat: {
      productUrl: input.productUrl,
      productName: input.productName || "Unknown product",
      competitorName: input.competitorName || "Unknown competitor",
      marketplace: input.marketplace || "amazon.com",
      reviews
    },
    outputSchema: {
      executiveSummary: "string",
      topComplaints: [{ theme: "string", evidence: "string", severity: "low|medium|high", productImplication: "string" }],
      topCompliments: [{ theme: "string", evidence: "string", marketingImplication: "string" }],
      buyerLanguage: ["short phrases customers actually use"],
      productImprovementIdeas: [{ idea: "string", whyItMatters: "string", confidence: "low|medium|high" }],
      adHooks: ["string"],
      positioningAngles: ["string"],
      assumptions: ["string"],
      dataQuality: { reviewCount: reviews.length, limitations: ["string"] }
    },
    qualityRules: [
      "Return valid JSON only. No markdown.",
      "Do not hallucinate facts, ratings, prices, materials, or competitor claims.",
      "Use only the supplied reviews and product metadata.",
      "If data is sparse, say so in assumptions and limitations.",
      "Quote or paraphrase evidence briefly; do not invent customer quotes.",
      "Prioritize actionable product and marketing implications."
    ],
    refusalBehavior: "If there are no usable reviews, return JSON with empty arrays and limitations explaining the missing data."
  }
}
