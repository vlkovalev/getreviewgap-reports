import Link from "next/link"
import { CTASection } from "@/components/CTASection"
import { FAQSection } from "@/components/FAQSection"

const benefits = [
  "Find competitor complaints before you repeat the same product flaws.",
  "Extract buyer language for product pages, listings, and ad hooks.",
  "Spot repeated objections around quality, value, shipping, packaging, and sizing.",
  "Create simple reports an agency or product team can use the same day."
]

const steps = [
  ["Choose a product", "Paste an Amazon product URL or run a demo report while your review source is being connected."],
  ["Generate insights", "AI groups sentiment, repeated complaints, rating signals, buyer phrases, and product gaps."],
  ["Use the report", "Export a concise report for product, listing, CRO, and advertising decisions."]
]

const reportOutputs = [
  ["Top complaints", "Repeated issues buyers mention across reviews."],
  ["Top compliments", "Positive phrases and product strengths worth amplifying."],
  ["Buyer language", "Real phrases customers use when describing outcomes and objections."],
  ["Product gaps", "Actionable improvement ideas for listings, bundles, packaging, and messaging."]
]

const trustNotes = [
  "Public review intelligence only",
  "No CAPTCHA, login, paywall, or private data bypassing",
  "Private reports attached to your account",
  "CSV, JSON, and PDF-oriented exports"
]

export default function HomePage() {
  return (
    <main>
      <section className="grid-bg px-5 py-20 md:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1fr_.9fr]">
          <div>
            <p className="font-black uppercase text-lime">Reviews, ratings, and sentiment intelligence</p>
            <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[.95] md:text-7xl">
              Affordable AI review reports for Shopify brands and Amazon sellers.
            </h1>
            <p className="mt-6 max-w-2xl text-xl text-white/72">
              ReviewIntel Reports turns public Amazon product reviews into sentiment summaries, product gaps, rating signals, and buyer-language insights for sellers with 10-500 SKUs.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/dashboard/reports" className="btn-primary">Run a sample report</Link>
              <Link href="/pricing" className="btn-secondary">See plans</Link>
            </div>
          </div>
          <div className="card p-6 shadow-soft">
            <div className="rounded-3xl border border-white/10 bg-white/8 p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="font-black text-lime">Competitor report</p>
                <span className="rounded-full bg-yellow-300 px-3 py-1 text-xs font-black text-ink">NEEDS REVIEW</span>
              </div>
              <h2 className="mt-5 text-3xl font-black">Glow Serum Sentiment</h2>
              <p className="mt-3 text-white/66">Positive sentiment clusters around texture and glow. Negative sentiment repeats around leaking pumps and size/value expectations.</p>
              <div className="mt-6 grid gap-3">
                {["Top complaint: leaking pump", "Buyer phrase: smaller than expected", "Ad hook: glow without sticky residue"].map((item) => (
                  <div key={item} className="rounded-2xl bg-white/8 p-4 text-sm text-white/76">{item}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="font-black uppercase text-cyan">Why it matters</p>
            <h2 className="mt-3 text-4xl font-black md:text-6xl">The best product research is already in customer reviews.</h2>
            <p className="mt-5 text-lg text-white/70">
              Reading hundreds of reviews manually is slow. ReviewIntel turns public customer feedback into clear product, listing, and marketing insights so small teams can move faster.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {benefits.map((benefit) => <div key={benefit} className="card p-5 font-bold text-white/78">{benefit}</div>)}
          </div>
        </div>
      </section>

      <section className="px-5 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-[.85fr_1.15fr]">
            <div>
              <p className="font-black uppercase text-yellow-300">What you get</p>
              <h2 className="mt-3 text-4xl font-black md:text-6xl">A report built for decisions, not data overload.</h2>
              <p className="mt-5 text-white/70">Each credit produces a focused AI review intelligence report you can use for product improvements, listing copy, customer objections, and campaign angles.</p>
            </div>
            <div className="grid gap-3">
              {reportOutputs.map(([title, text]) => (
                <div key={title} className="rounded-2xl border border-yellow-300/20 bg-yellow-300/10 p-4">
                  <p className="font-black text-yellow-50">{title}</p>
                  <p className="mt-1 text-sm text-yellow-50/70">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-4xl font-black md:text-6xl">How it works</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {steps.map(([title, text], index) => (
              <article key={title} className="card p-7">
                <span className="text-sm font-black text-lime">0{index + 1}</span>
                <h3 className="mt-5 text-2xl font-black">{title}</h3>
                <p className="mt-3 text-white/66">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
          <div>
            <p className="font-black uppercase text-coral">For who</p>
            <h2 className="mt-3 text-4xl font-black md:text-6xl">Built for teams who need insights, not another giant dashboard.</h2>
          </div>
          <div className="grid gap-3">
            {["Amazon sellers validating product improvements", "Shopify brands researching competitor weaknesses", "Agencies preparing listing copy and ad angles", "DTC teams monitoring ratings and sentiment changes"].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/7 p-4 font-bold">{item}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-3xl border border-lime/30 bg-lime/10 p-8">
            <p className="font-black uppercase text-lime">Simple pricing</p>
            <h2 className="mt-3 text-4xl font-black md:text-5xl">Start at $5. Upgrade when reports become a workflow.</h2>
            <p className="mt-5 text-white/70">Buy one report, grab a one-time pack, or use monthly credits that roll over up to 3x.</p>
            <Link href="/pricing" className="btn-primary mt-7">View pricing</Link>
          </div>
          <div className="grid gap-3">
            {trustNotes.map((note) => (
              <div key={note} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 font-bold text-white/78">{note}</div>
            ))}
          </div>
        </div>
      </section>

      <FAQSection />
      <CTASection />
    </main>
  )
}
