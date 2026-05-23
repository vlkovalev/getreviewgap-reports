import Link from "next/link"
import { DashboardShell, StatusBadge } from "@/components/dashboard/DashboardShell"
import { reportRowsForExport } from "@/lib/reports/report-engine"
import { getStore } from "@/lib/scrapers/store"
import { getCurrentCustomer } from "@/lib/customer-session"
import { getDb, hasRealDatabaseUrl } from "@/lib/db"
import type { IntelligenceReport, ReportFilters, ReportType } from "@/lib/scrapers/types"

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const customer = await getCurrentCustomer()
  if (!customer) {
    return (
      <DashboardShell title="Sign in to view this report" description="Saved reports and downloads are private to your account.">
        <Link href="/login" className="rounded-full bg-lime px-5 py-3 font-black text-black">Sign in</Link>
      </DashboardShell>
    )
  }
  const report = hasRealDatabaseUrl()
    ? await getDb().intelligenceReport.findFirst({ where: { id, customerId: customer.id } }).then((item) => item ? ({
      id: item.id,
      customerId: item.customerId ?? undefined,
      reportType: item.reportType as ReportType,
      title: item.title,
      status: item.status,
      filters: (item.filters as ReportFilters) ?? {},
      summary: (item.summary as Record<string, unknown>) ?? {},
      data: (item.data as Record<string, unknown>) ?? {},
      generatedAt: item.generatedAt?.toISOString(),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString()
    } satisfies IntelligenceReport) : null)
    : getStore().reports.find((item) => item.id === id && item.customerId === customer.id)

  if (!report) {
    return (
      <DashboardShell title="Report not found" description="Generate a new report from the reports page.">
        <Link href="/dashboard/reports" className="rounded-full bg-lime px-5 py-3 font-black text-black">Back to reports</Link>
      </DashboardShell>
    )
  }

  const rows = reportRowsForExport(report)
  const headers = Object.keys(rows[0] ?? {})
  const insight = report.data?.insight as ReviewInsightLike | undefined
  const reviewCount = Number(report.summary?.reviewCount ?? insight?.dataQuality?.reviewCount ?? 0)
  const dataScore = scoreDataQuality(report.summary ?? {}, insight)
  const productUrl = String(report.summary?.productUrl ?? report.filters?.productUrl ?? "")
  const shouldRerun = reviewCount === 0 && Boolean(productUrl)
  const freshReportHref = productUrl ? createFreshReportHref(report, productUrl) : ""
  const archivedAt = report.summary?.archivedAt ? String(report.summary.archivedAt) : ""
  const platform = report.summary?.platform
    ? String(report.summary.platform)
    : report.summary?.marketplace
      ? (String(report.summary.marketplace).toLowerCase().includes("shopify") ? "shopify" : "amazon")
      : "mixed"

  return (
    <DashboardShell title={cleanReportTitle(report.title)} description="Executive review intelligence brief with actions, proof points, and export-ready appendix.">
      {archivedAt ? (
        <section className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <p className="text-sm font-black uppercase text-white/45">Archived report</p>
          <p className="mt-2 text-white/70">This report was archived on {new Date(archivedAt).toLocaleDateString()} and remains available for export or restoration from My reports.</p>
        </section>
      ) : null}
      {shouldRerun ? (
        <section className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-yellow-300/25 bg-yellow-300/10 p-5">
          <div>
            <p className="text-sm font-black uppercase text-yellow-300">Saved empty report</p>
            <p className="mt-2 max-w-2xl text-white/76">This report is a historical export and will not update when the review connector changes. Run a new analysis to test current live collection.</p>
          </div>
          <Link href={freshReportHref} className="rounded-full bg-lime px-5 py-3 font-black text-black">Run fresh analysis</Link>
        </section>
      ) : null}
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
        <div className="border-b border-white/10 bg-gradient-to-br from-lime/20 via-white/[0.04] to-cyan/10 p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={report.status} />
                <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-black uppercase text-white/55">{String(report.reportType).replaceAll("_", " ")}</span>
              </div>
              <p className="mt-6 text-sm font-black uppercase text-lime">ReviewGap brief</p>
              <h1 className="mt-2 text-4xl font-black leading-none md:text-6xl">{String(report.summary?.productName ?? "Product review analysis")}</h1>
              <p className="mt-4 max-w-2xl text-white/70">
                {report.summary?.productUrl ? <a href={String(report.summary.productUrl)} target="_blank" rel="noreferrer" className="hover:text-lime">{displayUrl(String(report.summary.productUrl))}</a> : "No product URL supplied"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={`/api/scraper/reports/${report.id}/export?format=pdf`} className="rounded-full bg-lime px-4 py-2 text-sm font-black text-black">PDF</a>
              <a href={`/api/scraper/reports/${report.id}/export?format=csv`} className="rounded-full bg-white px-4 py-2 text-sm font-black text-black">CSV</a>
              <a href={`/api/scraper/reports/${report.id}/export?format=json`} className="rounded-full border border-white/10 px-4 py-2 text-sm font-black">JSON</a>
            </div>
          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-3 lg:grid-cols-7">
            <Metric label="Written reviews" value={String(reviewCount)} />
            <Metric label="Depth" value={String(report.summary?.reviewDepth ?? "Default")} />
            <Metric label="Platform" value={platform === "shopify" ? "Shopify / DTC" : platform === "amazon" ? "Amazon" : "Mixed / demo"} />
            <Metric label="Source" value={String(report.summary?.source ?? report.summary?.sourceFilter ?? "demo")} />
            <Metric label="Confidence" value={dataScore.label} tone={dataScore.tone} />
            <Metric label="Sample pages" value={String(report.summary?.pagesFetched ?? "-")} />
            <Metric label="Generated" value={String(report.generatedAt ? new Date(report.generatedAt).toLocaleDateString() : "-")} />
          </div>
        </div>

        <div className="grid gap-5 p-6 md:p-8 lg:grid-cols-[1.1fr_.9fr]">
          <section className="rounded-2xl border border-lime/20 bg-lime/10 p-5">
            <p className="text-sm font-black uppercase text-lime">Executive summary</p>
            <p className="mt-3 text-lg leading-relaxed text-white/84">{String(report.summary?.executiveSummary ?? summarizeObject(report.summary))}</p>
          </section>
          <section className="rounded-2xl border border-white/10 bg-black/25 p-5">
            <p className="text-sm font-black uppercase text-cyan">Next best actions</p>
            <div className="mt-4 grid gap-3">
              {nextActions(insight).map((item) => <ActionItem key={item} text={item} />)}
            </div>
          </section>
        </div>
        <section className="mx-6 mb-6 rounded-2xl border border-white/10 bg-black/25 p-5 md:mx-8 md:mb-8">
          <p className="text-sm font-black uppercase text-cyan">Evidence scope</p>
          <p className="mt-2 text-white/74">{String(report.summary?.sampleNote ?? confidenceNote(reviewCount))}</p>
          <p className="mt-2 text-sm text-white/55">{confidenceNote(reviewCount)} Marketplace rating counts may include star-only ratings or records the provider cannot return as written text. Customer-reported complaints require human review before product or safety decisions.</p>
        </section>
      </section>

      {report.summary?.warning ? (
        <section className="mt-6 rounded-2xl border border-yellow-300/25 bg-yellow-300/10 p-5 text-yellow-50/82">
          <p className="text-sm font-black uppercase text-yellow-300">Data source warning</p>
          <p className="mt-2">{String(report.summary.warning)}</p>
        </section>
      ) : null}

      {insight ? (
        <>
          <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-black uppercase text-lime">Decision snapshot</p>
                <h2 className="mt-2 text-2xl font-black">What to act on first</h2>
              </div>
              <p className="text-sm text-white/45">Evidence-led findings from {reviewCount} review{reviewCount === 1 ? "" : "s"}</p>
            </div>
            <div className="mt-5 grid gap-3 lg:grid-cols-3">
              <SnapshotItem label="Main friction" title={insight.topComplaints?.[0]?.theme ?? "No complaint signal"} body={insight.topComplaints?.[0]?.productImplication ?? "Collect more reviews before choosing a product response."} tone="coral" />
              <SnapshotItem label="Winning signal" title={insight.topCompliments?.[0]?.theme ?? "No positive signal"} body={insight.topCompliments?.[0]?.marketingImplication ?? "No validated marketing claim is available yet."} tone="lime" />
              <SnapshotItem label="Recommended move" title={insight.productImprovementIdeas?.[0]?.idea ?? "Increase evidence"} body={insight.productImprovementIdeas?.[0]?.whyItMatters ?? "Add more customer review text to increase confidence."} tone="cyan" />
            </div>
          </section>

          <section className="mt-6 grid gap-4 lg:grid-cols-2">
            <EvidenceList title="Top complaints to exploit or avoid" items={insight.topComplaints?.map((item) => ({
              title: item.theme,
              eyebrow: `Severity: ${item.severity}`,
              body: item.evidence,
              footer: item.productImplication
            })) ?? []} tone="coral" />
            <EvidenceList title="Strengths customers already value" items={insight.topCompliments?.map((item) => ({
              title: item.theme,
              eyebrow: "Positive signal",
              body: item.evidence,
              footer: item.marketingImplication
            })) ?? []} tone="lime" />
          </section>

          <section className="mt-6 grid gap-4 lg:grid-cols-[.9fr_1.1fr]">
            <BriefPanel title="Buyer language" tone="cyan">
              <div className="flex flex-wrap gap-2">
                {insight.buyerLanguage?.length ? insight.buyerLanguage.slice(0, 16).map((item) => (
                  <span key={item} className="rounded-full border border-cyan/20 bg-cyan/10 px-3 py-2 text-sm font-bold text-cyan">{item}</span>
                )) : <EmptyText text="No buyer phrases were available in this report." />}
              </div>
            </BriefPanel>
            <BriefPanel title="Product improvement ideas" tone="yellow">
              <div className="grid gap-3">
                {insight.productImprovementIdeas?.length ? insight.productImprovementIdeas.slice(0, 5).map((item) => (
                  <div key={item.idea} className="rounded-xl bg-black/25 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-black">{item.idea}</p>
                      <span className="rounded-full bg-yellow-300/15 px-2 py-1 text-xs font-black uppercase text-yellow-300">{item.confidence}</span>
                    </div>
                    <p className="mt-2 text-sm text-white/64">{item.whyItMatters}</p>
                  </div>
                )) : <EmptyText text="No product ideas were available in this report." />}
              </div>
            </BriefPanel>
          </section>

          <section className="mt-6 grid gap-4 lg:grid-cols-2">
            <SimpleList title="Ad hooks" items={insight.adHooks ?? []} tone="lime" />
            <SimpleList title="Positioning angles" items={insight.positioningAngles ?? []} tone="cyan" />
          </section>

          <section className="mt-6 grid gap-4 lg:grid-cols-2">
            <SimpleList title="Assumptions" items={insight.assumptions ?? []} tone="yellow" />
            <SimpleList title="Data limitations" items={insight.dataQuality?.limitations ?? []} tone="coral" />
          </section>
        </>
      ) : null}

      <section className="mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase text-white/40">Appendix</p>
            <h2 className="text-2xl font-black">Structured report rows</h2>
          </div>
          <p className="text-sm text-white/50">{rows.length} rows</p>
        </div>
        {rows.length && headers.length ? (
          <table className="w-full text-left text-sm">
            <thead className="text-white/50"><tr>{headers.map((header) => <th key={header} className="min-w-32 py-2 pr-5">{formatHeader(header)}</th>)}</tr></thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index} className="border-t border-white/10">
                  {headers.map((header) => <td key={header} className="py-3 pr-5 align-top">{renderCell(row[header])}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        ) : <EmptyText text="No structured rows were produced for this report." />}
      </section>
    </DashboardShell>
  )
}

type ReviewInsightLike = {
  executiveSummary?: string
  topComplaints?: Array<{ theme: string; evidence: string; severity: string; productImplication: string }>
  topCompliments?: Array<{ theme: string; evidence: string; marketingImplication: string }>
  buyerLanguage?: string[]
  productImprovementIdeas?: Array<{ idea: string; whyItMatters: string; confidence: string }>
  adHooks?: string[]
  positioningAngles?: string[]
  assumptions?: string[]
  dataQuality?: { reviewCount?: number; limitations?: string[] }
}

function Metric({ label, value, tone = "white" }: { label: string; value: string; tone?: "white" | "lime" | "yellow" | "coral" }) {
  const color = tone === "lime" ? "text-lime" : tone === "yellow" ? "text-yellow-300" : tone === "coral" ? "text-coral" : "text-white"
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <p className="text-xs font-black uppercase text-white/40">{label}</p>
      <p className={`mt-2 break-words text-xl font-black ${color}`}>{value}</p>
    </div>
  )
}

