import { NextResponse } from "next/server"
import { getStore } from "@/lib/scrapers/store"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const sourceId = url.searchParams.get("sourceId")
  const query = url.searchParams.get("q")?.toLowerCase()
  const store = getStore()
  const products = store.products
    .filter((product) => !sourceId || product.sourceId === sourceId)
    .filter((product) => !query || [product.title, product.brand, product.category, product.url].some((value) => value?.toLowerCase().includes(query)))
    .map((product) => ({ ...product, sourceName: store.sources.find((source) => source.id === product.sourceId)?.name ?? "Unknown source" }))
  return NextResponse.json({ products })
}
