import { exportReportCsv, exportReportJson, exportReportPdf } from "@/lib/reports/report-engine"
import { getStore } from "@/lib/scrapers/store"
import { getCurrentCustomer } from "@/lib/customer-session"
import { getDb, hasRealDatabaseUrl } from "@/lib/db"
import type { IntelligenceReport, ReportFilters, ReportType } from "@/lib/scrapers/types"

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
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
  if (!report) return Response.json({ error: "Report not found" }, { status: 404 })
  const format = new URL(request.url).searchParams.get("format") ?? "json"
  if (format === "csv") {
    return new Response(exportReportCsv(report), {
      headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${report.reportType.toLowerCase()}-${report.id}.csv"` }
    })
  }
  if (format === "pdf") {
    return new Response(exportReportPdf(report), {
      headers: { "content-type": "application/pdf", "content-disposition": `attachment; filename="${report.reportType.toLowerCase()}-${report.id}.pdf"` }
    })
  }
  return new Response(exportReportJson(report), {
    headers: { "content-type": "application/json; charset=utf-8", "content-disposition": `attachment; filename="${report.reportType.toLowerCase()}-${report.id}.json"` }
  })
}
