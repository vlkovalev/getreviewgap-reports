"use client"

import Link from "next/link"
import { useState } from "react"
import type { IntelligenceReport, ReportType, ScraperSource } from "@/lib/scrapers/types"

const reportTypes: Array<{ value: ReportType; label: string }> = [
  { value: "REVIEW_RATING", label: "Review and Rating" },
  { value: "EXECUTIVE_SUMMARY", label: "Review Intelligence Summary" },
  { value: "DATA_QUALITY", label: "Review Data Quality" }
]

export function ReportsClient({ initialReports, sources, credits, signedIn }: { initialReports: IntelligenceReport[]; sources: ScraperSource[]; credits: number; signedIn: boolean }) {
  const [reports, setReports] = useState(initialReports)
  const [creditCount, setCreditCount] = useState(credits)
  const [reportType, setReportType] = useState<ReportType>("REVIEW_RATING")
  const [sourceId, setSourceId] = useState("")
  const [productUrl, setProductUrl] = useState("")
  const [productName, setProductName] = useState("")
  const [competitorName, setCompetitorName] = useState("")
  const [pastedReviews, setPastedReviews] = useState("")
  const [status, setStatus] = useState("")
  const canGenerate = signedIn && creditCount > 0

  async function generate() {
    if (!signedIn) {
      setStatus("Sign in before generating reports so the report can be saved to your account.")
      return
    }
    if (creditCount <= 0) {
      setStatus("You are out of report credits. Buy a single report, pack, or monthly credits to continue.")
      return
    }
    setStatus("Generating report...")
    const response = await fetch("/api/scraper/reports", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        reportType,
        sourceId: sourceId || undefined,
        productUrl: productUrl || undefined,
        productName: productName || undefined,
        competitorName: competitorName || undefined,
        pastedReviews: pastedReviews || undefined
      })
    })
    const payload = await response.json()
    if (!response.ok) {
      setStatus(payload.error ?? "Report failed")
      return
    }
    setReports((current) => [payload.report, ...current])
    if (typeof payload.credits === "number") setCreditCount(payload.credits)
    setStatus("Report generated. Open it or export it below.")
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <h2 className="text-2xl font-black">Generate report</h2>
        <p className="mt-3 text-sm text-white/60">
          MVP focus: Amazon review intelligence. Price, ad, seller-contact, and broad marketplace scraping are intentionally not offered as paid services.
        </p>
        <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4">
          <p className="text-sm text-white/60">Report credits</p>
          <p className="mt-1 text-3xl font-black text-lime">{signedIn ? creditCount : "Sign in"}</p>
          {!signedIn ? <Link href="/login" className="mt-2 inline-flex text-sm font-bold text-lime">Sign in to use credits</Link> : null}
          {signedIn && creditCount <= 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/pricing" className="rounded-full bg-lime px-4 py-2 text-sm font-black text-black">Buy credits</Link>
              <Link href="/dashboard/billing" className="rounded-full border border-white/10 px-4 py-2 text-sm font-black">Billing</Link>
            </div>
          ) : null}
        </div>
        <label className="mt-5 grid gap-2 text-sm">
          <span className="text-white/70">Report type</span>
          <select value={reportType} onChange={(event) => setReportType(event.target.value as ReportType)} className="rounded-xl border border-white/10 bg-black px-4 py-3 text-white">
            {reportTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
          </select>
        </label>
        <label className="mt-4 grid gap-2 text-sm">
          <span className="text-white/70">Amazon product URL, optional</span>
          <input value={productUrl} onChange={(event) => setProductUrl(event.target.value)} type="url" placeholder="https://www.amazon.com/dp/..." className="rounded-xl border border-white/10 bg-black px-4 py-3 text-white" />
          <span className="text-xs text-white/45">Add a URL for live Apify/OpenAI review intelligence. Leave blank to use the demo dataset.</span>
        </label>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="grid gap-2 text-sm">
            <span className="text-white/70">Product name, optional</span>
            <input value={productName} onChange={(event) => setProductName(event.target.value)} placeholder="Vitamin C serum" className="rounded-xl border border-white/10 bg-black px-4 py-3 text-white" />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-white/70">Competitor, optional</span>
            <input value={competitorName} onChange={(event) => setCompetitorName(event.target.value)} placeholder="Competitor brand" className="rounded-xl border border-white/10 bg-black px-4 py-3 text-white" />
          </label>
        </div>
        <label className="mt-4 grid gap-2 text-sm">
          <span className="text-white/70">Paste reviews, optional</span>
          <textarea value={pastedReviews} onChange={(event) => setPastedReviews(event.target.value)} rows={4} placeholder="Paste one review per line to test with real text." className="rounded-xl border border-white/10 bg-black px-4 py-3 text-white" />
        </label>
        <label className="mt-4 grid gap-2 text-sm">
          <span className="text-white/70">Source filter</span>
          <select value={sourceId} onChange={(event) => setSourceId(event.target.value)} className="rounded-xl border border-white/10 bg-black px-4 py-3 text-white">
            <option value="">All sources</option>
            {sources.map((source) => <option key={source.id} value={source.id}>{source.name}</option>)}
          </select>
        </label>
        <button
          onClick={generate}
          disabled={!canGenerate}
          className={`mt-5 w-full rounded-full px-5 py-3 font-black ${canGenerate ? "bg-lime text-black hover:bg-lime/90" : "cursor-not-allowed border border-white/10 bg-white/10 text-white/45"}`}
        >
          {!signedIn ? "Sign in required" : creditCount <= 0 ? "Buy credits to generate" : "Use 1 credit and generate"}
        </button>
        {status ? (
          <div className="mt-4 rounded-xl border border-white/10 bg-black/25 p-4">
            <p className="text-sm text-white/70">{status}</p>
            {!signedIn ? <Link href="/login" className="mt-3 inline-flex text-sm font-black text-lime">Go to sign in</Link> : null}
            {signedIn && creditCount <= 0 ? <Link href="/pricing" className="mt-3 inline-flex text-sm font-black text-lime">View credit plans</Link> : null}
          </div>
        ) : null}
      </section>
      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <h2 className="text-2xl font-black">Reports</h2>
        <div className="mt-5 space-y-3">
          {reports.length === 0 ? <p className="rounded-xl border border-dashed border-white/20 p-6 text-white/60">No reports yet. Generate one to see the output and exports.</p> : null}
          {reports.map((report) => (
            <div key={report.id} className="rounded-xl border border-white/10 bg-black/30 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold">{report.title}</p>
                  <p className="text-xs text-white/50">{report.status} · {report.generatedAt}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/dashboard/reports/${report.id}`} className="rounded-full bg-white px-3 py-2 text-xs font-black text-black">View</Link>
                  <a href={`/api/scraper/reports/${report.id}/export?format=csv`} className="rounded-full border border-white/10 px-3 py-2 text-xs font-black">CSV</a>
                  <a href={`/api/scraper/reports/${report.id}/export?format=json`} className="rounded-full border border-white/10 px-3 py-2 text-xs font-black">JSON</a>
                  <a href={`/api/scraper/reports/${report.id}/export?format=pdf`} className="rounded-full border border-white/10 px-3 py-2 text-xs font-black">PDF</a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
