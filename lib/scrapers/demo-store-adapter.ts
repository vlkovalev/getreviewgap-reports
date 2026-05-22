import { demoProducts } from "./demo-data"
import type { ScraperAdapter } from "./base"

export const demoStoreAdapter: ScraperAdapter = {
  id: "demo-store",
  name: "Demo Store Adapter",
  async scrape(source, targetUrls) {
    if (source.status === "BLOCKED") {
      return { products: [], blocked: true, errorMessage: "Source is blocked by policy configuration.", log: ["Blocked source skipped."] }
    }
    return {
      products: demoProducts.filter((product) => product.sourceId === source.id || targetUrls.includes(product.url)),
      log: [`Demo adapter used for ${source.name}.`, "No live third-party request was made.", "Respect source policies before enabling live adapters."]
    }
  }
}
