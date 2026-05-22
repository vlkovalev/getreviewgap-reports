"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

export function PayPalCaptureClient({ orderId, planId }: { orderId?: string; planId?: string }) {
  const [status, setStatus] = useState("Confirming your PayPal payment...")
  const [ok, setOk] = useState(false)

  useEffect(() => {
    if (!orderId) {
      setStatus("PayPal did not send an order token. Please try checkout again.")
      return
    }
    let cancelled = false
    async function capture() {
      const response = await fetch("/api/paypal/capture-order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId, planId })
      })
      const payload = await response.json()
      if (cancelled) return
      if (!response.ok) {
        setStatus(payload.error ?? "Payment capture failed.")
        return
      }
      setOk(true)
      setStatus(`Payment confirmed. Your ${payload.plan?.name ?? "ReviewGap"} credits were added to your account.`)
    }
    capture()
    return () => {
      cancelled = true
    }
  }, [orderId, planId])

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
      <p className={ok ? "font-black text-lime" : "font-black text-yellow-200"}>{status}</p>
      <p className="mt-4 text-white/65">You can generate reports now or review your credit balance in Billing.</p>
      <Link href="/dashboard/reports" className="btn-primary mt-8">Go to reports</Link>
    </div>
  )
}
