"use client"

import Link from "next/link"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { AccountMenu } from "@/components/AccountMenu"

type HeaderLink = [string, string]

export function HeaderActions({ links, customer }: { links: HeaderLink[]; customer?: { email: string; credits: number } | null }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="flex items-center gap-3">
      <nav className="hidden items-center gap-5 text-sm text-white/74 md:flex">
        {links.map(([label, href]) => {
          const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={active ? "font-black text-lime" : "hover:text-white transition-colors duration-200"}
            >
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="hidden items-center gap-3 md:flex">
        {customer ? (
          <AccountMenu email={customer.email} credits={customer.credits} />
        ) : (
          <>
            <Link href="/login" className="text-sm font-bold text-white/74 hover:text-white transition-colors duration-200">Sign in</Link>
            <Link href="/signup" className="text-sm font-bold text-white/74 hover:text-white transition-colors duration-200">Sign up</Link>
          </>
        )}
        <Link href="/dashboard/reports" className="btn-primary text-sm">Run report</Link>
      </div>
      <button
        onClick={() => setOpen((current) => !current)}
        className={open 
          ? "rounded-full border border-lime bg-lime/10 px-4 py-2 text-sm font-black text-lime transition-all duration-200 md:hidden"
          : "rounded-full border border-white/15 px-4 py-2 text-sm font-black text-white hover:bg-white/10 transition-all duration-200 md:hidden"
        }
        aria-expanded={open}
        aria-haspopup="menu"
      >
        Menu
      </button>
      {open ? (
        <div className="absolute left-4 right-4 top-[72px] z-50 rounded-3xl border border-white/10 bg-ink p-5 shadow-soft md:hidden" role="menu">
          <div className="grid gap-2">
            {links.map(([label, href]) => {
              const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`)
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={active 
                    ? "rounded-xl px-3 py-3 font-black text-lime bg-white/5" 
                    : "rounded-xl px-3 py-3 font-bold text-white/75 hover:bg-white/10 hover:text-white transition-colors duration-200"
                  }
                  role="menuitem"
                  onClick={() => setOpen(false)}
                >
                  {label}
                </Link>
              )
            })}
          </div>
          <div className="mt-4 border-t border-white/10 pt-4">
            {customer ? (
              <>
                <p className="break-all text-sm font-black">{customer.email}</p>
                <p className="mt-1 text-sm text-white/60">{customer.credits} report credits</p>
                <div className="mt-3 grid gap-2">
                  <Link href="/dashboard/billing" className="rounded-xl px-3 py-3 font-bold text-white/75 hover:bg-white/10 hover:text-white transition-colors" onClick={() => setOpen(false)}>Billing</Link>
                  <Link href="/dashboard/settings" className="rounded-xl px-3 py-3 font-bold text-white/75 hover:bg-white/10 hover:text-white transition-colors" onClick={() => setOpen(false)}>Settings</Link>
                  <MobileSignOut />
                </div>
              </>
            ) : (
              <div className="grid gap-2">
                <Link href="/login" className="rounded-xl px-3 py-3 font-bold text-white/75 hover:bg-white/10 hover:text-white transition-colors" onClick={() => setOpen(false)}>Sign in</Link>
                <Link href="/signup" className="rounded-xl bg-lime px-3 py-3 text-center font-black text-black transition-colors" onClick={() => setOpen(false)}>Sign up</Link>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function MobileSignOut() {
  async function signOut() {
    const response = await fetch("/api/auth/logout", { method: "POST" })
    if (response.ok) window.location.href = "/"
  }

  return (
    <button onClick={signOut} className="rounded-xl px-3 py-3 text-left font-black text-coral hover:bg-white/10">
      Sign out
    </button>
  )
}
