async function run() {
  const apifyToken = "apify_api_SNlxScntM04e8uAuQ7sf71jZgmUTvA2tMo7a"
  const actorId = "apify/e-commerce-scraping-tool"
  const url = "https://www.amazon.com/dp/B0BKTP6ZGL"

  console.log("Triggering Apify Amazon Reviews Scraper for:", url)

  const actorInput = {
    productUrls: [url],
    maxReviews: 100,
    scrapeMode: "AUTO",
    sortReview: "Most recent",
    proxyConfiguration: { useApifyProxy: true }
  }

  const runUrl = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${apifyToken}`
  console.log("POSTing to Apify...")

  try {
    const response = await fetch(runUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(actorInput)
    })

    console.log("Response Status:", response.status)
    if (!response.ok) {
      console.log("Error payload:", await response.text())
      return
    }

    const items = await response.json()
    console.log("Items returned:", items.length)
    if (items.length > 0) {
      console.log("Sample review keys:", Object.keys(items[0]))
      // print first review text
      const reviewText = items[0].reviewDescription || items[0].reviewText || items[0].text
      console.log("Sample Review Text:\n", reviewText)
    }
  } catch (err) {
    console.error(err)
  }
}

run()
