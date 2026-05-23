"use client"

import Link from "next/link"
import { useState } from "react"
import type { IntelligenceReport, ReportType, ScraperSource } from "@/lib/scrapers/types"
import { trackClientEvent } from "@/components/AnalyticsBeacon"

const reportTypes: Array<{ value: ReportType; label: string }> = [
  { value: "REVIEW_RATING", label: "Review and Rating" },
  { value: "EXECUTIVE_SUMMARY", label: "Review Intelligence Summary" },
  { value: "DATA_QUALITY", label: "Review Data Quality" }
]

export function ReportsClient({
  initialReports,
  sources,
  credits,
  signedIn,
  initialProductUrl = "",
  initialProductName = "",
  initialPlatform = "amazon"
}: {
  initialReports: IntelligenceReport[]
  sources: ScraperSource[]
  credits: number
  signedIn: boolean
  initialProductUrl?: string
  initialProductName?: string
  initialPlatform?: "amazon" | "shopify"
}) {
  const [reports, setReports] = useState(initialReports)
  const [creditCount, setCreditCount] = useState(credits)
  const [reportType, setReportType] = useState<ReportType>("REVIEW_RATING")
  const [platform, setPlatform] = useState<"amazon" | "shopify">(initialPlatform)
  const [sourceId, setSourceId] = useState("")
  const [productUrl, setProductUrl] = useState(initialProductUrl)
  const [productName, setProductName] = useState(initialProductName)
  const [competitorName, setCompetitorName] = useState("")
  const [pastedReviews, setPastedReviews] = useState("")
  const [importedFileName, setImportedFileName] = useState("")
  const [status, setStatus] = useState("")
  const canGenerate = signedIn && creditCount > 0

  async function importReviews(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    if (!file) return
    const text = await file.text()
    const cleanText = text.trim().slice(0, 30000)
    if (!cleanText) {
      setStatus("This review file is empty. Choose a CSV or text export containing customer review content.")
      return
    }
    setPastedReviews(cleanText)
    setImportedFileName(file.name)
    setStatus(`Loaded ${file.name}. Review the text, then generate your report.`)
  }

  async function generate() {
    if (!signedIn) {
      setStatus("Sign in before generating reports so the report can be saved to your account.")
      return
    }
    if (creditCount <= 0) {
      setStatus("You are out of report credits. Buy a single report, pack, or monthly credits to continue.")
      return
    }
    if (platform === "shopify" && !pastedReviews.trim()) {
      setStatus("Paste Shopify review text or an approved review-app export before generating. Automated Shopify review collection is not connected yet.")
      return
    }
    setStatus("Generating report...")
    const response = await fetch("/api/scraper/reports", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        reportType,
        platform,
        sourceId: sourceId || undefined,
        productUrl: productUrl || undefined,
        productName: productName || undefined,
        competitorName: competitorName || undefined,
        pastedReviews: pastedReviews || undefined
      })
    })
    const payload = await response.json()
    if (!response.ok) {
      setStatus(payload.details ? `${payload.error ?? "Report failed"}: ${payload.details}` : payload.error ?? "Report failed")
      trackClientEvent("report_generation_failed", { reportType, status: response.status })
      return
    }
    setReports((current) => [payload.report, ...current])
    if (typeof payload.credits === "number") setCreditCount(payload.credits)
    setStatus("Report generated. Open it or export it below.")
    trackClientEvent("report_generated", {
      reportType,
      source: payload.report?.summary?.source ?? "stored",
      hasProductUrl: Boolean(productUrl),
      hasPastedReviews: Boolean(pastedReviews)
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <h2 className="text-2xl font-black">Generate report</h2>
        <p className="mt-3 text-sm text-white/60">
          Generate buyer-sentiment intelligence from Amazon reviews or Shopify/DTC review exports. Price, contact-data, and broad marketplace scraping are intentionally not offered as paid services.
        </p>
        {initialProductUrl ? (
          <p className="mt-4 rounded-xl border border-lime/25 bg-lime/10 p-4 text-sm text-white/76">
            Product loaded from a saved report. Click generate below to create a new analysis with the current connector.
          </p>
        ) : null}
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
        <div className="mt-4 grid gap-2 text-sm">
          <span className="text-white/70">Review source</span>
          <div className="grid grid-cols-2 rounded-xl border border-white/10 bg-black p-1">
            <button type="button" onClick={() => setPlatform("amazon")} className={`rounded-lg px-3 py-3 font-bold ${platform === "amazon" ? "bg-lime text-black" : "text-white/65"}`}>Amazon</button>
            <button type="button" onClick={() => setPlatform("shopify")} className={`rounded-lg px-3 py-3 font-bold ${platform === "shopify" ? "bg-lime text-black" : "text-white/65"}`}>Shopify / DTC</button>
          </div>
        </div>
        <label className="mt-4 grid gap-2 text-sm">
          <span className="text-white/70">{platform === "amazon" ? "Amazon product URL, optional" : "Shopify product URL, optional"}</span>
          <input value={productUrl} onChange={(event) => setProductUrl(event.target.value)} type="url" placeholder={platform === "amazon" ? "https://www.amazon.com/dp/..." : "https://yourstore.com/products/..."} className="rounded-xl border border-white/10 bg-black px-4 py-3 text-white" />
          <span className="text-xs text-white/45">{platform === "amazon" ? "Automatic Amazon collection uses the configured structured API; import a review export when a marketplace limits access." : "For Shopify, import or paste reviews exported from your store or review app. A direct connector can be added once your provider is selected."}</span>
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
          <span className="text-white/70">Paste reviews{platform === "shopify" ? " (required for Shopify now)" : ", optional"}</span>
          <textarea value={pastedReviews} onChange={(event) => setPastedReviews(event.target.value)} rows={5} placeholder={platform === "shopify" ? "Paste Shopify review export text, one review per line." : "Paste one review per line, or let Amazon collection fetch available reviews."} className="rounded-xl border border-white/10 bg-black px-4 py-3 text-white" />
          <div className="rounded-xl border border-dashed border-white/15 bg-black/25 p-4">
            <label className="flex cursor-pointer flex-wrap items-center justify-between gap-3">
              <span>
                <span className="block font-bold text-white/75">Import review file</span>
                <span className="mt-1 block text-xs text-white/45">CSV or TXT export, up to 30,000 characters</span>
              </span>
              <span className="rounded-full border border-white/15 px-4 py-2 text-xs font-black">Choose file</span>
              <input type="file" accept=".csv,.txt,text/csv,text/plain" onChange={importReviews} className="sr-only" />
            </label>
            {importedFileName ? <p className="mt-3 text-xs font-bold text-lime">Loaded: {importedFileName}</p> : null}
          </div>
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
                  <p className="text-xs text-white/50">{report.status} - {report.generatedAt}</p>
                  {isEmptyReport(report) ? <p className="mt-2 text-xs font-bold text-yellow-300">Saved empty report - it does not update automatically.</p> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {isEmptyReport(report) && productHref(report) ? (
                    <Link href={productHref(report)!} className="rounded-full bg-lime px-3 py-2 text-xs font-black text-black">Run fresh analysis</Link>
                  ) : null}
                  <Link href={`/dashboard/reports/${report.id}`} className="rounded-full bg-white px-3 py-2 text-xs font-black text-black">View</Link>
                  <a onClick={() => trackClientEvent("report_export_started", { reportId: report.id, format: "csv" })} href={`/api/scraper/reports/${report.id}/export?format=csv`} className="rounded-full border border-white/10 px-3 py-2 text-xs font-black">CSV</a>
                  <a onClick={() => trackClientEvent("report_export_started", { reportId: report.id, format: "json" })} href={`/api/scraper/reports/${report.id}/export?format=json`} className="rounded-full border border-white/10 px-3 py-2 text-xs font-black">JSON</a>
                  <a onClick={() => trackClientEvent("report_export_started", { reportId: report.id, format: "pdf" })} href={`/api/scraper/reports/${report.id}/export?format=pdf`} className="rounded-full border border-white/10 px-3 py-2 text-xs font-black">PDF</a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function isEmptyReport(report: IntelligenceReport) {
  return Number(report.summary?.reviewCount ?? 0) === 0
}

function productHref(report: IntelligenceReport) {
  const productUrl = String(report.summary?.productUrl ?? report.filters?.productUrl ?? "")
  if (!productUrl) return null
  const params = new URLSearchParams({
    productUrl,
    productName: String(report.summary?.productName ?? report.filters?.productName ?? ""),
    platform: String(report.summary?.platform ?? report.filters?.platform ?? "amazon")
  })
  return `/dashboard/reports?${params.toString()}`
}
