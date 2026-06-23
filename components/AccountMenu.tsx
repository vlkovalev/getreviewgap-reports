"use client"

import Link from "next/link"
import { useState } from "react"
import { usePathname } from "next/navigation"

export function AccountMenu({ email, credits }: { email: string; credits: number }) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState("")
  const pathname = usePathname()

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
        className={open 
          ? "rounded-full border border-lime bg-lime/10 px-4 py-2 text-sm font-black text-lime transition-all duration-200"
          : "rounded-full border border-white/15 px-4 py-2 text-sm font-black text-white hover:bg-white/10 transition-all duration-200"
        }
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
            <Link 
              href="/dashboard/reports" 
              className={pathname.startsWith("/dashboard/reports") 
                ? "rounded-xl px-3 py-2 text-sm font-black text-lime bg-white/5" 
                : "rounded-xl px-3 py-2 text-sm font-bold text-white/75 hover:bg-white/10 hover:text-white transition-colors"
              } 
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              My reports
            </Link>
            <Link 
              href="/dashboard/billing" 
              className={pathname.startsWith("/dashboard/billing") 
                ? "rounded-xl px-3 py-2 text-sm font-black text-lime bg-white/5" 
                : "rounded-xl px-3 py-2 text-sm font-bold text-white/75 hover:bg-white/10 hover:text-white transition-colors"
              } 
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              Billing
            </Link>
            <Link 
              href="/dashboard/settings" 
              className={pathname.startsWith("/dashboard/settings") 
                ? "rounded-xl px-3 py-2 text-sm font-black text-lime bg-white/5" 
                : "rounded-xl px-3 py-2 text-sm font-bold text-white/75 hover:bg-white/10 hover:text-white transition-colors"
              } 
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              Settings
            </Link>
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
