"use client"

import { useState } from "react"
import type { PlanId } from "@/lib/plans"

export function PayPalCheckoutButton({ planId }: { planId: PlanId }) {
  const [status, setStatus] = useState("")

  async function startCheckout() {
    setStatus("Opening PayPal...")
    const response = await fetch("/api/paypal/create-order", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ planId })
    })
    const payload = await response.json()
    if (!response.ok) {
      setStatus(payload.error ?? "PayPal checkout is not configured yet.")
      return
    }
    window.location.href = payload.approvalUrl
  }

  return (
    <div className="mt-8">
      <button onClick={startCheckout} className="w-full rounded-full bg-[#ffc439] px-5 py-3 font-black text-black hover:bg-[#f2bb32]">
        PayPal
      </button>
      {status ? <p className="mt-3 text-sm text-white/60">{status}</p> : null}
    </div>
  )
}
