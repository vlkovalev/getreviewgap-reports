export type PlanId = "one_report" | "five_pack" | "twenty_pack" | "micro" | "starter" | "growth"

export const paidPlans: Record<PlanId, { id: PlanId; name: string; price: number; priceLabel: string; description: string; features: string[] }> = {
  one_report: {
    id: "one_report",
    name: "Single",
    price: 5,
    priceLabel: "$5",
    description: "Testing the tool once with one competitor product.",
    features: ["1 report credit", "Ratings and sentiment summary", "Buyer language highlights", "CSV/JSON/PDF export"]
  },
  five_pack: {
    id: "five_pack",
    name: "Starter Pack",
    price: 19,
    priceLabel: "$19",
    description: "Small competitor checks without a monthly commitment.",
    features: ["5 report credits", "Good for 5 competitor ASINs", "Product gap summary", "CSV/JSON/PDF exports"]
  },
  twenty_pack: {
    id: "twenty_pack",
    name: "Pro Pack",
    price: 59,
    priceLabel: "$59",
    description: "For agencies and serious sellers comparing a full category.",
    features: ["20 report credits", "Category-level research", "Ad hook and objection mining", "CSV/JSON/PDF exports"]
  },
  micro: {
    id: "micro",
    name: "Micro",
    price: 9,
    priceLabel: "$9/mo",
    description: "A no-brainer monthly entry point for occasional competitor checks.",
    features: ["2 credits per month", "Rollover up to 6 credits", "Private saved reports", "CSV/JSON/PDF exports"]
  },
  starter: {
    id: "starter",
    name: "Starter",
    price: 29,
    priceLabel: "$29/mo",
    description: "For solo sellers and Shopify brands researching reviews every month.",
    features: ["10 credits per month", "Rollover up to 30 credits", "For solo sellers", "Buyer language extraction"]
  },
  growth: {
    id: "growth",
    name: "Growth",
    price: 59,
    priceLabel: "$59/mo",
    description: "For agencies and sellers that review multiple products every month.",
    features: ["40 credits per month", "Rollover up to 120 credits", "Agency and multi-product workflow", "Priority generation and support"]
  }
}

export function getPaidPlan(planId: string | null | undefined) {
  if (planId === "one_report" || planId === "five_pack" || planId === "twenty_pack" || planId === "micro" || planId === "starter" || planId === "growth") return paidPlans[planId]
  return null
}

export function isMonthlyPlan(planId: PlanId) {
  return planId === "micro" || planId === "starter" || planId === "growth"
}

export function getPlanCredits(planId: PlanId) {
  if (planId === "one_report") return 1
  if (planId === "five_pack") return 5
  if (planId === "twenty_pack") return 20
  if (planId === "micro") return 2
  if (planId === "starter") return 10
  return 40
}
