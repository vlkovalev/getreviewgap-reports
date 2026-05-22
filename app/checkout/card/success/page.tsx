import type { Metadata } from "next"
import Link from "next/link"
import { getPaidPlan, getPlanCredits } from "@/lib/plans"
import { addCreditsOnce } from "@/lib/customer-store"
import { getCurrentCustomer } from "@/lib/customer-session"
import { getDb, hasRealDatabaseUrl } from "@/lib/db"

export const metadata: Metadata = { title: "Card Payment Success" }

export default async function CardSuccessPage({ searchParams }: { searchParams: Promise<{ plan?: string; session_id?: string }> }) {
  const params = await searchParams
  const plan = getPaidPlan(params.plan)
  const customer = await getCurrentCustomer()
  if (customer && plan) {
    const credits = getPlanCredits(plan.id)
    await addCreditsOnce(customer.id, credits, "stripe_checkout", params.session_id)
    if (hasRealDatabaseUrl()) {
      const existingPurchase = params.session_id
        ? await getDb().customerPurchase.findFirst({ where: { provider: "stripe", providerId: params.session_id } })
        : null
      if (!existingPurchase) await getDb().customerPurchase.create({
        data: {
          customerId: customer.id,
          provider: "stripe",
          providerId: params.session_id,
          planId: plan.id,
          amount: plan.price * 100,
          currency: "usd",
          status: "completed",
          credits
        }
      })
    }
  }
  return (
    <main className="px-5 py-20">
      <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/[0.04] p-8">
        <p className="font-black uppercase text-lime">Payment received</p>
        <h1 className="mt-4 text-5xl font-black">Thanks for buying {plan?.name ?? "ReviewGap"}.</h1>
        <p className="mt-4 text-white/65">Stripe confirmed checkout and added the report credits to your account. You can generate reports now or review your credit balance in Billing.</p>
        <p className="mt-4 font-mono text-xs text-white/40">{params.session_id}</p>
        <Link href="/dashboard/reports" className="btn-primary mt-8">Go to reports</Link>
      </div>
    </main>
  )
}
