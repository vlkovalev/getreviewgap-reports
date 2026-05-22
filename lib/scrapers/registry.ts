import { demoStoreAdapter } from "./demo-store-adapter"
import { genericProductPageAdapter } from "./generic-product-page-adapter"

const adapters = [demoStoreAdapter, genericProductPageAdapter]

export function getScraperAdapter(sourceType: string) {
  return adapters.find((adapter) => adapter.id === sourceType) || demoStoreAdapter
}
