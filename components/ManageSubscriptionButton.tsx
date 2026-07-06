"use client"

import { useState } from "react"

export function ManageSubscriptionButton() {
  const [status, setStatus] = useState("")

  async function openPortal() {
    setStatus("Opening billing portal...")
    const response = await fetch("/api/stripe/create-portal-session", { method: "POST" })
    const payload = await response.json()
    if (!response.ok) {
      setStatus(payload.error ?? "Could not open the billing portal.")
      return
    }
    window.location.href = payload.url
  }

  return (
    <div>
      <button onClick={openPortal} className="btn-secondary">Manage subscription</button>
      {status ? <p className="mt-3 text-sm text-white/60">{status}</p> : null}
    </div>
  )
}
