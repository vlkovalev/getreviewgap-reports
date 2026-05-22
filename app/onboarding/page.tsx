import type { Metadata } from "next"
import Link from "next/link"
import { getCurrentCustomer } from "@/lib/customer-session"

export const metadata: Metadata = { title: "Welcome", description: "Start your first ReviewGap report." }

export default async function OnboardingPage() {
  const customer = await getCurrentCustomer()
  return (
    <main className="px-5 py-20">
      <div className="mx-auto max-w-4xl">
        <p className="font-black uppercase text-lime">Welcome</p>
        <h1 className="mt-4 text-5xl font-black md:text-7xl">You are ready to create your first review report.</h1>
        <p className="mt-5 max-w-2xl text-lg text-white/70">
          Your new account starts with {customer?.credits ?? 1} report credit. Use it to generate a demo Amazon review intelligence report and see what the output looks like.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            ["1", "Choose report type", "Start with Review and Rating for the clearest first output."],
            ["2", "Use demo data", "The MVP uses safe demo data until Apify/OpenAI keys are connected."],
            ["3", "Export results", "Open the report and export CSV, JSON, or PDF for sharing."]
          ].map(([step, title, text]) => (
            <div key={step} className="card p-6">
              <p className="text-sm font-black text-lime">Step {step}</p>
              <h2 className="mt-3 text-xl font-black">{title}</h2>
              <p className="mt-2 text-sm text-white/65">{text}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/dashboard/reports" className="btn-primary">Generate first report</Link>
          <Link href="/dashboard/billing" className="btn-secondary">View credits</Link>
        </div>
      </div>
    </main>
  )
}
