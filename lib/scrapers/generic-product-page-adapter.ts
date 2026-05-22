import type { ScraperAdapter } from "./base"

export const genericProductPageAdapter: ScraperAdapter = {
  id: "generic-product-page",
  name: "Generic Product Page Adapter",
  async scrape(source) {
    return {
      products: [],
      log: [
        `Live scraping is not enabled for ${source.name}.`,
        "Use official APIs, configured Apify actors, uploaded CSVs, or source-approved adapters.",
        "No CAPTCHA bypass, login bypass, or access-control circumvention is implemented."
      ]
    }
  }
}
