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

  await prisma.resourcePost.deleteMany({
    where: {
      slug: {
        in: [
          "amazon-review-intelligence",
          "product-page-objection-mining",
          "review-language-ad-hooks"
        ]
      }
    }
  })

  await prisma.resourcePost.createMany({
    skipDuplicates: true,
    data: [
      {
        title: "How to Use Amazon Reviews for Competitor Intelligence",
        slug: "amazon-review-intelligence",
        excerpt: "Turn public customer reviews into product gaps, ad hooks, and launch positioning.",
        content: `Customer reviews are the single most valuable source of unvarnished market feedback. Every day, millions of customers explain precisely why they purchased a product, what they liked, and, most importantly, where the product failed them. In the DTC and Amazon e-commerce world, this data represents a direct, real-time feedback loop on your competitors. By systematically scraping and analyzing competitor reviews, you can uncover lucrative product gaps, identify high-converting marketing hooks, and position your brand to win.

### Why Competitor Reviews are a Goldmine

Traditional market research requires expensive focus groups, surveys, and months of waiting. Amazon reviews are public, abundant, and written in the customer's raw, emotional language. Rather than asking customers what they *might* buy, review mining looks at what they *already* bought and experienced.

When analyzing reviews, you are looking for patterns in customer sentiment. The goal is to move from qualitative reading to quantitative analysis. When you use tools like the [ReviewGap Dashboard](/dashboard), you can instantly parse thousands of reviews to extract critical structured data. This lets you see the distribution of positive and negative remarks across specific product features, giving you a statistical edge.

### Step 1: Scrape & Structure - Harvesting Reviews

To build a competitor intelligence database, you must first gather clean, comprehensive review data. While you can manually copy and paste reviews, scaling this process requires automated tools. You'll want to target products with:
- High sales volume (to ensure a steady stream of recent reviews).
- Over 100 total reviews (to have a statistically significant sample size).
- A mix of 1-star, 3-star, and 5-star ratings (to capture both active complaints and raving fans).

Once harvested, reviews should be organized by date, rating, and verified purchase status. Filtering for verified purchases is critical, as it eliminates a large portion of astroturfed or spam reviews.

### Step 2: Finding Product Gaps

The real magic happens when you look at 2-star and 3-star reviews. These are written by customers who wanted the product to work but were let down by a specific detail. Unlike 1-star reviews, which are often angry rants about shipping or customer care, middle-tier reviews contain highly specific product feedback.

Look for recurring statements like:
- "I wish it had a longer strap."
- "The zipper broke after three uses."
- "It works well but smells strongly of chemicals."

These represent immediate, actionable product gaps. If three major competitors all suffer from zipper failures, your launch positioning should highlight your double-reinforced, lifetime-guaranteed zippers. If you want a deep dive on categorizing customer complaints, take a look at our [objection mining guide](/resources/product-page-objection-mining).

### Step 3: Mapping Objections and Competitor Vulnerabilities

Beyond physical product improvements, review intelligence shapes your conversion rate optimization (CRO) strategy. When customers express confusion or hesitation in their reviews, they are highlighting the objections your own product page must answer.

For instance, if competitor reviews frequently ask, "Is this safe for sensitive skin?" or complain that "The instructions were impossible to follow," you can pre-emptively address these on your landing page. Highlight your hypoallergenic certifications and embed a step-by-step video tutorial right above the fold. By doing so, you remove purchase friction before the customer even thinks to ask.

### Step 4: Operationalizing the Data in Your Marketing

Competitor intelligence shouldn't live in a spreadsheet; it should drive your entire creative pipeline. Use the exact vocabulary customers use in their reviews. If multiple reviews call a competitor's moisturizer "heavy and greasy," your ad hooks should lead with "A lightweight formula that absorbs in seconds, leaving zero greasy residue."

To start generating these reports at scale, you can view our [flexible pricing plans](/pricing). Whether you need a one-off report for a niche check or monthly credits to keep a pulse on your competitors, having a structured data flow keeps your messaging sharp.

### Conclusion

Review mining is not a one-time exercise. As competitors update their products and new players enter the market, customer expectations shift. By establishing a systematic review intelligence workflow, you ensure your brand is always one step ahead, offering products that fix exactly what customers wish competitors solved.`,
        tags: ["Amazon", "Research", "DTC"],
        publishedAt: new Date()
      },
      {
        title: "How to Mine Product Page Objections Before Launch",
        slug: "product-page-objection-mining",
        excerpt: "Find the objections your product page needs to answer before customers ask them.",
        content: `When launching a new e-commerce product or landing page, the biggest barrier to sales isn't your price or your shipping times. It's the silent doubts lingering in the customer's mind. These doubts are silent objections: unexpressed questions about durability, sizing, ingredients, usage, or compatibility that cause a user to abandon their cart. 

To maximize your conversion rate, you must pre-emptively identify and answer these objections. The most effective way to discover them before you even launch is through systematic competitor review mining—a process known as objection mining.

### The Anatomy of a Customer Objection

An objection is a friction point that stops a purchase. Customers rarely tell you what these are; they simply close the tab. However, by looking at reviews left on similar competitor products, you can read the minds of your target audience. When a customer writes a negative review, they are explaining the exact point where their expectations collided with reality.

Common categories of objections include:
- **Quality & Durability**: "Will this snap under pressure?" or "Does the color fade after washing?"
- **Usability & Complexity**: "Is this easy to set up?" or "Do I need special tools?"
- **Sensory & Esthetics**: "Does it have a chemical smell?" or "Is it too loud?"
- **Expectation Alignment**: "Is the actual color different from the photo?" or "Is the size accurate?"

By understanding these categories, you can structure your landing page layout to systematically dismantle each doubt.

### Extracting Friction Points from Competitor Reviews

To start mining, head over to your competitors' listings and focus your attention on 2-star, 3-star, and 4-star reviews. Read at least 50 to 100 reviews, or speed up the entire process by running a competitor analysis inside [our dashboard](/dashboard). The AI will automatically categorize these friction points, saving you hours of manual tagging.

As you analyze, look for phrases that signal uncertainty or disappointment:
- "The sizing runs extremely small."
- "I didn't realize it required a separate adapter."
- "It is much heavier than expected."

Every one of these statements is a gift. It tells you exactly what information was missing from the competitor's product detail page (PDP). If the competitor failed to explain their sizing accurately, you can create a detailed interactive size calculator or show real models of varying heights and weights wearing your product.

### Transitioning from Objections to Answers on Your PDP

Once you have identified the top three to five objections, you must integrate the answers directly into your page design. Do not hide them in a tiny FAQ section at the bottom of the page. Instead, use high-impact visual design:
1. **Hero Section Bullets**: If durability is a major worry, include a "Built with Double-Reinforced Canvas" bullet right next to the Add to Cart button.
2. **Comparison Charts**: Use side-by-side charts to demonstrate how your product resolves the common competitor issues (e.g., "Hypoallergenic" vs "Uses Synthetic Dyes").
3. **Exploded Views / Diagrams**: Show the internal components or materials to build immediate structural trust.

### Turning Solved Objections into Ad Hooks

Once your landing page is fortified against customer doubts, you can take those same objection-busting copy points and move them to the top of your marketing funnel. When you address customer worries in your ad creative, you attract high-intent traffic that is already primed to convert. Read our [ad hooks guide](/resources/review-language-ad-hooks) to learn how to translate raw customer sentiment into high-converting social media ads.

If you are managing multiple product launches or running an agency, you will need a scalable way to run these reports. Check out our [flexible pricing plans](/pricing) to purchase multi-report credits that roll over monthly.

### Conclusion

Objection mining shifts your landing page from a generic brochure to an active sales representative. By identifying what makes customers hesitate and addressing those points head-on using competitor review intelligence, you build an unbeatable, high-converting product page.`,
        tags: ["CRO", "Messaging"],
        publishedAt: new Date()
      },
      {
        title: "Turning Review Language into Ad Hooks",
        slug: "review-language-ad-hooks",
        excerpt: "Use real buyer language to write sharper ads without inventing claims.",
        content: `Every copywriter knows the struggle of staring at a blank page, trying to conjure up a headline that will stop a user from scrolling. But the truth is, the best ad copy is never written—it is overheard. Your customers are already explaining exactly why they buy, what problems your product solves, and how it makes them feel. They are doing this in the review section.

By mining reviews for raw customer language, you can build a high-converting creative pipeline that resonates instantly because it uses the exact vocabulary of your buyers.

### Why Customer Voice Beats Copywriter Imagination

Professional copywriters tend to write polished, grammatically perfect copy. But social media feeds are casual, personal, and authentic. Ads that perform best often sound like a recommendation from a friend. 

When you analyze reviews, you are looking for "voice of customer" (VoC) gold nuggets—phrases that are highly descriptive, emotional, or conversational. For example:
- **Copywriter copy**: "Our lightweight moisturizer hydrates your skin deeply without clogging pores."
- **Customer review copy**: "It literally feels like a glass of water for my face, and it doesn't leave me looking like a grease slick."

The customer's version is vastly superior. It uses vivid imagery ("glass of water for my face") and addresses a common fear ("looking like a grease slick") in authentic, colloquial terms.

### The "Before vs. After" Formula from Review Phrases

One of the most effective ad hooks is the "Before vs. After" contrast. Customer reviews are packed with this narrative arc. They usually start with a frustration and end with a relief.

To extract these, look for reviews that use transition words like "Finally," "I used to," or "I was skeptical, but." For example:
- *Review quote*: "I used to spend 20 minutes every morning detangling my hair. Now it takes 2 minutes."
- *Ad hook*: "Stop spending 20 minutes detangling your hair every morning. Get it done in under 2 minutes."

By grounding your hooks in real user experiences, your ads become highly relatable. If you want to systematically analyze your competitors' customer journeys to find these transformation points, read our [competitor intelligence guide](/resources/amazon-review-intelligence).

### How to Build Ad Creative Angles from Review Reports

To scale your ad creative, you cannot rely on reading reviews one by one. You need a structured approach to extract recurring angles. By entering a competitor’s product link in [our dashboard](/dashboard), you can run a comprehensive report that automatically clusters positive and negative reviews into distinct themes.

Look for the "Ad Hooks" section in the generated intelligence reports. The AI identifies:
1. **Direct Benefits**: The primary reason people love the product (e.g., "absorbs instantly").
2. **Objection Chasers**: Phrases that overcome doubts (e.g., "no white cast").
3. **Surprising Use Cases**: Unintended benefits that can form entirely new marketing campaigns (e.g., "uses it as a makeup primer").

### Selecting the Right Plan for Continuous Ad Creative Refresh

To keep your Facebook, TikTok, and Google ads fresh, you need a constant stream of new hooks. Creative fatigue is real, and hooks that worked last month may stop converting next week.

By checking our [pricing page](/pricing), you can pick a plan that fits your testing cadence. Running monthly review audits on your own brand and your competitors ensures your creative team never runs out of authentic, data-backed hooks.

### Conclusion

Stop guessing what will make your audience click. The answers are already written in their reviews. By translating raw buyer language into sharp, authentic ad copy, you can drive down your customer acquisition costs and build a creative pipeline that practically writes itself.`,
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