function BriefPanel({ title, tone, children }: { title: string; tone: "coral" | "lime" | "cyan" | "yellow"; children: React.ReactNode }) {
  const color = toneClass(tone)
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <h2 className={`text-xl font-black ${color}`}>{title}</h2>
      <div className="mt-4">{children}</div>
    </article>
  )
}

function EvidenceList({ title, items, tone }: { title: string; items: Array<{ title: string; eyebrow: string; body: string; footer: string }>; tone: "coral" | "lime" }) {
  return (
    <BriefPanel title={title} tone={tone}>
      <div className="grid gap-3">
        {items.length ? items.slice(0, 5).map((item) => (
          <article key={`${item.title}-${item.body}`} className="rounded-xl bg-black/25 p-4">
            <p className="text-xs font-black uppercase text-white/38">{item.eyebrow}</p>
            <h3 className="mt-1 font-black text-white">{item.title}</h3>
            <p className="mt-2 text-sm text-white/64">{item.body}</p>
            <p className="mt-3 rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm font-bold text-white/76">{item.footer}</p>
          </article>
        )) : <EmptyText text="No evidence was available in this section." />}
      </div>
    </BriefPanel>
  )
}

function SimpleList({ title, items, tone }: { title: string; items: string[]; tone: "coral" | "lime" | "cyan" | "yellow" }) {
  return (
    <BriefPanel title={title} tone={tone}>
      <ul className="grid gap-2 text-sm text-white/70">
        {items.length ? items.slice(0, 8).map((item) => <li key={item} className="rounded-xl bg-black/25 p-3">{item}</li>) : <li><EmptyText text="No items were available in this section." /></li>}
      </ul>
    </BriefPanel>
  )
}

