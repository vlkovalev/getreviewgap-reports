import type { Metadata } from "next"
import Link from "next/link"
import { DashboardShell, StatusBadge } from "@/components/dashboard/DashboardShell"
import { getStore } from "@/lib/scrapers/store"

export const metadata: Metadata = {
  title: "Dashboard | ReviewIntel Reports",
  description: "Monitor review sources, analysis runs, products, and Amazon review intelligence reports."
}

export default function DashboardPage() {
  const store = getStore()
  const lastRun = store.runs[0]
  const cards = [
    ["Review sources", store.sources.length],
    ["Products reviewed", store.products.length],
    ["Analysis runs", store.runs.length],
    ["Reports generated", store.reports.length]
  ] as const

  return (
    <DashboardShell title="Review intelligence dashboard" description="Create review batches, inspect Amazon product review signals, and generate exportable reports for sellers and agencies.">
      <section className="grid gap-4 md:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-white/50">{label}</p>
            <p className="mt-2 text-3xl font-black">{value}</p>
          </div>
        ))}
      </section>
      <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-black">Recent analysis runs</h2>
            <Link href="/dashboard/jobs" className="rounded-full bg-lime px-4 py-2 text-sm font-black text-black">Create review batch</Link>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-white/50"><tr><th className="py-2">Run</th><th>Status</th><th>Products</th><th>Duration</th></tr></thead>
              <tbody>
                {store.runs.slice(0, 5).map((run) => (
                  <tr key={run.id} className="border-t border-white/10">
                    <td className="py-3 font-mono text-xs">{run.id.slice(0, 8)}</td>
                    <td><StatusBadge status={run.status} /></td>
                    <td>{run.productsFound}</td>
                    <td>{run.durationMs ?? 0} ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-2xl font-black">Next action</h2>
          <p className="mt-3 text-white/65">Generate an executive summary report from the seeded demo data. It supports PDF, JSON, and CSV export.</p>
          <Link href="/dashboard/reports" className="mt-5 inline-flex rounded-full bg-white px-5 py-3 font-black text-black">Generate free report</Link>
          <div className="mt-6 rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-white/60">
            Last analysis: {lastRun ? <StatusBadge status={lastRun.status} /> : "No runs yet"}
          </div>
        </div>
      </section>
    </DashboardShell>
  )
}
