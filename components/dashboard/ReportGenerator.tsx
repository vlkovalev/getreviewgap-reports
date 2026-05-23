"use client"

import { useEffect, useState } from "react"
import { ReportStatusBadge } from "@/components/ReportStatusBadge"
import type { StoredReport } from "@/lib/reports-store"

export function ReportGenerator() {
  const [reports, setReports] = useState<StoredReport[]>([])
  const [selected, setSelected] = useState<StoredReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [platform, setPlatform] = useState<"amazon" | "shopify">("amazon")

  useEffect(() => {
    fetch("/api/reports")
      .then((res) => res.json())
      .then((data) => setReports(data.reports || []))
      .catch(() => setError("Could not load reports."))
  }, [])

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError("")
    const formData = new FormData(event.currentTarget)
    const payload = {
      productUrl: formData.get("productUrl"),
      platform,
      productName: formData.get("productName"),
      competitorName: formData.get("competitorName"),
      email: formData.get("email"),
      pastedReviews: formData.get("pastedReviews"),
      website: formData.get("website")
    }

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.message || "Report generation failed.")
        return
      }

      setReports((current) => [data.report, ...current])
      setSelected(data.report)
    } catch {
      setError("Could not reach the report generator. Check that the dev server is running.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
      <form onSubmit={submit} className="card grid gap-4 p-6">
        <div>
          <h2 className="text-2xl font-black">Create competitor report</h2>
          <p className="mt-2 text-sm text-white/60">Use a product URL plus optional pasted reviews. If API keys are missing, the app returns a clearly marked demo report.</p>
        </div>
        <input className="hidden" name="website" tabIndex={-1} autoComplete="off" />
        <div className="grid gap-2 text-sm font-bold">
          Review source
          <div className="grid grid-cols-2 rounded-xl border border-white/10 bg-black/30 p-1">
            <button type="button" onClick={() => setPlatform("amazon")} className={`rounded-lg px-3 py-3 ${platform === "amazon" ? "bg-lime text-black" : "text-white/65"}`}>Amazon</button>
            <button type="button" onClick={() => setPlatform("shopify")} className={`rounded-lg px-3 py-3 ${platform === "shopify" ? "bg-lime text-black" : "text-white/65"}`}>Shopify / DTC</button>
          </div>
        </div>
        <label className="grid gap-2 text-sm font-bold">
          {platform === "amazon" ? "Amazon product URL" : "Shopify product URL"}
          <input name="productUrl" type="url" required placeholder={platform === "amazon" ? "https://www.amazon.com/dp/..." : "https://yourstore.com/products/..."} className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-lime" />
          <span className="text-xs font-normal text-white/50">{platform === "amazon" ? "Supports Amazon US, Canada, UK, Europe, Australia, Japan, India, Brazil, and Mexico." : "Paste reviews from a store export or approved review app export; direct collection is not connected yet."}</span>
        </label>
        <label className="grid gap-2 text-sm font-bold">
          Product name
          <input name="productName" placeholder="Glow serum" className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-lime" />
        </label>
        <label className="grid gap-2 text-sm font-bold">
          Competitor name
          <input name="competitorName" placeholder="Competitor brand" className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-lime" />
        </label>
        <label className="grid gap-2 text-sm font-bold">
          Email, optional
          <input name="email" type="email" placeholder="you@brand.com" className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-lime" />
        </label>
        <label className="grid gap-2 text-sm font-bold">
          Paste reviews{platform === "shopify" ? " (required for Shopify now)" : ", optional"}
          <textarea name="pastedReviews" required={platform === "shopify"} placeholder={platform === "shopify" ? "Paste Shopify customer review export text, one review per line." : "Paste one review per line to test with real text before Apify is configured."} className="min-h-36 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-lime" />
        </label>
        <button disabled={loading} className="btn-primary disabled:opacity-60">{loading ? "Generating..." : "Generate report"}</button>
        {error && <p className="rounded-2xl bg-red-400/15 p-3 text-sm text-red-100">{error}</p>}
      </form>

      <section className="card min-h-[520px] p-6">
        {selected ? (
          <ReportView report={selected} />
        ) : reports.length ? (
          <div>
            <h2 className="text-2xl font-black">Recent reports</h2>
            <div className="mt-5 grid gap-3">
              {reports.map((report) => (
                <button key={report.id} onClick={() => setSelected(report)} className="rounded-2xl border border-white/10 bg-white/7 p-4 text-left hover:border-lime/70">
                  <div className="flex items-center justify-between gap-3">
                    <strong>{report.productName}</strong>
                    <ReportStatusBadge status={report.status} />
                  </div>
                  <p className="mt-2 text-sm text-white/60">{report.reviewCount} reviews analyzed</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid min-h-[420px] place-items-center text-center">
            <div>
              <p className="font-black uppercase text-lime">Empty state</p>
              <h2 className="mt-3 text-3xl font-black">Run your first competitor report.</h2>
              <p className="mt-3 max-w-md text-white/60">Paste an Amazon URL and optional reviews to generate complaints, compliments, buyer language, ad hooks, and product ideas.</p>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

function ReportView({ report }: { report: StoredReport }) {
  const insight = report.summary
  if (!insight) {
    return <p className="text-white/70">No insight output is available for this report.</p>
  }

  return (
    <article>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black">{report.productName}</h2>
          <p className="mt-2 text-sm text-white/60">{report.reviewCount} reviews analyzed</p>
        </div>
        <ReportStatusBadge status={report.status} />
      </div>
      <p className="mt-6 rounded-2xl bg-white/8 p-4 text-white/76">{insight.executiveSummary}</p>
      <ReportList title="Top complaints" items={insight.topComplaints.map((item) => `${item.theme}: ${item.productImplication}`)} />
      <ReportList title="Top compliments" items={insight.topCompliments.map((item) => `${item.theme}: ${item.marketingImplication}`)} />
      <ReportList title="Buyer language" items={insight.buyerLanguage} />
      <ReportList title="Ad hooks" items={insight.adHooks} />
      <ReportList title="Product ideas" items={insight.productImprovementIdeas.map((item) => `${item.idea}: ${item.whyItMatters}`)} />
      <ReportList title="Assumptions" items={insight.assumptions} />
    </article>
  )
}

function ReportList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-6">
      <h3 className="font-black text-lime">{title}</h3>
      <ul className="mt-3 grid gap-2 text-sm text-white/70">
        {items.map((item) => <li key={item} className="rounded-xl bg-white/7 p-3">{item}</li>)}
      </ul>
    </div>
  )
}
