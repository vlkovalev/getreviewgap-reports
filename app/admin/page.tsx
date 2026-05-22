import { cookies } from "next/headers"
import Link from "next/link"
import { redirect } from "next/navigation"
import { getDb } from "@/lib/db"
import { listReports } from "@/lib/reports-store"
import { ReportStatusBadge } from "@/components/ReportStatusBadge"
import { AdminSignOutButton } from "@/components/AdminSignOutButton"
import { getStore } from "@/lib/scrapers/store"
import { getReadinessChecks, type ReadinessCheck } from "@/lib/readiness"

export default async function AdminPage() {
  const cookieStore = await cookies()
  if (cookieStore.get("admin_session")?.value !== "ok") redirect("/admin/login")

  const reports = await listReports()
  const scraperStore = getStore()
  const readinessChecks = await getReadinessChecks()
  const failedRuns = scraperStore.runs.filter((run) => run.status === "FAILED" || run.status === "BLOCKED")
  let leadCount = 0
  let inquiryCount = 0
  let agentRunCount = 0

  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("USER:PASSWORD")) {
    const db = getDb()
    ;[leadCount, inquiryCount, agentRunCount] = await Promise.all([
      db.lead.count(),
      db.inquiry.count(),
      db.agentRun.count()
    ])
  }

  return (
    <main className="px-5 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-black uppercase text-lime">Admin</p>
            <h1 className="mt-3 text-5xl font-black">Review queue</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard" className="btn-secondary">User dashboard</Link>
            <AdminSignOutButton />
          </div>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <Metric label="Reports" value={reports.length} />
          <Metric label="Agent runs" value={agentRunCount} />
          <Metric label="Leads" value={leadCount} />
          <Metric label="Inquiries" value={inquiryCount} />
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <Metric label="Scraper sources" value={scraperStore.sources.length} />
          <Metric label="Products tracked" value={scraperStore.products.length} />
          <Metric label="Scrape runs" value={scraperStore.runs.length} />
          <Metric label="Failed/blocked runs" value={failedRuns.length} />
        </div>
        <section className="card mt-8 overflow-hidden">
          <div className="border-b border-white/10 p-5">
            <p className="font-black uppercase text-cyan">Launch readiness</p>
            <h2 className="mt-2 text-2xl font-black">Configuration health</h2>
            <p className="mt-2 text-sm text-white/60">Secrets are never shown here. This only checks whether required services are configured and reachable.</p>
          </div>
          <div className="grid gap-0 md:grid-cols-2">
            {readinessChecks.map((check) => <ReadinessCard key={check.label} check={check} />)}
          </div>
        </section>
        <section className="card mt-8 overflow-hidden">
          <h2 className="border-b border-white/10 p-5 text-2xl font-black">Scraper health</h2>
          {scraperStore.sources.map((source) => (
            <div key={source.id} className="grid gap-3 border-b border-white/10 p-5 md:grid-cols-[.4fr_.4fr_1fr]">
              <p className="font-black">{source.name}</p>
              <p className="text-lime">{source.status}</p>
              <p className="text-sm text-white/60">{source.robotsNote ?? "No source policy note captured."}</p>
            </div>
          ))}
        </section>
        <section className="card mt-8 overflow-hidden">
          <h2 className="border-b border-white/10 p-5 text-2xl font-black">Recent reports</h2>
          {reports.length ? reports.map((report) => (
            <div key={report.id} className="grid gap-3 border-b border-white/10 p-5 md:grid-cols-[1fr_.4fr_.4fr]">
              <div>
                <p className="font-black">{report.productName}</p>
                <p className="mt-1 text-sm text-white/58">{report.productUrl}</p>
              </div>
              <p className="text-white/70">{report.reviewCount} reviews</p>
              <ReportStatusBadge status={report.status} />
            </div>
          )) : (
            <div className="p-8 text-white/60">No reports yet. Run one from the dashboard.</div>
          )}
        </section>
        <div className="mt-8 rounded-3xl border border-yellow-400/30 bg-yellow-400/10 p-5 text-yellow-100">
          Reports marked NEEDS REVIEW are demo-mode or low-confidence outputs and should be reviewed before sending to customers.
        </div>
      </div>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="card p-6"><p className="text-white/60">{label}</p><p className="mt-2 text-4xl font-black text-lime">{value}</p></div>
}

function ReadinessCard({ check }: { check: ReadinessCheck }) {
  const tone = check.status === "ready"
    ? "border-lime/30 bg-lime/10 text-lime"
    : check.status === "warning"
      ? "border-yellow-300/30 bg-yellow-300/10 text-yellow-100"
      : "border-coral/30 bg-coral/10 text-coral"

  return (
    <div className="border-b border-white/10 p-5 md:border-r">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-black">{check.label}</h3>
        <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase ${tone}`}>{check.status}</span>
      </div>
      <p className="mt-3 text-sm text-white/62">{check.detail}</p>
    </div>
  )
}
