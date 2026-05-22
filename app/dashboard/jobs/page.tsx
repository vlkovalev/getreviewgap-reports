import { DashboardShell } from "@/components/dashboard/DashboardShell"
import { JobsClient } from "@/components/dashboard/JobsClient"
import { getStore } from "@/lib/scrapers/store"

export default function JobsPage() {
  const store = getStore()
  return (
    <DashboardShell title="Review batches" description="Group competitor Amazon product URLs into a batch, then run a review analysis whenever you need fresh insights.">
      <JobsClient initialJobs={store.jobs} sources={store.sources} />
    </DashboardShell>
  )
}
