import { z } from "zod"

export const leadSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  company: z.string().trim().max(120).optional().or(z.literal("")),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
  source: z.string().trim().max(80).optional(),
  website: z.string().optional()
})

export const inquirySchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  company: z.string().trim().max(120).optional().or(z.literal("")),
  serviceInterest: z.string().trim().min(2).max(120),
  budgetRange: z.string().trim().max(80).optional().or(z.literal("")),
  message: z.string().trim().min(10).max(2000),
  consent: z.literal(true),
  website: z.string().optional()
})

export const contentSchema = z.object({
  title: z.string().trim().min(2).max(160),
  body: z.string().trim().min(2).max(6000)
})
