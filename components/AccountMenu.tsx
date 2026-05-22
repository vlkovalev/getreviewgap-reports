"use client"

import Link from "next/link"
import { useState } from "react"

export function AccountMenu({ email, credits }: { email: string; credits: number }) {
  const [open, setOpen] = useState(false)
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
    <div className="relative">
      <button
        onClick={() => setOpen((current) => !current)}
        className="rounded-full border border-white/15 px-4 py-2 text-sm font-black text-white hover:bg-white/10"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        Account
      </button>
      {open ? (
        <div className="absolute right-0 mt-3 w-72 rounded-2xl border border-white/10 bg-ink p-4 shadow-soft" role="menu">
          <p className="break-all text-sm font-black text-white">{email}</p>
          <p className="mt-1 text-sm text-white/60">{credits} report credits</p>
          <div className="mt-4 grid gap-2">
            <Link href="/dashboard/reports" className="rounded-xl px-3 py-2 text-sm font-bold text-white/75 hover:bg-white/10 hover:text-white" role="menuitem">My reports</Link>
            <Link href="/dashboard/billing" className="rounded-xl px-3 py-2 text-sm font-bold text-white/75 hover:bg-white/10 hover:text-white" role="menuitem">Billing</Link>
            <Link href="/dashboard/settings" className="rounded-xl px-3 py-2 text-sm font-bold text-white/75 hover:bg-white/10 hover:text-white" role="menuitem">Settings</Link>
            <button onClick={signOut} className="rounded-xl px-3 py-2 text-left text-sm font-black text-coral hover:bg-white/10" role="menuitem">
              Sign out
            </button>
          </div>
          {status ? <p className="mt-3 text-xs text-white/50">{status}</p> : null}
        </div>
      ) : null}
    </div>
  )
}
