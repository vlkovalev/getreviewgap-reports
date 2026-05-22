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
  const report = hasRealDatabaseUrl()
    ? await getDb().intelligenceReport.findFirst({ where: { id, ...(customer ? { customerId: customer.id } : {}) } }).then((item) => item ? ({
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
    : getStore().reports.find((item) => item.id === id && (!customer || !item.customerId || item.customerId === customer.id))
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

  return (
    <DashboardShell title={report.title} description="Full report view with summary, tabular output, and CSV/JSON/PDF export links.">
      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StatusBadge status={report.status} />
          <div className="flex gap-2">
            <a href={`/api/scraper/reports/${report.id}/export?format=csv`} className="rounded-full bg-white px-4 py-2 text-sm font-black text-black">Export CSV</a>
            <a href={`/api/scraper/reports/${report.id}/export?format=json`} className="rounded-full border border-white/10 px-4 py-2 text-sm font-black">Export JSON</a>
            <a href={`/api/scraper/reports/${report.id}/export?format=pdf`} className="rounded-full border border-white/10 px-4 py-2 text-sm font-black">Export PDF</a>
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <Metric label="Source" value={String(report.summary?.source ?? report.summary?.sourceFilter ?? "Demo")} />
          <Metric label="Reviews" value={String(report.summary?.reviewCount ?? "-")} />
          <Metric label="Provider" value={String(report.summary?.provider ?? "Report engine")} />
          <Metric label="Generated" value={String(report.generatedAt ? new Date(report.generatedAt).toLocaleDateString() : "-")} />
        </div>
        {report.summary?.warning ? (
          <div className="mt-5 rounded-2xl border border-yellow-300/25 bg-yellow-300/10 p-5 text-yellow-50/82">
            <p className="text-sm font-black uppercase text-yellow-300">Data source warning</p>
            <p className="mt-2">{String(report.summary.warning)}</p>
          </div>
        ) : null}
        <div className="mt-5 rounded-2xl border border-lime/20 bg-lime/10 p-5">
          <p className="text-sm font-black uppercase text-lime">Executive summary</p>
          <p className="mt-3 text-lg text-white/82">{String(report.summary?.executiveSummary ?? summarizeObject(report.summary))}</p>
        </div>
      </section>
      {insight ? (
        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <InsightList title="Top complaints" items={insight.topComplaints?.map((item) => `${item.theme}: ${item.productImplication}`) ?? []} tone="coral" />
          <InsightList title="Top compliments" items={insight.topCompliments?.map((item) => `${item.theme}: ${item.marketingImplication}`) ?? []} tone="lime" />
          <InsightList title="Buyer language" items={insight.buyerLanguage ?? []} tone="cyan" />
          <InsightList title="Product ideas" items={insight.productImprovementIdeas?.map((item) => `${item.idea}: ${item.whyItMatters}`) ?? []} tone="yellow" />
        </section>
      ) : null}
      <section className="mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-black">Report rows</h2>
          <p className="text-sm text-white/50">{rows.length} rows</p>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="text-white/50"><tr>{headers.map((header) => <th key={header} className="min-w-32 py-2">{header}</th>)}</tr></thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-t border-white/10">
                {headers.map((header) => <td key={header} className="py-3 align-top">{renderCell(row[header])}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </DashboardShell>
  )
}

type ReviewInsightLike = {
  topComplaints?: Array<{ theme: string; productImplication: string }>
  topCompliments?: Array<{ theme: string; marketingImplication: string }>
  buyerLanguage?: string[]
  productImprovementIdeas?: Array<{ idea: string; whyItMatters: string }>
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <p className="text-xs font-black uppercase text-white/40">{label}</p>
      <p className="mt-2 break-words font-bold text-white">{value}</p>
    </div>
  )
}

function InsightList({ title, items, tone }: { title: string; items: string[]; tone: "coral" | "lime" | "cyan" | "yellow" }) {
  const color = tone === "coral" ? "text-coral" : tone === "lime" ? "text-lime" : tone === "cyan" ? "text-cyan" : "text-yellow-300"
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <h2 className={`text-xl font-black ${color}`}>{title}</h2>
      <ul className="mt-4 grid gap-2 text-sm text-white/70">
        {items.length ? items.slice(0, 6).map((item) => <li key={item} className="rounded-xl bg-black/25 p-3">{item}</li>) : <li className="rounded-xl border border-dashed border-white/15 p-3">No items in this section.</li>}
      </ul>
    </article>
  )
}

function summarizeObject(value: unknown) {
  if (!value || typeof value !== "object") return "This report is ready for review."
  return Object.entries(value as Record<string, unknown>).slice(0, 4).map(([key, item]) => `${key}: ${renderPlain(item)}`).join(" | ")
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
