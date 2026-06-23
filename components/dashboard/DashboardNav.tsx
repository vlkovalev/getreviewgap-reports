"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/reports", label: "Generate report" },
  { href: "/dashboard/billing", label: "Billing" },
  { href: "/dashboard/settings", label: "Settings" },
  { href: "/dashboard/sources", label: "Advanced sources" },
  { href: "/dashboard/jobs", label: "Advanced batches" },
  { href: "/dashboard/runs", label: "Run history" },
  { href: "/dashboard/products", label: "Products reviewed" }
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="mb-8 flex flex-wrap gap-2">
      {links.map((link) => {
        const active = link.href === "/dashboard" ? pathname === "/dashboard" : pathname === link.href || pathname.startsWith(`${link.href}/`)
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={active ? "rounded-full border border-lime bg-lime px-4 py-2 text-sm font-black text-black" : "rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-lime hover:text-black"}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
