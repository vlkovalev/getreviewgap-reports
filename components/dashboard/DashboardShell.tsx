import { DashboardNav } from "@/components/dashboard/DashboardNav"

export function DashboardShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <main className="px-5 py-10">
      <div className="mx-auto max-w-7xl">
        <DashboardNav />
        <div className="mb-8">
          <p className="font-black uppercase text-lime">ReviewGap</p>
          <h1 className="mt-3 text-4xl font-black md:text-6xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-white/70">{description}</p>
        </div>
        {children}
      </div>
    </main>
  )
}

export function StatusBadge({ status }: { status?: string }) {
  const tone = status === "SUCCESS" || status === "COMPLETED" || status === "ACTIVE" || status === "in_stock" ? "border-lime/40 bg-lime/15 text-lime" : status === "FAILED" || status === "BLOCKED" || status === "out_of_stock" ? "border-red-400/40 bg-red-400/15 text-red-200" : "border-white/10 bg-white/10 text-white/70"
  return <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${tone}`}>{status ?? "unknown"}</span>
}
