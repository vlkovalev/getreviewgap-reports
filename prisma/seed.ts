import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  await prisma.fAQ.createMany({
    skipDuplicates: true,
    data: [
      { question: "Does ReviewGap scrape live Amazon reviews?", answer: "Yes when an Apify Amazon review actor is configured. Without API keys, the MVP uses demo data or pasted reviews.", order: 1 },
      { question: "Can I use my own review text?", answer: "Yes. Paste one review per line in the dashboard to test the analysis workflow without live scraping.", order: 2 },
      { question: "Are payments active?", answer: "No. Pricing is shown for validation, but Stripe checkout is intentionally left for the next build step.", order: 3 }
    ]
  })

  await prisma.testimonial.createMany({
    skipDuplicates: true,
    data: [
      { name: "DTC Founder", role: "Skincare brand", quote: "This is exactly the kind of competitor research we normally do manually before a launch." },
      { name: "Marketplace Consultant", role: "Amazon agency", quote: "The buyer language section is useful for product page copy and ad hooks." }
    ]
  })

  await prisma.resourcePost.createMany({
    skipDuplicates: true,
    data: [
      {
        title: "How to Use Amazon Reviews for Competitor Intelligence",
        slug: "amazon-review-intelligence",
        excerpt: "Turn public customer reviews into product gaps, ad hooks, and launch positioning.",
        content: "Customer reviews reveal buyer expectations, repeated objections, and product gaps. Group those patterns before writing product page copy or planning improvements.",
        tags: ["Amazon", "Research", "DTC"],
        publishedAt: new Date()
      },
      {
        title: "How to Mine Product Page Objections Before Launch",
        slug: "product-page-objection-mining",
        excerpt: "Find the objections your product page needs to answer before customers ask them.",
        content: "Look for phrases that signal uncertainty: smaller than expected, smells too strong, unclear ingredients, hard to assemble, or not durable.",
        tags: ["CRO", "Messaging"],
        publishedAt: new Date()
      },
      {
        title: "Turning Review Language into Ad Hooks",
        slug: "review-language-ad-hooks",
        excerpt: "Use real buyer language to write sharper ads without inventing claims.",
        content: "Strong hooks often come from customer language. Keep claims grounded in the review data and make assumptions explicit when data is thin.",
        tags: ["Ads", "Copywriting"],
        publishedAt: new Date()
      }
    ]
  })

  await prisma.servicePackage.createMany({
    skipDuplicates: true,
    data: [
      { title: "One-off Report", slug: "one-off-report", description: "A single competitor review intelligence report.", priceLabel: "$19", features: ["Amazon review scrape", "AI report", "Ad hooks", "Product ideas"] },
      { title: "Growth", slug: "growth", description: "Monthly report credits for brands and agencies.", priceLabel: "$49/mo", features: ["5 reports", "Saved history", "Priority generation"] }
    ]
  })

  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    await prisma.user.upsert({
      where: { email: process.env.ADMIN_EMAIL },
      update: {},
      create: {
        email: process.env.ADMIN_EMAIL,
        name: "Admin",
        passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12)
      }
    })
  }
}

main().finally(async () => {
  await prisma.$disconnect()
})
