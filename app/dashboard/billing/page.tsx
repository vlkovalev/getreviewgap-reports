import type { Metadata } from "next"
import Link from "next/link"
import { DashboardShell } from "@/components/dashboard/DashboardShell"
import { getCurrentCustomer } from "@/lib/customer-session"
import { getCustomerCreditLedger, getCustomerPurchases } from "@/lib/customer-store"
import { getPaidPlan } from "@/lib/plans"

export const metadata: Metadata = { title: "Billing", description: "ReviewIntel billing and plan settings." }

export default async function BillingPage() {
  const customer = await getCurrentCustomer()
  const ledger = customer ? await getCustomerCreditLedger(customer.id, 8) : []
  const purchases = customer ? await getCustomerPurchases(customer.id, 8) : []
  return (
    <DashboardShell title="Billing" description="Manage report credits, checkout options, and recent credit activity.">
      <div className="grid gap-5 md:grid-cols-3">
        <section className="card p-6">
          <p className="text-sm font-black uppercase text-lime">Account</p>
          <h2 className="mt-3 text-2xl font-black">{customer ? "Active" : "Not signed in"}</h2>
          <p className="mt-2 text-white/65">{customer ? customer.email : "Sign in to view billing details."}</p>
        </section>
        <section className="card p-6">
          <p className="text-sm font-black uppercase text-cyan">Report credits</p>
          <h2 className="mt-3 text-2xl font-black">{customer?.credits ?? 0}</h2>
          <p className="mt-2 text-white/65">Each generated report uses 1 credit.</p>
        </section>
        <section className="card p-6">
          <p className="text-sm font-black uppercase text-coral">Checkout</p>
          <h2 className="mt-3 text-2xl font-black">Card or PayPal</h2>
          <p className="mt-2 text-white/65">Buy one-time packs or monthly auto-refreshing credits from Pricing.</p>
        </section>
      </div>

      <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <h2 className="text-2xl font-black">Choose or change plan</h2>
        <p className="mt-3 text-white/65">Use pricing to buy a single report, a pay-as-you-go pack, or a monthly credit plan with rollover.</p>
        <Link href="/pricing" className="btn-primary mt-6">View pricing</Link>
      </section>

      <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase text-lime">Purchases</p>
            <h2 className="mt-2 text-2xl font-black">Recent purchases</h2>
          </div>
          <Link href="/pricing" className="btn-secondary">Buy credits</Link>
        </div>
        {purchases.length ? (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-white/50">
                <tr>
                  <th className="border-b border-white/10 py-3 pr-4">Date</th>
                  <th className="border-b border-white/10 py-3 pr-4">Plan</th>
                  <th className="border-b border-white/10 py-3 pr-4">Provider</th>
                  <th className="border-b border-white/10 py-3 pr-4">Amount</th>
                  <th className="border-b border-white/10 py-3 pr-4">Credits</th>
                  <th className="border-b border-white/10 py-3 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((purchase) => {
                  const plan = getPaidPlan(purchase.planId)
                  return (
                    <tr key={purchase.id}>
                      <td className="border-b border-white/10 py-3 pr-4 text-white/70">{new Date(purchase.createdAt).toLocaleDateString("en-US")}</td>
                      <td className="border-b border-white/10 py-3 pr-4 font-bold">{plan?.name ?? purchase.planId}</td>
                      <td className="border-b border-white/10 py-3 pr-4 capitalize text-white/70">{purchase.provider}</td>
                      <td className="border-b border-white/10 py-3 pr-4 font-bold">{formatMoney(purchase.amount, purchase.currency)}</td>
                      <td className="border-b border-white/10 py-3 pr-4 font-black text-lime">+{purchase.credits}</td>
                      <td className="border-b border-white/10 py-3 pr-4 text-white/70">{purchase.status}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
            <p className="font-bold">No purchases yet.</p>
            <p className="mt-2 text-white/60">Buy a single report, a credit pack, or a monthly credit plan to see purchases here.</p>
          </div>
        )}
      </section>

      <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase text-cyan">Credit ledger</p>
            <h2 className="mt-2 text-2xl font-black">Recent activity</h2>
          </div>
          <Link href="/dashboard/reports" className="btn-secondary">Generate report</Link>
        </div>
        {ledger.length ? (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="text-white/50">
                <tr>
                  <th className="border-b border-white/10 py-3 pr-4">Date</th>
                  <th className="border-b border-white/10 py-3 pr-4">Activity</th>
                  <th className="border-b border-white/10 py-3 pr-4">Credits</th>
                  <th className="border-b border-white/10 py-3 pr-4">Reference</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((item) => (
                  <tr key={item.id}>
                    <td className="border-b border-white/10 py-3 pr-4 text-white/70">{new Date(item.createdAt).toLocaleDateString("en-US")}</td>
                    <td className="border-b border-white/10 py-3 pr-4 font-bold">{formatReason(item.reason)}</td>
                    <td className={item.amount > 0 ? "border-b border-white/10 py-3 pr-4 font-black text-lime" : "border-b border-white/10 py-3 pr-4 font-black text-coral"}>
                      {item.amount > 0 ? `+${item.amount}` : item.amount}
                    </td>
                    <td className="border-b border-white/10 py-3 pr-4 font-mono text-xs text-white/40">{item.referenceId ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
            <p className="font-bold">No credit activity yet.</p>
            <p className="mt-2 text-white/60">Create an account, buy credits, or generate your first report to see activity here.</p>
          </div>
        )}
      </section>
    </DashboardShell>
  )
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(amount / 100)
}

function formatReason(reason: string) {
  return reason
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}
