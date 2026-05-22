import { DashboardShell } from "@/components/dashboard/DashboardShell"
import { SourcesClient } from "@/components/dashboard/SourcesClient"
import { getStore } from "@/lib/scrapers/store"

export default function SourcesPage() {
  return (
    <DashboardShell title="Review sources" description="Configure where review data comes from. For the MVP, use demo data, pasted reviews, or a permitted Amazon review actor.">
      <SourcesClient initialSources={getStore().sources} />
    </DashboardShell>
  )
}
