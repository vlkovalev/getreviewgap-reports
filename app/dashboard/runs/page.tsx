import { DashboardShell, StatusBadge } from "@/components/dashboard/DashboardShell"
import { getStore } from "@/lib/scrapers/store"

export default function RunsPage() {
  const runs = getStore().runs
  return (
    <DashboardShell title="Analysis run history" description="Every review analysis run records status, product counts, duration, and failure details for monitoring.">
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <table className="w-full text-left text-sm">
          <thead className="text-white/50"><tr><th className="py-2">Run</th><th>Status</th><th>Products</th><th>Created</th><th>Error</th></tr></thead>
          <tbody>
            {runs.map((run) => (
              <tr key={run.id} className="border-t border-white/10">
                <td className="py-3 font-mono text-xs">{run.id}</td>
                <td><StatusBadge status={run.status} /></td>
                <td>{run.productsFound}</td>
                <td>{run.createdAt}</td>
                <td className="max-w-sm text-red-200/80">{run.errorMessage ?? "None"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  )
}
