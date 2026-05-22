"use client"

import { useState } from "react"
import type { ScraperSource } from "@/lib/scrapers/types"

export function SourcesClient({ initialSources }: { initialSources: ScraperSource[] }) {
  const [sources, setSources] = useState(initialSources)
  const [status, setStatus] = useState("")

  async function createSource(formData: FormData) {
    const response = await fetch("/api/scraper/sources", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        baseUrl: formData.get("baseUrl"),
        sourceType: formData.get("sourceType") || "demo-store",
        rateLimitSeconds: formData.get("rateLimitSeconds") || 5,
        robotsNote: formData.get("robotsNote") || undefined,
        notes: formData.get("notes") || undefined
      })
    })
    const payload = await response.json()
    if (response.ok) setSources((current) => [payload.source, ...current])
    setStatus(response.ok ? "Review source saved." : payload.error)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
      <form action={createSource} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <h2 className="text-2xl font-black">Add review source</h2>
        <p className="mt-3 text-sm text-white/60">Use this to describe where review data will come from. Demo mode is safest while validating the product.</p>
        <label className="mt-5 block text-sm text-white/70">
          Source name
          <input suppressHydrationWarning name="name" required placeholder="Amazon skincare competitors" className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white" />
        </label>
        <label className="mt-3 block text-sm text-white/70">
          Website or marketplace
          <input suppressHydrationWarning name="baseUrl" required type="url" placeholder="https://www.amazon.com" className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white" />
        </label>
        <label className="mt-3 block text-sm text-white/70">
          Collection method
          <select suppressHydrationWarning name="sourceType" className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white">
            <option value="demo-store">Demo data only</option>
            <option value="generic-product-page">Approved adapter or API later</option>
          </select>
        </label>
        <label className="mt-3 block text-sm text-white/70">
          Minimum delay between requests
          <input suppressHydrationWarning name="rateLimitSeconds" type="number" min="1" max="120" defaultValue="5" className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white" />
        </label>
        <textarea suppressHydrationWarning name="robotsNote" placeholder="Compliance note, for example: use Apify actor or official API only where permitted." rows={3} className="mt-3 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white" />
        <textarea suppressHydrationWarning name="notes" placeholder="Internal notes for this review source" rows={3} className="mt-3 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white" />
        <button className="mt-4 w-full rounded-full bg-lime px-5 py-3 font-black text-black">Save review source</button>
        {status ? <p className="mt-4 text-sm text-white/65">{status}</p> : null}
      </form>
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <h2 className="text-2xl font-black">Review sources</h2>
        <div className="mt-5 space-y-3">
          {sources.map((source) => (
            <div key={source.id} className="rounded-xl border border-white/10 bg-black/30 p-4">
              <p className="font-bold">{source.name}</p>
              <p className="text-sm text-white/60">{source.baseUrl}</p>
              <p className="mt-2 text-xs uppercase text-lime">{source.status} · {source.sourceType} · {source.rateLimitSeconds}s delay</p>
              <p className="mt-2 text-xs text-white/45">{source.robotsNote}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
