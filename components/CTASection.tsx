import Link from "next/link"

export function CTASection() {
  return (
    <section className="px-5 py-20">
      <div className="mx-auto max-w-6xl rounded-[32px] border border-white/10 bg-lime p-8 text-ink shadow-soft md:p-14">
        <p className="text-sm font-black uppercase">Build the first report</p>
        <h2 className="mt-4 max-w-3xl text-4xl font-black leading-tight md:text-6xl">
          Paste a competitor URL and get customer insight before your next product decision.
        </h2>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/dashboard" className="rounded-full bg-ink px-6 py-4 font-black text-white">Run a report</Link>
          <Link href="/pricing" className="rounded-full border border-ink/20 px-6 py-4 font-black">View pricing</Link>
        </div>
      </div>
    </section>
  )
}