function ActionItem({ text }: { text: string }) {
  return <p className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm font-bold text-white/76">{text}</p>
}

function SnapshotItem({ label, title, body, tone }: { label: string; title: string; body: string; tone: "coral" | "lime" | "cyan" }) {
  return (
    <article className="rounded-xl border border-white/10 bg-black/25 p-5">
      <p className={`text-xs font-black uppercase ${toneClass(tone)}`}>{label}</p>
      <h3 className="mt-3 text-xl font-black">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-white/65">{body}</p>
    </article>
  )
}

function EmptyText({ text }: { text: string }) {
  return <p className="rounded-xl border border-dashed border-white/15 p-4 text-sm text-white/45">{text}</p>
}

function nextActions(insight: ReviewInsightLike | undefined) {
  const ideas = insight?.productImprovementIdeas?.map((item) => item.idea) ?? []
  const complaints = insight?.topComplaints?.map((item) => `Address "${item.theme}" in product, listing, or support copy.`) ?? []
  const hooks = insight?.adHooks?.map((item) => `Test hook: ${item}`) ?? []
  return [...ideas, ...complaints, ...hooks].slice(0, 4).length ? [...ideas, ...complaints, ...hooks].slice(0, 4) : [
    "Collect more review data before making product decisions.",
    "Paste reviews manually if the connector returns no text.",
    "Use the data warning to decide whether this report is ready to share."
  ]
}

