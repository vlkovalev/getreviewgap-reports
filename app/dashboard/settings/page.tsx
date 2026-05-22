import type { Metadata } from "next"
import Link from "next/link"
import { DashboardShell } from "@/components/dashboard/DashboardShell"
import { SignOutButton } from "@/components/SignOutButton"
import { getCurrentCustomer } from "@/lib/customer-session"

export const metadata: Metadata = { title: "Settings", description: "ReviewIntel account settings." }

export default async function SettingsPage() {
  const customer = await getCurrentCustomer()

  return (
    <DashboardShell title="Settings" description="Manage your account, credit workflow, and report preferences.">
      <div className="grid gap-5">
        <section className="card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase text-lime">Profile</p>
              <h2 className="mt-2 text-2xl font-black">{customer ? customer.email : "Not signed in"}</h2>
              <p className="mt-2 text-white/65">
                {customer ? "Purchases and reports are attached to this account." : "Sign in to save reports and attach purchases to your account."}
              </p>
            </div>
            {customer ? <SignOutButton /> : <Link href="/login" className="btn-primary">Sign in</Link>}
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          <div className="card p-6">
            <p className="text-sm font-black uppercase text-cyan">Credits</p>
            <h2 className="mt-3 text-3xl font-black">{customer?.credits ?? 0}</h2>
            <p className="mt-2 text-white/65">Each AI review intelligence report uses 1 credit.</p>
            <Link href="/dashboard/billing" className="btn-secondary mt-5">Manage credits</Link>
          </div>
          <div className="card p-6">
            <p className="text-sm font-black uppercase text-coral">Default export</p>
            <h2 className="mt-3 text-3xl font-black">CSV + JSON</h2>
            <p className="mt-2 text-white/65">Reports can be exported for spreadsheets, docs, and team handoff.</p>
          </div>
          <div className="card p-6">
            <p className="text-sm font-black uppercase text-lime">Marketplace</p>
            <h2 className="mt-3 text-3xl font-black">Amazon</h2>
            <p className="mt-2 text-white/65">The MVP is focused on Amazon review intelligence for sellers and brands.</p>
          </div>
        </section>

        <section className="card p-6">
          <h2 className="text-2xl font-black">Report defaults</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <Preference label="Report type" value="Review sentiment intelligence" />
            <Preference label="Output focus" value="Complaints, compliments, buyer language" />
            <Preference label="Sharing" value="Private reports with shareable links" />
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-2xl font-black">Account security</h2>
          <p className="mt-3 text-white/65">
            Keep your password private. Production deployment should use a hosted auth provider or database-backed sessions before public launch.
          </p>
        </section>
      </div>
    </DashboardShell>
  )
}

function Preference({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-sm font-black uppercase text-white/40">{label}</p>
      <p className="mt-2 font-bold text-white">{value}</p>
    </div>
  )
}
