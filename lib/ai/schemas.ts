import { z } from "zod"

export const reviewInputSchema = z.object({
  productUrl: z.string().url().max(2000),
  platform: z.enum(["amazon", "shopify"]).optional().default("amazon"),
  email: z.string().email().max(120).optional().or(z.literal("")),
  productName: z.string().trim().max(160).optional().or(z.literal("")),
  competitorName: z.string().trim().max(160).optional().or(z.literal("")),
  marketplace: z.string().trim().max(80).optional().default("amazon.com"),
  pastedReviews: z.string().trim().max(30000).optional().or(z.literal("")),
  reviewApp: z.string().trim().max(80).optional().or(z.literal("")),
  reviewPageLimit: z.number().int().min(1).max(50).optional(),
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
  }),
  competitiveGap: z.object({
    competitorsAnalyzed: z.array(z.string()),
    primaryWins: z.array(z.string()),
    primaryLosses: z.array(z.string()),
    openGaps: z.array(z.string())
  }).optional().nullable(),
  emergingSignals: z.array(z.object({
    theme: z.string(),
    count: z.number(),
    firstSeen: z.string()
  })).optional().nullable()
})

export type ReviewInsight = z.infer<typeof reviewInsightSchema>
export type ReviewInput = z.infer<typeof reviewInputSchema>
