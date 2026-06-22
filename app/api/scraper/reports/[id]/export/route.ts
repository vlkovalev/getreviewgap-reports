import { exportReportCsv, exportReportJson, exportReportPdf, mapPrismaIntelligenceReport } from "@/lib/reports/report-engine"
import { getStore } from "@/lib/scrapers/store"
import { getCurrentCustomer } from "@/lib/customer-session"
import { getDb, hasRealDatabaseUrl, withDbRetry } from "@/lib/db"

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const customer = await getCurrentCustomer()
  if (!customer) return Response.json({ error: "Sign in to download saved reports." }, { status: 401 })

  let report
  try {
    report = hasRealDatabaseUrl()
      ? await withDbRetry(() =>
          getDb().intelligenceReport.findFirst({ where: { id, customerId: customer.id } })
        ).then((item) => item ? mapPrismaIntelligenceReport(item) : null)
      : getStore().reports.find((item) => item.id === id && item.customerId === customer.id)
  } catch (error) {
    console.error("[export] Failed to load report from database:", error)
    return Response.json(
      { error: "The report database is temporarily unavailable. Please try again in a moment." },
      { status: 503 }
    )
  }

  if (!report) return Response.json({ error: "Report not found" }, { status: 404 })

  const format = new URL(request.url).searchParams.get("format") ?? "json"

  try {
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
  } catch (error) {
    console.error(`[export] Failed to render report ${id} as ${format}:`, error)
    return Response.json(
      { error: `Could not generate the ${format.toUpperCase()} export for this report. This is likely a bug in the export renderer rather than a transient issue - please try a different format or contact support if it persists.` },
      { status: 500 }
    )
  }
}
