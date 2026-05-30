import Link from "next/link"
import { site } from "@/lib/content"

const footerLinks = [
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
  { label: "Resources", href: "/resources" },
  { label: "Contact", href: "/contact" },
  { label: "Compliance", href: "/compliance" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms", href: "/terms" }
]

export function Footer() {
  return (
    <footer className="border-t border-white/10 px-5 py-10 text-sm text-white/60">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-black text-white">{site.name}</p>
            <p className="mt-2 max-w-xs">AI competitor review intelligence for Shopify brands and Amazon sellers.</p>
          </div>
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-6 gap-y-3">
            {footerLinks.map(({ label, href }) => (
              <Link key={href} href={href} className="hover:text-white transition-colors">{label}</Link>
            ))}
          </nav>
        </div>
        <p className="mt-8 text-xs text-white/40">&copy; {new Date().getFullYear()} {site.name}. All rights reserved.</p>
      </div>
    </footer>
  )
}
