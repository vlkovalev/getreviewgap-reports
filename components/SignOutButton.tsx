"use client"

import { useState } from "react"

export function SignOutButton() {
  const [status, setStatus] = useState("")

  async function signOut() {
    setStatus("Signing out...")
    const response = await fetch("/api/auth/logout", { method: "POST" })
    if (!response.ok) {
      setStatus("Could not sign out. Please try again.")
      return
    }
    window.location.href = "/"
  }

  return (
    <div>
      <button onClick={signOut} className="rounded-full border border-white/15 px-5 py-3 font-black text-white hover:bg-white/10">
        Sign out
      </button>
      {status ? <p className="mt-3 text-sm text-white/60">{status}</p> : null}
    </div>
  )
}