function scoreDataQuality(summary: Record<string, unknown>, insight: ReviewInsightLike | undefined) {
  const count = Number(summary?.reviewCount ?? insight?.dataQuality?.reviewCount ?? 0)
  if (count >= 100) return { label: "High", tone: "lime" as const }
  if (count >= 20) return { label: "Medium", tone: "yellow" as const }
  return { label: "Low", tone: "coral" as const }
}

function confidenceNote(reviewCount: number) {
  if (reviewCount >= 100) return "A larger sample can reveal stronger recurring themes, though it is still not proof of a defect."
  if (reviewCount >= 20) return "This sample is useful for directional patterns, but not complete market evidence."
  return "This small sample identifies early signals only; collect more reviews before making decisions."
}

function cleanReportTitle(title: string) {
  return title.replace("Review and Rating Report", "Review Intelligence Brief")
}

function toneClass(tone: "coral" | "lime" | "cyan" | "yellow") {
  return tone === "coral" ? "text-coral" : tone === "lime" ? "text-lime" : tone === "cyan" ? "text-cyan" : "text-yellow-300"
}

function summarizeObject(value: unknown) {
  if (!value || typeof value !== "object") return "This report is ready for review."
  return Object.entries(value as Record<string, unknown>).slice(0, 4).map(([key, item]) => `${formatHeader(key)}: ${renderPlain(item)}`).join(" | ")
}

function renderPlain(value: unknown) {
  if (Array.isArray(value)) return `${value.length} items`
  if (value && typeof value === "object") return "available"
  return String(value ?? "-")
}

function renderCell(value: unknown) {
  if (Array.isArray(value) || (value && typeof value === "object")) return <span className="font-mono text-xs text-white/60">{JSON.stringify(value)}</span>
  return String(value ?? "-")
}

function formatHeader(value: string) {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function displayUrl(value: string) {
  try {
    const url = new URL(value)
    return `${url.hostname.replace(/^www\./, "")}${url.pathname}`.slice(0, 100)
  } catch {
    return value.slice(0, 100)
  }
}

function createFreshReportHref(report: IntelligenceReport, productUrl: string) {
  const params = new URLSearchParams({
    productUrl,
    productName: String(report.summary?.productName ?? report.filters?.productName ?? ""),
    platform: String(report.summary?.platform ?? report.filters?.platform ?? "amazon")
  })
  return `/dashboard/reports?${params.toString()}`
}
