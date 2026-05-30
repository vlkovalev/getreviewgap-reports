import type { Metadata } from "next"
import Link from "next/link"
import { CardCheckoutButton } from "@/components/CardCheckoutButton"
import { PayPalCheckoutButton } from "@/components/PayPalCheckoutButton"
import { getCurrentCustomer } from "@/lib/customer-session"
import { paidPlans, type PlanId } from "@/lib/plans"

export const metadata: Metadata = { title: "Pricing", description: "Affordable review intelligence pricing for Shopify brands and Amazon sellers." }

const oneTimePlans: PlanId[] = ["one_report", "five_pack", "twenty_pack"]
const monthlyPlans: PlanId[] = ["micro", "starter", "growth"]

const valueNotes = [
  { title: "Your reports are private", copy: "Your reports are never shared or sold." },
  { title: "Export anytime", copy: "Download CSV, JSON, and PDF files." },
  { title: "Team ready", copy: "Generate once, then share a link with your team." },
  { title: "Unused credits roll over", copy: "No waste. Monthly credits roll over up to 3x." }
]

export default async function PricingPage() {
  const customer = await getCurrentCustomer()
  const isSignedIn = Boolean(customer)

  return (
    <main className="px-5 py-20">
      <div className="mx-auto max-w-7xl">
        <p className="font-black uppercase text-lime">Pricing</p>
        <h1 className="mt-4 max-w-5xl text-5xl font-black md:text-7xl">Report credits for one-off research or monthly workflows.</h1>
        <p className="mt-5 max-w-3xl text-lg text-white/70">
          One credit generates one AI review report. Buy credits once, or choose a monthly plan that refreshes automatically and rolls unused credits forward.
        </p>
        <p className="mt-4 inline-flex rounded-full border border-cyan/25 bg-cyan/10 px-4 py-2 text-sm font-bold text-cyan">All prices are in USD. Pay by card or PayPal.</p>
        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          {isSignedIn ? (
            <p className="text-white/70">Signed in as <span className="font-bold text-white">{customer?.email}</span>. Purchases will add credits to this account.</p>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-white/70">Create an account or sign in before checkout so your credits are saved to the right place.</p>
              <div className="flex flex-wrap gap-3">
                <Link href="/signup" className="btn-primary">Create account</Link>
                <Link href="/login" className="btn-secondary">Sign in</Link>
              </div>
            </div>
          )}
        </div>

        <section className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-black uppercase text-cyan">Pay as you go</p>
              <h2 className="mt-2 text-3xl font-black">One-time packs for testing, checks, and category research</h2>
            </div>
            <Link href="/dashboard/reports" className="btn-secondary">Try a free demo report</Link>
          </div>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {oneTimePlans.map((planId) => <PricingCard key={planId} planId={planId} isSignedIn={isSignedIn} />)}
          </div>
        </section>

        <section className="mt-16">
          <p className="font-black uppercase text-coral">Monthly credit plans</p>
          <h2 className="mt-2 text-3xl font-black">Auto-refreshing credits that roll over up to 3x</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {monthlyPlans.map((planId) => <PricingCard key={planId} planId={planId} isSignedIn={isSignedIn} />)}
          </div>
        </section>

        <section className="mt-16 grid gap-5 md:grid-cols-4">
          {valueNotes.map((note) => (
            <article key={note.title} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <strong className="block text-xl font-black">{note.title}</strong>
              <p className="mt-3 text-white/70">{note.copy}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-2xl font-black">Not sure where to start?</h2>
          <p className="mt-3 text-white/70">
            Start with the $5 single report if you only want to test the workflow once. The $19 Starter Pack is the practical middle option for small competitor checks. The $59 Pro Pack is best when you need category-level review intelligence.
          </p>
        </section>
      </div>
    </main>
  )
}

function PricingCard({ planId, isSignedIn }: { planId: PlanId; isSignedIn: boolean }) {
  const plan = paidPlans[planId]
  const badge = planId === "five_pack" ? "Best starter choice" : planId === "twenty_pack" ? "Best value" : planId === "starter" ? "Most popular" : null
  return (
    <article className={`card p-7 ${badge ? "border-lime/60" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-2xl font-black">{plan.name}</h3>
        {badge ? <span className="rounded-full bg-lime px-3 py-1 text-xs font-black uppercase text-black">{badge}</span> : null}
      </div>
      <p className="mt-2 text-white/60">{plan.description}</p>
      <p className="mt-5 text-4xl font-black text-lime">{plan.priceLabel} <span className="text-sm text-white/45">USD</span></p>
      <ul className="mt-6 space-y-3 text-white/70">
        {plan.features.map((feature) => <li key={feature}>- {feature}</li>)}
      </ul>
      {isSignedIn ? (
        <div className="mt-8 grid gap-3">
          <CardCheckoutButton planId={planId} />
          <PayPalCheckoutButton planId={planId} />
        </div>
      ) : (
        <div className="mt-8 grid gap-3">
          <Link href="/signup" className="w-full rounded-full bg-lime px-5 py-3 text-center font-black text-black hover:bg-lime/90">Create account to buy</Link>
          <Link href="/login" className="w-full rounded-full border border-white/15 px-5 py-3 text-center font-black text-white hover:bg-white/10">Sign in</Link>
        </div>
      )}
    </article>
  )
}
