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

  return (
    <DashboardShell title={report.title} description="Full report view with summary, tabular output, regeneration endpoint, and CSV/JSON export links.">
      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StatusBadge status={report.status} />
          <div className="flex gap-2">
            <a href={`/api/scraper/reports/${report.id}/export?format=csv`} className="rounded-full bg-white px-4 py-2 text-sm font-black text-black">Export CSV</a>
            <a href={`/api/scraper/reports/${report.id}/export?format=json`} className="rounded-full border border-white/10 px-4 py-2 text-sm font-black">Export JSON</a>
          </div>
        </div>
        <pre className="mt-5 overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-4 text-xs text-white/75">{JSON.stringify(report.summary, null, 2)}</pre>
      </section>
      <section className="mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.04] p-6">
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

function renderCell(value: unknown) {
  if (Array.isArray(value) || (value && typeof value === "object")) return <span className="font-mono text-xs text-white/60">{JSON.stringify(value)}</span>
  return String(value ?? "-")
}
