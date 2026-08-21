import type { Metadata } from "next"
import Link from "next/link"
import { getPaidPlan } from "@/lib/plans"

export const metadata: Metadata = { title: "Card Payment Success" }

export default async function CardSuccessPage({ searchParams }: { searchParams: Promise<{ plan?: string; session_id?: string }> }) {
  const params = await searchParams
  const plan = getPaidPlan(params.plan)
  return (
    <main className="px-5 py-20">
      <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/[0.04] p-8">
        <p className="font-black uppercase text-lime">Payment processing</p>
        <h1 className="mt-4 text-5xl font-black">Thanks for buying {plan?.name ?? "ReviewGap"}.</h1>
        <p className="mt-4 text-white/65">Stripe is confirming the checkout. Your credits are added by the signed Stripe webhook, usually within a few seconds. Refresh Billing if the balance has not updated yet.</p>
        <p className="mt-4 font-mono text-xs text-white/40">{params.session_id}</p>
        <Link href="/dashboard/reports" className="btn-primary mt-8">Go to reports</Link>
      </div>
    </main>
  )
}
