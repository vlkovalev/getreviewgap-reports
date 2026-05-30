"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import type { IntelligenceReport, ReportType, ScraperSource } from "@/lib/scrapers/types"
import { trackClientEvent } from "@/components/AnalyticsBeacon"

const reportTypes: Array<{ value: ReportType; label: string }> = [
  { value: "REVIEW_RATING", label: "Review and Rating" },
  { value: "EXECUTIVE_SUMMARY", label: "Review Intelligence Summary" },
  { value: "DATA_QUALITY", label: "Review Data Quality" }
]

const reviewDepths = [
  { value: 5, label: "Quick", caption: "5 pages", helper: "Fast preview with lower provider cost." },
  { value: 10, label: "Standard", caption: "10 pages", helper: "Best default for most product checks." },
  { value: 50, label: "Deep", caption: "50 pages", helper: "Maximum coverage for serious research." }
] as const

const shopifyReviewApps = [
  { value: "judgeme", label: "Judge.me", helper: "Export reviews from Judge.me as CSV, then upload or paste them here." },
  { value: "loox", label: "Loox", helper: "Use a Loox review export or copied review text from your approved source." },
  { value: "yotpo", label: "Yotpo", helper: "Import a Yotpo CSV export or paste authorized review text." },
  { value: "okendo", label: "Okendo", helper: "Use an Okendo export with review body, rating, and product fields." },
  { value: "stamped", label: "Stamped", helper: "Upload a Stamped CSV/TXT export or paste review rows." },
  { value: "shopify-product-reviews", label: "Shopify Product Reviews", helper: "Use the review export from Shopify's legacy review app." },
  { value: "other", label: "Other / custom", helper: "Any CSV or TXT file works if it includes customer review text." }
] as const

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
  const [reviewPageLimit, setReviewPageLimit] = useState<5 | 10 | 50>(10)
  const [reviewApp, setReviewApp] = useState<typeof shopifyReviewApps[number]["value"]>("judgeme")
  const [detectedApp, setDetectedApp] = useState<string | null>(null)
  const [detecting, setDetecting] = useState(false)
  const [showAppOverride, setShowAppOverride] = useState(false)
  const [sourceId, setSourceId] = useState("")
  const [productUrl, setProductUrl] = useState(initialProductUrl)
  const [productName, setProductName] = useState(initialProductName)
  const [competitorName, setCompetitorName] = useState("")
  const [pastedReviews, setPastedReviews] = useState("")
  const [importedFileName, setImportedFileName] = useState("")
  const [status, setStatus] = useState("")
  const [showArchived, setShowArchived] = useState(false)
  const [busyReportId, setBusyReportId] = useState("")
  const canGenerate = signedIn && creditCount > 0
  const visibleReports = reports.filter((report) => isArchived(report) === showArchived)

  useEffect(() => {
    try {
      const stored = localStorage.getItem("reviewgap_report_preferences")
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.reportType) setReportType(parsed.reportType)
        if (parsed.platform && !initialProductUrl) setPlatform(parsed.platform)
        if (parsed.reviewPageLimit) setReviewPageLimit(Number(parsed.reviewPageLimit) as 5 | 10 | 50)
        if (parsed.reviewApp) setReviewApp(parsed.reviewApp)
      }
    } catch (e) {
      console.error("Failed to load presets from local storage", e)
    }
  }, [initialProductUrl])

  async function detectReviewApp(url: string) {
    if (!url.trim() || platform !== "shopify") return
    try {
      new URL(url)
    } catch {
      return
    }
    setDetecting(true)
    setDetectedApp(null)
    try {
      const res = await fetch(`/api/scraper/detect-review-app?url=${encodeURIComponent(url)}`)
      if (res.ok) {
        const data = await res.json()
        if (data.app && shopifyReviewApps.some((a) => a.value === data.app)) {
          setDetectedApp(data.app)
          setReviewApp(data.app as typeof shopifyReviewApps[number]["value"])
        } else {
          setDetectedApp(null)
        }
      }
    } catch {
      // silent — detection is best-effort
    } finally {
      setDetecting(false)
    }
  }

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
    // Apps that support direct collection via a product URL
    const directCollectionApps = ["judgeme", "stamped", "loox", "yotpo", "okendo"]
    if (platform === "shopify" && !pastedReviews.trim()) {
      if (directCollectionApps.includes(reviewApp) && !productUrl.trim()) {
        setStatus(`Add a Shopify product URL to use the ${reviewApp === "judgeme" ? "Judge.me" : "Stamped"} connector, or upload a CSV/TXT export.`)
        return
      }
      if (!directCollectionApps.includes(reviewApp)) {
        setStatus("Upload a CSV/TXT file or paste review text from your review app, then generate the report.")
        return
      }
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
        pastedReviews: pastedReviews || undefined,
        reviewApp: platform === "shopify" ? reviewApp : undefined,
        reviewPageLimit
      })
    })
    const payload = await response.json()
    if (!response.ok) {
      const details = payload.details
        ? typeof payload.details === "string"
          ? payload.details
          : JSON.stringify(payload.details)
        : null
      setStatus(details ? `${payload.error ?? "Report failed"}: ${details}` : payload.error ?? "Report failed")
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
      hasPastedReviews: Boolean(pastedReviews),
      reviewApp: platform === "shopify" ? reviewApp : undefined,
      reviewPageLimit
    })
  }

  async function setArchived(report: IntelligenceReport, action: "archive" | "restore") {
    setBusyReportId(report.id)
    const response = await fetch(`/api/scraper/reports/${report.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action })
    })
    const payload = await response.json()
    if (!response.ok) {
      setStatus(payload.error ?? "Could not update report.")
      setBusyReportId("")
      return
    }
    setReports((current) => current.map((item) => item.id === report.id ? {
      ...item,
      summary: payload.report.summary as Record<string, unknown>,
      updatedAt: payload.report.updatedAt instanceof Date ? payload.report.updatedAt.toISOString() : String(payload.report.updatedAt ?? item.updatedAt)
    } : item))
    setStatus(action === "archive" ? "Report archived. You can restore it from Archived reports." : "Report restored to active reports.")
    setBusyReportId("")
  }

  async function deleteReport(report: IntelligenceReport) {
    if (!window.confirm("Delete this report permanently? This cannot be undone.")) return
    setBusyReportId(report.id)
    const response = await fetch(`/api/scraper/reports/${report.id}`, { method: "DELETE" })
    const payload = await response.json()
    if (!response.ok) {
      setStatus(payload.error ?? "Could not delete report.")
      setBusyReportId("")
      return
    }
    setReports((current) => current.filter((item) => item.id !== report.id))
    setStatus("Report permanently deleted.")
    setBusyReportId("")
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
          <span className="text-white/70">{platform === "amazon" ? "Amazon product URL, optional" : "Shopify product URL"}</span>
          <div className="relative">
            <input
              value={productUrl}
              onChange={(event) => { setProductUrl(event.target.value); setDetectedApp(null); setShowAppOverride(false) }}
              onBlur={(event) => {
                let val = event.target.value.trim()
                if (val && !val.startsWith("http://") && !val.startsWith("https://")) {
                  val = `https://${val}`
                  setProductUrl(val)
                }
                detectReviewApp(val)
              }}
              type="url"
              placeholder={platform === "amazon" ? "https://www.amazon.com/dp/..." : "https://yourstore.com/products/..."}
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white"
            />
            {platform === "shopify" && detecting && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/40">Detecting…</span>
            )}
          </div>
          {platform === "shopify" && detectedApp && (
            <span className="flex items-center gap-1.5 text-xs text-lime">
              <span>✓</span>
              <span>Detected <strong>{shopifyReviewApps.find(a => a.value === detectedApp)?.label ?? detectedApp}</strong> — review app auto-selected</span>
            </span>
          )}
          {platform === "shopify" && !detectedApp && !detecting && productUrl && (
            <span className="text-xs text-white/40">Review app not auto-detected — select it manually below.</span>
          )}
          <span className="text-xs text-white/45">{platform === "amazon" ? "Automatic Amazon collection uses the configured structured API; import a review export when a marketplace limits access." : "Paste the product URL and we'll detect the review app automatically."}</span>
        </label>
        {platform === "shopify" ? (
          <div className="mt-4 rounded-2xl border border-cyan/20 bg-cyan/10 p-4">
            {/* Auto-detected: show badge + subtle override link */}
            {detectedApp && !showAppOverride ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-lime text-xs font-black text-ink">✓</span>
                  <span className="font-bold text-white">
                    {shopifyReviewApps.find(a => a.value === detectedApp)?.label ?? detectedApp} detected
                  </span>
                  <span className="text-white/50">— reviews will be collected automatically</span>
                </div>
                <button type="button" onClick={() => setShowAppOverride(true)} className="text-xs text-white/40 underline hover:text-white/70">
                  wrong app?
                </button>
              </div>
            ) : !productUrl.trim() || showAppOverride ? (
              /* No URL yet, or user requested override: show full selector */
              <label className="grid gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-black uppercase text-cyan">
                    {showAppOverride ? "Select the correct review app" : "Review app"}
                  </span>
                  {showAppOverride && (
                    <button type="button" onClick={() => { setShowAppOverride(false) }} className="text-xs text-white/40 underline hover:text-white/70">cancel</button>
                  )}
                </div>
                <select value={reviewApp} onChange={(event) => { setReviewApp(event.target.value as typeof shopifyReviewApps[number]["value"]); setShowAppOverride(false) }} className="rounded-xl border border-white/10 bg-black px-4 py-3 text-white">
                  {shopifyReviewApps.map((app) => <option key={app.value} value={app.value}>{app.label}</option>)}
                </select>
                {!productUrl.trim() && <p className="text-xs text-white/50">Or paste a product URL above and we'll detect it automatically.</p>}
              </label>
            ) : detecting ? (
              /* URL entered, detection in progress */
              <p className="text-sm text-white/50">Detecting review app…</p>
            ) : (
              /* URL entered, detection failed */
              <label className="grid gap-2 text-sm">
                <span className="font-black uppercase text-cyan">Select review app</span>
                <select value={reviewApp} onChange={(event) => setReviewApp(event.target.value as typeof shopifyReviewApps[number]["value"])} className="rounded-xl border border-white/10 bg-black px-4 py-3 text-white">
                  {shopifyReviewApps.map((app) => <option key={app.value} value={app.value}>{app.label}</option>)}
                </select>
                <p className="text-xs text-white/50">Couldn't auto-detect — select the review app this store uses.</p>
              </label>
            )}
            <div className="mt-4 rounded-xl border border-white/10 bg-black/25 p-4 text-xs text-white/58">
              <p className="font-bold text-white/78">CSV fallback</p>
              <p className="mt-1">If direct collection fails, upload or paste a review export below. Columns needed: review text, rating, title.</p>
            </div>
          </div>
        ) : null}
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
          <span className="text-white/70">{platform === "shopify" ? "Shopify review text or CSV rows" : "Paste reviews, optional"}</span>
          <textarea value={pastedReviews} onChange={(event) => setPastedReviews(event.target.value)} rows={5} placeholder={platform === "shopify" ? "Paste exported review rows here. Example: Great quality and fast shipping, 5 stars, Glow Serum" : "Paste one review per line, or let Amazon collection fetch available reviews."} className="rounded-xl border border-white/10 bg-black px-4 py-3 text-white" />
          <div className="rounded-xl border border-dashed border-white/15 bg-black/25 p-4">
            <label className="flex cursor-pointer flex-wrap items-center justify-between gap-3">
              <span>
                <span className="block font-bold text-white/75">{platform === "shopify" ? "Upload Shopify review export" : "Import review file"}</span>
                <span className="mt-1 block text-xs text-white/45">CSV or TXT, up to 30,000 characters. Keep customer private data out of the file.</span>
              </span>
              <span className="rounded-full border border-white/15 px-4 py-2 text-xs font-black">Choose file</span>
              <input type="file" accept=".csv,.txt,text/csv,text/plain" onChange={importReviews} className="sr-only" />
            </label>
            {importedFileName ? <p className="mt-3 text-xs font-bold text-lime">Loaded: {importedFileName}</p> : null}
          </div>
        </label>
        {platform === "amazon" && !pastedReviews.trim() ? (
          <div className="mt-4 grid gap-2 text-sm">
            <span className="text-white/70">Review depth</span>
            <div className="grid gap-2 sm:grid-cols-3">
              {reviewDepths.map((depth) => (
                <button
                  key={depth.value}
                  type="button"
                  onClick={() => setReviewPageLimit(depth.value)}
                  className={`rounded-xl border p-4 text-left transition ${reviewPageLimit === depth.value ? "border-lime bg-lime text-black" : "border-white/10 bg-black text-white hover:border-white/25"}`}
                >
                  <span className="block font-black">{depth.label}</span>
                  <span className={`mt-1 block text-xs font-bold ${reviewPageLimit === depth.value ? "text-black/70" : "text-white/55"}`}>{depth.caption}</span>
                  <span className={`mt-2 block text-xs ${reviewPageLimit === depth.value ? "text-black/70" : "text-white/45"}`}>{depth.helper}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-white/45">Each report still uses 1 credit. Deep reports may take longer and use more provider quota.</p>
          </div>
        ) : null}
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-black">Reports</h2>
          <div className="grid grid-cols-2 rounded-xl border border-white/10 bg-black p-1 text-sm">
            <button type="button" onClick={() => setShowArchived(false)} className={`rounded-lg px-4 py-2 font-bold ${!showArchived ? "bg-lime text-black" : "text-white/65"}`}>Active</button>
            <button type="button" onClick={() => setShowArchived(true)} className={`rounded-lg px-4 py-2 font-bold ${showArchived ? "bg-lime text-black" : "text-white/65"}`}>Archived</button>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          {visibleReports.length === 0 ? <p className="rounded-xl border border-dashed border-white/20 p-6 text-white/60">{showArchived ? "No archived reports." : "No active reports yet. Generate one to see the output and exports."}</p> : null}
          {visibleReports.map((report) => (
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
                  <button type="button" disabled={busyReportId === report.id} onClick={() => setArchived(report, showArchived ? "restore" : "archive")} className="rounded-full border border-white/10 px-3 py-2 text-xs font-black disabled:opacity-40">{showArchived ? "Restore" : "Archive"}</button>
                  <button type="button" disabled={busyReportId === report.id} onClick={() => deleteReport(report)} className="rounded-full border border-coral/30 px-3 py-2 text-xs font-black text-coral disabled:opacity-40">Delete</button>
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

function isArchived(report: IntelligenceReport) {
  return Boolean(report.summary?.archivedAt)
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
