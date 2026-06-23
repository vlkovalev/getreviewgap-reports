import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Private Beta Guide",
  description: "How to test ReviewGap competitor review-intelligence reports during the private beta."
}

const steps = [
  {
    title: "Start with Amazon",
    body: "Paste a real Amazon product URL from a competitor product with enough written reviews. Amazon is the primary private-beta workflow."
  },
  {
    title: "Use exports for Shopify",
    body: "For Shopify/DTC stores, upload or paste an authorized review export from Judge.me, Loox, Yotpo, Okendo, Stamped, Shopify Product Reviews, or another review app."
  },
  {
    title: "Check the warnings",
    body: "Reports include source and coverage notes. Treat the output as decision support, not as a final product, legal, inventory, or safety recommendation."
  },
  {
    title: "Export and report issues",
    body: "Open the report, export PDF/CSV/JSON, and note any confusing language, missing evidence, or formatting issues."
  }
]

const boundaries = [
  "ReviewGap analyzes existing competitor/customer review text.",
  "ReviewGap does not send review requests to your customers.",
  "ReviewGap does not manage Google reviews, SMS campaigns, WhatsApp campaigns, reminders, or unsubscribe lists.",
  "Shopify live connectors are beta checks; authorized CSV/TXT exports are the stable path."
]

export default function BetaGuidePage() {
  return (
    <main className="px-5 py-20">
      <div className="mx-auto max-w-5xl">
        <p className="font-black uppercase text-lime">Private beta guide</p>
        <h1 className="mt-4 text-5xl font-black leading-none md:text-7xl">Test competitor review intelligence, not review collection.</h1>
        <p className="mt-6 max-w-3xl text-lg text-white/70">
          ReviewGap is currently a reporting tool for finding product gaps, buyer language, complaints, compliments, and marketing angles from existing reviews.
        </p>

        <section className="mt-10 grid gap-4 md:grid-cols-2">
          {steps.map((step, index) => (
            <article key={step.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <p className="text-sm font-black text-lime">0{index + 1}</p>
              <h2 className="mt-3 text-2xl font-black">{step.title}</h2>
              <p className="mt-3 text-white/68">{step.body}</p>
            </article>
          ))}
        </section>

        <section className="mt-10 rounded-3xl border border-cyan/25 bg-cyan/10 p-6">
          <h2 className="text-2xl font-black">Product boundaries</h2>
          <div className="mt-5 grid gap-3">
            {boundaries.map((item) => (
              <div key={item} className="rounded-xl border border-white/10 bg-black/25 p-4 text-white/75">{item}</div>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-2xl font-black">What to test first</h2>
          <div className="mt-5 grid gap-3 text-white/70">
            <p>1. Generate one Amazon report from a product you know well.</p>
            <p>2. Export the report as PDF and CSV.</p>
            <p>3. Check whether the top complaints, buyer phrases, and product gaps match what you see in the real market.</p>
            <p>4. For Shopify, use an authorized review export before testing live connector detection.</p>
          </div>
          <Link href="/dashboard/reports" className="btn-primary mt-6">Generate a beta report</Link>
        </section>
      </div>
    </main>
  )
}
