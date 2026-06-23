import Link from "next/link"
import { site } from "@/lib/content"
import { getCurrentCustomer } from "@/lib/customer-session"
import { HeaderActions } from "@/components/HeaderActions"

const links: Array<[string, string]> = [
  ["Home", "/"],
  ["My reports", "/dashboard/reports"],
  ["Beta guide", "/beta-guide"],
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
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-lime text-ink">RG</span>
          {site.name}
        </Link>
        <HeaderActions links={links} customer={customer ? { email: customer.email, credits: customer.credits } : null} />
      </div>
    </header>
  )
}
