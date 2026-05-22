"use client"

import { useState } from "react"

export function AdminSignOutButton() {
  const [status, setStatus] = useState("")

  async function signOut() {
    setStatus("Signing out...")
    const response = await fetch("/api/admin/logout", { method: "POST" })
    if (!response.ok) {
      setStatus("Could not sign out. Please try again.")
      return
    }
    window.location.href = "/admin/login"
  }

  return (
    <div>
      <button onClick={signOut} className="rounded-full border border-white/15 px-5 py-3 text-sm font-black text-white hover:bg-white/10">
        Admin sign out
      </button>
      {status ? <p className="mt-2 text-xs text-white/60">{status}</p> : null}
    </div>
  )
}
