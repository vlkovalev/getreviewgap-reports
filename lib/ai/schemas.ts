import { z } from "zod"

export const reviewInputSchema = z.object({
  productUrl: z.string().url().max(2000),
  platform: z.enum(["amazon", "shopify"]).optional().default("amazon"),
  email: z.string().email().max(120).optional().or(z.literal("")),
  productName: z.string().trim().max(160).optional().or(z.literal("")),
  competitorName: z.string().trim().max(160).optional().or(z.literal("")),
  marketplace: z.string().trim().max(80).optional().default("amazon.com"),
  pastedReviews: z.string().trim().max(30000).optional().or(z.literal("")),
  website: z.string().optional()
})

export const reviewInsightSchema = z.object({
  executiveSummary: z.string(),
  topComplaints: z.array(z.object({
    theme: z.string(),
    evidence: z.string(),
    severity: z.enum(["low", "medium", "high"]),
    productImplication: z.string()
  })),
  topCompliments: z.array(z.object({
    theme: z.string(),
    evidence: z.string(),
    marketingImplication: z.string()
  })),
  buyerLanguage: z.array(z.string()),
  productImprovementIdeas: z.array(z.object({
    idea: z.string(),
    whyItMatters: z.string(),
    confidence: z.enum(["low", "medium", "high"])
  })),
  adHooks: z.array(z.string()),
  positioningAngles: z.array(z.string()),
  assumptions: z.array(z.string()),
  dataQuality: z.object({
    reviewCount: z.number(),
    limitations: z.array(z.string())
  })
})

export type ReviewInsight = z.infer<typeof reviewInsightSchema>
export type ReviewInput = z.infer<typeof reviewInputSchema>
