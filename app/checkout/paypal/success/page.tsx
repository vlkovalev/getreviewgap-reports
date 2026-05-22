import type { Metadata } from "next"
import { PayPalCaptureClient } from "@/components/PayPalCaptureClient"

export const metadata: Metadata = { title: "PayPal Payment Success" }

export default async function PayPalSuccessPage({ searchParams }: { searchParams: Promise<{ token?: string; plan?: string }> }) {
  const params = await searchParams
  return (
    <main className="px-5 py-20">
      <div className="mx-auto max-w-2xl">
        <p className="font-black uppercase text-lime">Checkout</p>
        <h1 className="mt-4 text-5xl font-black">Thanks. Finalizing payment.</h1>
        <div className="mt-8">
          <PayPalCaptureClient orderId={params.token} planId={params.plan} />
        </div>
      </div>
    </main>
  )
}
