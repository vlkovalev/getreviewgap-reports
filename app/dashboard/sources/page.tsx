import { DashboardShell } from "@/components/dashboard/DashboardShell"
import { SourcesClient } from "@/components/dashboard/SourcesClient"
import { getStore } from "@/lib/scrapers/store"

export default function SourcesPage() {
  return (
    <DashboardShell title="Advanced analysis sources" description="Optional setup for repeated competitor-review analysis. These sources describe where review data comes from; they are not customer review request destinations.">
      <SourcesClient initialSources={getStore().sources} />
    </DashboardShell>
  )
}
