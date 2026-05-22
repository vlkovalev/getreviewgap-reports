import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "PayPal Payment Cancelled" }

export default function PayPalCancelPage() {
  return (
    <main className="px-5 py-20">
      <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/[0.04] p-8">
        <p className="font-black uppercase text-yellow-200">Checkout cancelled</p>
        <h1 className="mt-4 text-5xl font-black">No payment was taken.</h1>
        <p className="mt-4 text-white/65">You can return to pricing and choose a plan when you are ready.</p>
        <Link href="/pricing" className="btn-primary mt-8">Back to pricing</Link>
      </div>
    </main>
  )
}
