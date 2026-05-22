import Link from "next/link"
import { site } from "@/lib/content"
import { getCurrentCustomer } from "@/lib/customer-session"
import { AccountMenu } from "@/components/AccountMenu"

const links = [
  ["My reports", "/dashboard/reports"],
  ["Pricing", "/pricing"],
  ["Resources", "/resources"],
  ["Contact", "/contact"]
]

export async function Header() {
  const customer = await getCurrentCustomer()

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-ink/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4">
        <Link href="/" className="flex items-center gap-3 font-black">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-lime text-ink">ES</span>
          {site.name}
        </Link>
        <nav className="hidden items-center gap-5 text-sm text-white/74 md:flex">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="hover:text-white">{label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {customer ? (
            <AccountMenu email={customer.email} credits={customer.credits} />
          ) : (
            <>
              <Link href="/login" className="hidden text-sm font-bold text-white/74 hover:text-white sm:inline">Sign in</Link>
              <Link href="/signup" className="hidden text-sm font-bold text-white/74 hover:text-white lg:inline">Sign up</Link>
            </>
          )}
          <Link href="/dashboard/reports" className="btn-primary text-sm">Run report</Link>
        </div>
      </div>
    </header>
  )
}
