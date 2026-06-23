import { DashboardShell } from "@/components/dashboard/DashboardShell"
import { JobsClient } from "@/components/dashboard/JobsClient"
import { getStore } from "@/lib/scrapers/store"

export default function JobsPage() {
  const store = getStore()
  return (
    <DashboardShell title="Advanced analysis batches" description="Group competitor product URLs for repeated analysis. Most beta testers should start with Generate report instead.">
      <JobsClient initialJobs={store.jobs} sources={store.sources} />
    </DashboardShell>
  )
}
