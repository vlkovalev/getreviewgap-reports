"use client"

import { useState } from "react"
import type { PlanId } from "@/lib/plans"

export function CardCheckoutButton({ planId }: { planId: PlanId }) {
  const [status, setStatus] = useState("")

  async function startCheckout() {
    setStatus("Opening secure card checkout...")
    const response = await fetch("/api/stripe/create-checkout-session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ planId })
    })
    const payload = await response.json()
    if (!response.ok) {
      setStatus(payload.error ?? "Card checkout is not configured yet.")
      return
    }
    window.location.href = payload.url
  }

  return (
    <div>
      <button onClick={startCheckout} className="w-full rounded-full bg-white px-5 py-3 font-black text-black hover:bg-white/90">
        Pay by card
      </button>
      {status ? <p className="mt-3 text-sm text-white/60">{status}</p> : null}
    </div>
  )
}
