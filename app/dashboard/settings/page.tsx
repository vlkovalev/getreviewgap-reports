import type { Metadata } from "next"
import { DashboardShell } from "@/components/dashboard/DashboardShell"
import { SettingsClient } from "@/components/dashboard/SettingsClient"
import { getCurrentCustomer } from "@/lib/customer-session"

export const metadata: Metadata = {
  title: "Settings - ReviewGap",
  description: "ReviewGap account preferences, report presets, and account security controls."
}

export default async function SettingsPage() {
  const customer = await getCurrentCustomer()

  return (
    <DashboardShell
      title="Settings"
      description="Manage your account profile, report defaults, and authentication controls."
    >
      <SettingsClient customer={customer} />
    </DashboardShell>
  )
}
