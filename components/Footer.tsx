import Link from "next/link"
import { site } from "@/lib/content"

export function Footer() {
  return (
    <footer className="border-t border-white/10 px-5 py-10 text-sm text-white/60">
      <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-5">
        <div className="md:col-span-2">
          <p className="font-black text-white">{site.name}</p>
          <p className="mt-3 max-w-md">{site.description}</p>
        </div>
        <Link href="/compliance">Compliance</Link>
        <Link href="/privacy">Privacy Policy</Link>
        <Link href="/terms">Terms</Link>
      </div>
    </footer>
  )
}
