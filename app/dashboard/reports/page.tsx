import { DashboardShell } from "@/components/dashboard/DashboardShell"
import { ReportsClient } from "@/components/dashboard/ReportsClient"
import { getStore } from "@/lib/scrapers/store"
import { getCurrentCustomer } from "@/lib/customer-session"
import { getDb, hasRealDatabaseUrl } from "@/lib/db"
import type { IntelligenceReport, ReportFilters, ReportType } from "@/lib/scrapers/types"

export default async function ReportsPage() {
  const store = getStore()
  const customer = await getCurrentCustomer()
  const reports = hasRealDatabaseUrl()
    ? await getDb().intelligenceReport.findMany({ where: customer ? { customerId: customer.id } : {}, orderBy: { createdAt: "desc" } }).then((items) => items.map((item) => ({
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
    } satisfies IntelligenceReport)))
    : store.reports.filter((report) => !customer || !report.customerId || report.customerId === customer.id)
  return (
    <DashboardShell title="Review intelligence reports" description="Analyze Amazon customer reviews or authorized Shopify/DTC review exports. Turn recurring feedback into product and marketing decisions.">
      <ReportsClient initialReports={reports} sources={store.sources} credits={customer?.credits ?? 0} signedIn={Boolean(customer)} />
    </DashboardShell>
  )
}
