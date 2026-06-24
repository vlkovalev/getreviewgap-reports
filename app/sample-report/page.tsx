import type { Metadata } from "next"
import Link from "next/link"
import { buildSampleReport } from "@/lib/sample-report"

export const metadata: Metadata = { title: "Example report", description: "A full example ReviewGap review intelligence report, built from synthetic sample data to show the report structure." }

type SampleInsight = {
  executiveSummary: string
  topComplaints: Array<{ theme: string; evidence: string; severity: string; productImplication: string }>
  topCompliments: Array<{ theme: string; evidence: string; marketingImplication: string }>
  buyerLanguage: string[]
  productImprovementIdeas: Array<{ idea: string; whyItMatters: string; confidence: string }>
  adHooks: string[]
  positioningAngles: string[]
  assumptions: string[]
  dataQuality: { reviewCount: number; limitations: string[] }
  competitiveGap: { competitorsAnalyzed: string[]; primaryWins: string[]; primaryLosses: string[]; openGaps: string[] }
  emergingSignals: Array<{ theme: string; count: number; firstSeen: string }>
}

export default function SampleReportPage() {
  const sample = buildSampleReport("public-sample")
  const insight = sample.data.insight as SampleInsight
  const summary = sample.summary

  return (
    <main className="px-5 py-20">
      <div className="mx-auto max-w-4xl">
        <span className="rounded-full border border-yellow-300/40 bg-yellow-300/15 px-3 py-1 text-xs font-black uppercase text-yellow-200">Example report</span>
        <h1 className="mt-4 text-4xl font-black md:text-6xl">{String(summary.productName)}</h1>
        <p className="mt-4 max-w-2xl text-white/70">
          This is synthetic sample data, not a real product or real customer reviews. It exists to show the full structure of a ReviewGap report before you spend a credit. Run your own report from a real Amazon listing or Shopify review export to get real findings.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <span className="rounded-full border border-lime/40 bg-lime/15 px-2.5 py-1 text-xs font-black text-lime uppercase">{String(summary.platform)}</span>
          <span className="rounded-full border border-cyan/40 bg-cyan/15 px-2.5 py-1 text-xs font-black text-cyan uppercase">Sample data</span>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3 text-center md:max-w-md">
          <div className="card p-4">
            <p className="text-[10px] uppercase text-white/50">Analyzed reviews</p>
            <p className="mt-1 text-lg font-black text-white">{String(summary.reviewCount)}</p>
          </div>
          <div className="card p-4">
            <p className="text-[10px] uppercase text-white/50">Marketplace ratings</p>
            <p className="mt-1 text-lg font-black text-white">{Number(summary.marketplaceRatingCount).toLocaleString("en-US")}</p>
          </div>
          <div className="card p-4">
            <p className="text-[10px] uppercase text-white/50">Depth</p>
            <p className="mt-1 text-lg font-black text-lime">{String(summary.reviewDepth)}</p>
          </div>
        </div>

        <Section title="Executive summary">
          <p className="text-white/80">{insight.executiveSummary}</p>
        </Section>

        <Section title="Top complaints">
          <div className="grid gap-4">
            {insight.topComplaints.map((item) => (
              <div key={item.theme} className="rounded-2xl border border-red-400/20 bg-red-400/5 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black text-red-100">{item.theme}</p>
                  <span className="rounded-full border border-red-400/30 px-2 py-0.5 text-xs font-black uppercase text-red-300">{item.severity}</span>
                </div>
                <p className="mt-2 text-sm text-red-100/70">{item.evidence}</p>
                <p className="mt-2 text-sm font-medium text-red-200/90">Action: {item.productImplication}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Top compliments">
          <div className="grid gap-4">
            {insight.topCompliments.map((item) => (
              <div key={item.theme} className="rounded-2xl border border-lime/20 bg-lime/5 p-5">
                <p className="font-black text-lime">{item.theme}</p>
                <p className="mt-2 text-sm text-lime/70">{item.evidence}</p>
                <p className="mt-2 text-sm font-medium text-lime/90">Use: {item.marketingImplication}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Buyer language">
          <ul className="grid gap-2 text-white/80">
            {insight.buyerLanguage.map((phrase) => <li key={phrase} className="rounded-xl bg-white/5 px-4 py-2">{phrase}</li>)}
          </ul>
        </Section>

        <Section title="Product improvement ideas">
          <div className="grid gap-4">
            {insight.productImprovementIdeas.map((item) => (
              <div key={item.idea} className="rounded-2xl border border-cyan/20 bg-cyan/5 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black text-cyan">{item.idea}</p>
                  <span className="rounded-full border border-cyan/30 px-2 py-0.5 text-xs font-black uppercase text-cyan">{item.confidence}</span>
                </div>
                <p className="mt-2 text-sm text-cyan/80">{item.whyItMatters}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Ad hooks">
          <ul className="grid gap-2 text-white/80">
            {insight.adHooks.map((hook, index) => <li key={index} className="rounded-xl bg-white/5 px-4 py-2">{hook}</li>)}
          </ul>
        </Section>

        <Section title="Positioning angles">
          <ul className="grid gap-2 text-white/80">
            {insight.positioningAngles.map((angle, index) => <li key={index} className="rounded-xl bg-white/5 px-4 py-2">{angle}</li>)}
          </ul>
        </Section>

        <Section title="Competitive gap">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-black uppercase text-lime">Primary wins</p>
              <ul className="mt-2 grid gap-1 text-sm text-white/75">
                {insight.competitiveGap.primaryWins.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-black uppercase text-red-300">Primary losses</p>
              <ul className="mt-2 grid gap-1 text-sm text-white/75">
                {insight.competitiveGap.primaryLosses.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 md:col-span-2">
              <p className="text-xs font-black uppercase text-cyan">Open gaps</p>
              <ul className="mt-2 grid gap-1 text-sm text-white/75">
                {insight.competitiveGap.openGaps.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          </div>
        </Section>

        <Section title="Emerging signals">
          <ul className="grid gap-2 text-white/80">
            {insight.emergingSignals.map((signal) => (
              <li key={signal.theme} className="rounded-xl bg-white/5 px-4 py-2">
                {signal.theme} — {signal.count} mentions, first seen {signal.firstSeen}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Assumptions and limitations">
          <ul className="grid gap-2 text-white/60">
            {[...insight.assumptions, ...insight.dataQuality.limitations].map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        </Section>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link href="/signup" className="btn-primary">Run your own report</Link>
          <Link href="/pricing" className="btn-secondary">See plans</Link>
        </div>
      </div>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <p className="text-xs font-black uppercase tracking-wider text-white/45">{title}</p>
      <div className="mt-3">{children}</div>
    </section>
  )
}
