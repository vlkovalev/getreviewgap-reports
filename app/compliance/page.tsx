import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Compliance",
  description: "Lawful-use and data handling commitments for ReviewIntel Reports."
}

const commitments = [
  "Analyze only review data the customer is allowed to provide, access, or process.",
  "Do not bypass logins, paywalls, CAPTCHAs, geo-blocks, or other access controls.",
  "Do not resell raw marketplace pages, private user data, seller contact data, or competitor price feeds.",
  "Use third-party connectors only when the user has a lawful basis and the connector is permitted for that use.",
  "Store only the data needed to create, export, and retrieve the customer's report.",
  "Return report credits automatically when generation fails after a credit is consumed."
]

const customerChecklist = [
  "Confirm your review source allows your intended collection or analysis.",
  "Prefer pasted reviews, exported review files, official APIs, or approved data providers when available.",
  "Avoid submitting personal, sensitive, private, or account-only information.",
  "Review AI-generated findings before using them for product, advertising, legal, or inventory decisions."
]

export default function CompliancePage() {
  return (
    <main className="px-5 py-20">
      <div className="mx-auto max-w-4xl">
        <p className="font-black uppercase text-lime">Compliance</p>
        <h1 className="mt-4 text-5xl font-black leading-none md:text-7xl">Built for lawful review intelligence.</h1>
        <p className="mt-6 max-w-3xl text-lg text-white/70">
          ReviewIntel Reports is designed to summarize and transform permitted review data into private research reports. It is not designed for access-control evasion, raw data resale, or broad competitor scraping.
        </p>

        <section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-2xl font-black">Product boundaries</h2>
          <div className="mt-5 grid gap-3">
            {commitments.map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-black/25 p-4 text-white/72">{item}</div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-lime/25 bg-lime/10 p-6">
          <h2 className="text-2xl font-black">Customer checklist</h2>
          <div className="mt-5 grid gap-3">
            {customerChecklist.map((item) => (
              <div key={item} className="rounded-2xl border border-lime/20 bg-black/20 p-4 text-white/76">{item}</div>
            ))}
          </div>
        </section>

        <p className="mt-8 text-sm text-white/50">
          This page is an operational compliance summary, not legal advice. Before large-scale public launch, have counsel review the Terms, Privacy Policy, data sources, and connector usage.
        </p>
      </div>
    </main>
  )
}
