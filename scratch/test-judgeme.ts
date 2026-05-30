import { resolveShopifyDomain } from "../lib/ai/service"

async function run() {
  const url = "https://lufaajskin.com/products/turmeric-brightening-face-moisturizer"
  const handle = "turmeric-brightening-face-moisturizer"
  const shopDomain = await resolveShopifyDomain(url) || "lufaajskin.com"
  
  console.log("Resolved shopDomain:", shopDomain)
  console.log("Product handle:", handle)

  const params = new URLSearchParams({
    shop_domain: shopDomain,
    platform: "shopify",
    product_handle: handle,
    page: "1"
  })

  const widgetUrl = `https://judge.me/api/v1/widgets/reviews?${params}`
  console.log("Fetching widget reviews from:", widgetUrl)

  const response = await fetch(widgetUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
  })

  console.log("Response Status:", response.status)
  if (!response.ok) {
    const text = await response.text()
    console.log("Response Text:", text)
    return
  }

  const payload = await response.json() as any
  console.log("Payload keys:", Object.keys(payload))
  console.log("total_reviews:", payload.total_reviews)
  console.log("Type of payload.reviews:", typeof payload.reviews)
  
  const html = payload.reviews || ""
  // Parse blocks
  const blocks = html.split(/<div\s+[^>]*class=['"]jdgm-rev(?:\s+|['"])/)
  console.log("HTML length:", html.length)
  console.log("Parsed review blocks:", blocks.length - 1)

  // Print first block to inspect verified flag and date
  if (blocks.length > 1) {
    const block = blocks[1]
    const ratingMatch = block.match(/data-score=['"](\d+)['"]/)
    const verifiedMatch = block.match(/class=['"]jdgm-rev__buyer-badge['"]/) || block.match(/class=['"]jdgm-rev__verified-buyer-badge['"]/) || block.match(/jdgm-verified-buyer-badge/)
    const dateMatch = block.match(/class=['"]jdgm-rev__timestamp['"][^>]*>([\s\S]*?)<\/span>/) || block.match(/data-timestamp=['"](.*?)['"]/)
    
    console.log("\nSample review block match:")
    console.log("Rating:", ratingMatch ? ratingMatch[1] : "not found")
    console.log("Verified match:", verifiedMatch ? "found" : "not found")
    console.log("Timestamp:", dateMatch ? dateMatch[1].trim() : "not found")
    
    // Print first 500 chars of HTML block
    console.log("Raw snippet of block:\n", block.substring(0, 500))
  }
}

run().catch(console.error)
