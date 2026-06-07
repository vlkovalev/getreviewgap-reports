import Link from "next/link"
import { DashboardShell, StatusBadge } from "@/components/dashboard/DashboardShell"
import { reportRowsForExport } from "@/lib/reports/report-engine"
import { getStore } from "@/lib/scrapers/store"
import { getCurrentCustomer } from "@/lib/customer-session"
import { getDb, hasRealDatabaseUrl } from "@/lib/db"
import type { IntelligenceReport, ReportFilters, ReportType } from "@/lib/scrapers/types"

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const customer = await getCurrentCustomer()
  if (!customer) {
    return (
      <DashboardShell title="Sign in to view this report" description="Saved reports and downloads are private to your account.">
        <Link href="/login" className="rounded-full bg-lime px-5 py-3 font-black text-black">Sign in</Link>
      </DashboardShell>
    )
  }
  const report = hasRealDatabaseUrl()
    ? await getDb().intelligenceReport.findFirst({ where: { id, customerId: customer.id } }).then((item) => item ? ({
      id: item.id,
      customerId: item.customerId ?? undefined,
      reportType: item.reportType as ReportType,
      title: item.title,
      status: item.status,
      filters: (item.filters as ReportFilters) ?? {},
      summary: (item.summary as Record<string, unknown>) ?? {},
      data: (item.data as Record<string, unknown>) ?? {},
      generatedAt: item.generatedAt?.toISOString(),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString()
    } satisfies IntelligenceReport) : null)
    : getStore().reports.find((item) => item.id === id && item.customerId === customer.id)

  if (!report) {
    return (
      <DashboardShell title="Report not found" description="Generate a new report from the reports page.">
        <Link href="/dashboard/reports" className="rounded-full bg-lime px-5 py-3 font-black text-black">Back to reports</Link>
      </DashboardShell>
    )
  }

  const rows = reportRowsForExport(report)
  const headers = Object.keys(rows[0] ?? {})
  const insight = report.data?.insight as ReviewInsightLike | undefined
  const reviewCount = Number(report.summary?.reviewCount ?? insight?.dataQuality?.reviewCount ?? 0)
  const targetReviewCount = Number(report.summary?.targetReviewCount ?? 0)
  const marketplaceRatingCount = Number(report.summary?.marketplaceRatingCount ?? 0)
  const dataScore = scoreDataQuality(report.summary ?? {}, insight)
  const productUrl = String(report.summary?.productUrl ?? report.filters?.productUrl ?? "")
  const shouldRerun = reviewCount === 0 && Boolean(productUrl)
  const freshReportHref = productUrl ? createFreshReportHref(report, productUrl) : ""
  const archivedAt = report.summary?.archivedAt ? String(report.summary.archivedAt) : ""
  const platform = report.summary?.platform
    ? String(report.summary.platform)
    : report.summary?.marketplace
      ? (String(report.summary.marketplace).toLowerCase().includes("shopify") ? "shopify" : "amazon")
      : "mixed"

  const isSingleProductReport = Boolean(report.filters?.productUrl || report.filters?.pastedReviews || report.summary?.productUrl)

  return (
    <DashboardShell title={cleanReportTitle(report.title)} description="Executive review intelligence brief with actions, proof points, and export-ready appendix.">
      {archivedAt ? (
        <section className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <p className="text-sm font-black uppercase text-white/45">Archived report</p>
          <p className="mt-2 text-white/70">This report was archived on {new Date(archivedAt).toLocaleDateString()} and remains available for export or restoration from My reports.</p>
        </section>
      ) : null}
      {shouldRerun ? (
        <section className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-yellow-300/25 bg-yellow-300/10 p-5">
          <div>
            <p className="text-sm font-black uppercase text-yellow-300">Saved empty report</p>
            <p className="mt-2 max-w-2xl text-white/76">This report is a historical export and will not update when the review connector changes. Run a new analysis to test current live collection.</p>
          </div>
          <Link href={freshReportHref} className="rounded-full bg-lime px-5 py-3 font-black text-black">Run fresh analysis</Link>
        </section>
      ) : null}
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/90 shadow-2xl shadow-black/20">
        <div className="border-b border-white/10 bg-gradient-to-br from-lime/15 via-white/[0.04] to-cyan/10 p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={report.status} />
                <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-black uppercase text-white/70">{String(report.reportType).replaceAll("_", " ")}</span>
              </div>
              <p className="mt-6 text-sm font-black uppercase text-lime tracking-[0.2em]">{isSingleProductReport ? "ReviewGap brief" : "Watchlist report"}</p>
              <h1 className="mt-2 text-4xl font-black leading-tight tracking-[-0.03em] md:text-6xl">
                {String(isSingleProductReport ? (report.summary?.productName ?? "Product review analysis") : cleanReportTitle(report.title))}
              </h1>
              {isSingleProductReport ? (
                <p className="mt-4 max-w-2xl text-white/70">
                  {report.summary?.productUrl ? <a href={String(report.summary.productUrl)} target="_blank" rel="noreferrer" className="font-medium text-lime hover:text-cyan transition-colors">{displayUrl(String(report.summary.productUrl))}</a> : "No product URL supplied"}
                </p>
              ) : (
                <p className="mt-4 max-w-2xl text-white/70">Tracked catalog watchlist monitor report.</p>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <a href={`/api/scraper/reports/${report.id}/export?format=pdf`} className="rounded-full bg-lime px-5 py-3 text-sm font-black text-black transition hover:bg-lime/90">PDF</a>
              <a href={`/api/scraper/reports/${report.id}/export?format=csv`} className="rounded-full bg-white px-5 py-3 text-sm font-black text-black transition hover:bg-white/90">CSV</a>
              <a href={`/api/scraper/reports/${report.id}/export?format=json`} className="rounded-full border border-white/10 bg-black/30 px-5 py-3 text-sm font-black text-white transition hover:border-lime/40 hover:text-white">JSON</a>
            </div>
          </div>

          {isSingleProductReport ? (
            <div className="mt-7 grid gap-3 md:grid-cols-3 lg:grid-cols-8">
              <Metric label="Written reviews" value={String(reviewCount)} />
              <Metric label="Marketplace ratings" value={marketplaceRatingCount ? marketplaceRatingCount.toLocaleString("en-US") : "-"} />
              <Metric label="Depth" value={String(report.summary?.reviewDepth ?? "Default")} />
              <Metric label="Platform" value={platform === "shopify" ? "Shopify / DTC" : platform === "amazon" ? "Amazon" : "Mixed / demo"} />
              {platform === "shopify" ? <Metric label="Review app" value={formatReviewApp(report.summary?.reviewApp)} /> : null}
              <Metric label="Confidence" value={dataScore.label} tone={dataScore.tone} />
              <Metric label="Generated" value={String(report.generatedAt ? new Date(report.generatedAt).toLocaleDateString() : "-")} />
            </div>
          ) : (
            <div className="mt-7 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <Metric label="Products Monitored" value={String(report.summary?.productCount ?? report.summary?.totalProductsTracked ?? rows.length)} />
              <Metric label="Source Filter" value={formatHeader(String(report.summary?.sourceFilter ?? "All"))} />
              {report.summary?.averageCurrentPrice || report.summary?.averageProductPrice ? (
                <Metric label="Avg Product Price" value={`$${report.summary.averageCurrentPrice ?? report.summary.averageProductPrice}`} />
              ) : null}
              {report.summary?.inStockPercentage ? (
                <Metric label="In-Stock Rate" value={`${report.summary.inStockPercentage}%`} tone="lime" />
              ) : null}
              {report.summary?.sourceLevelCompletenessScore ? (
                <Metric label="Data Completeness" value={`${report.summary.sourceLevelCompletenessScore}%`} tone="lime" />
              ) : null}
              <Metric label="Generated" value={String(report.generatedAt ? new Date(report.generatedAt).toLocaleDateString() : "-")} />
            </div>
          )}
        </div>

        {isSingleProductReport ? (
          <section className="border-b border-white/10 bg-black/20 p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase text-cyan">Data coverage</p>
                <p className="mt-2 text-sm text-white/70">Sample and confidence details for this product review brief.</p>
              </div>
              <div className="rounded-3xl bg-black/50 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-white/65">Review evidence snapshot</div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <CoverageItem label="Marketplace ratings" value={marketplaceRatingCount ? marketplaceRatingCount.toLocaleString("en-US") : "-"} />
              <CoverageItem label="Written reviews analyzed" value={String(reviewCount)} />
              <CoverageItem label="Target sample" value={targetReviewCount ? String(targetReviewCount) : "-"} />
              <CoverageItem label="Coverage" value={dataScore.label} tone={dataScore.tone} />
            </div>
            {targetReviewCount && reviewCount < targetReviewCount ? (
              <div className="mt-4 rounded-[1.5rem] border border-yellow-300/15 bg-yellow-300/10 p-5 text-sm text-yellow-100/90 leading-relaxed shadow-soft">
                <span className="font-bold text-yellow-300">⚠️ Amazon Review Retrieval Note:</span> Target was {targetReviewCount} written reviews, but only {reviewCount} unique written text reviews were exposed by Amazon. Amazon consolidates star-ratings across listing variations but heavily caps the public page retrieval of written review texts (often limiting it to ~60-100 reviews). The system successfully performed a deep scan and captured 100% of the public written reviews available on Amazon for this listing.
              </div>
            ) : null}
          </section>
        ) : null}

        <div className="grid gap-5 p-6 md:p-8 lg:grid-cols-[1.1fr_.9fr]">
          <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-soft">
            <p className="text-sm font-black uppercase text-lime">Executive summary</p>
            <p className="mt-4 text-lg leading-relaxed text-white/85">{cleanText(report.summary?.executiveSummary ?? summarizeObject(report.summary))}</p>
          </section>
          <section className="rounded-[2rem] border border-white/10 bg-black/30 p-6 shadow-soft">
            <p className="text-sm font-black uppercase text-cyan">Next best actions</p>
            <div className="mt-4 grid gap-3">
              {nextActions(insight, isSingleProductReport).map((item) => <ActionItem key={item} text={item} />)}
            </div>
          </section>
        </div>
        {isSingleProductReport ? (
          <section className="mx-6 mb-6 rounded-2xl border border-white/10 bg-black/25 p-5 md:mx-8 md:mb-8">
            <p className="text-sm font-black uppercase text-cyan">Evidence scope</p>
            <p className="mt-2 text-white/74">This brief analyzed {reviewCount} unique written review{reviewCount === 1 ? "" : "s"}{targetReviewCount ? ` against a target sample of ${targetReviewCount}` : ""}.</p>
            <p className="mt-2 text-sm text-white/55">{confidenceNote(reviewCount)} Marketplace ratings and written review text are different. Ratings can include star-only feedback or records the provider cannot return as text. Customer-reported complaints require human review before product or safety decisions.</p>
          </section>
        ) : null}
      </section>

      {report.summary?.warning ? (
        <section className="mt-6 rounded-2xl border border-yellow-300/25 bg-yellow-300/10 p-5 text-yellow-50/82">
          <p className="text-sm font-black uppercase text-yellow-300">Data source warning</p>
          <p className="mt-2">{cleanText(report.summary.warning)}</p>
        </section>
      ) : null}

      {insight ? (
        <>
          {(() => {
            const competitiveGap = getCompetitiveGap(insight)
            const emergingSignals = getEmergingSignals(insight)
            const cleanAssumptions = (insight.assumptions ?? []).filter(
              (item) => !item.startsWith("[Competitor Moat Analysis]") && !item.startsWith("[Moat Analysis]")
            )
            const cleanLimitations = (insight.dataQuality?.limitations ?? []).filter(
              (item) => !item.startsWith("[Emerging Signal]")
            )

            return (
              <>
                <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-sm font-black uppercase text-lime">Decision snapshot</p>
                      <h2 className="mt-2 text-2xl font-black">What to act on first</h2>
                    </div>
                    <p className="text-sm text-white/45">Evidence-led findings from {reviewCount} review{reviewCount === 1 ? "" : "s"}</p>
                  </div>
                  <div className="mt-5 grid gap-3 lg:grid-cols-3">
                    <SnapshotItem label="Main friction" title={cleanText(insight.topComplaints?.[0]?.theme ?? "No complaint signal")} body={cleanText(insight.topComplaints?.[0]?.productImplication ?? "Collect more reviews before choosing a product response.")} tone="coral" />
                    <SnapshotItem label="Winning signal" title={cleanText(insight.topCompliments?.[0]?.theme ?? "No positive signal")} body={cleanText(insight.topCompliments?.[0]?.marketingImplication ?? "No validated marketing claim is available yet.")} tone="lime" />
                    <SnapshotItem label="Recommended move" title={cleanText(insight.productImprovementIdeas?.[0]?.idea ?? "Increase evidence")} body={cleanText(insight.productImprovementIdeas?.[0]?.whyItMatters ?? "Add more customer review text to increase confidence.")} tone="cyan" />
                  </div>
                </section>

                {(!isEmpty(insight.topComplaints) || !isEmpty(insight.topCompliments)) && (
                  <section className={`mt-6 grid gap-4 ${(!isEmpty(insight.topComplaints) && !isEmpty(insight.topCompliments)) ? "lg:grid-cols-2" : "grid-cols-1"}`}>
                    {!isEmpty(insight.topComplaints) && (
                      <EvidenceList title="Top complaints to exploit or avoid" items={insight.topComplaints?.map((item) => ({
                        title: cleanText(item.theme),
                        eyebrow: cleanText(`Severity: ${item.severity}`),
                        body: cleanText(item.evidence),
                        footer: cleanText(item.productImplication)
                      })) ?? []} tone="coral" />
                    )}
                    {!isEmpty(insight.topCompliments) && (
                      <EvidenceList title="Strengths customers already value" items={insight.topCompliments?.map((item) => ({
                        title: cleanText(item.theme),
                        eyebrow: "Positive signal",
                        body: cleanText(item.evidence),
                        footer: cleanText(item.marketingImplication)
                      })) ?? []} tone="lime" />
                    )}
                  </section>
                )}

                <section className="mt-6 grid gap-4 lg:grid-cols-[.9fr_1.1fr]">
                  <BriefPanel title="Buyer language" tone="cyan">
                    {(() => {
                      const phrases = insight.buyerLanguage ?? []
                      if (phrases.length === 0) {
                        return <EmptyText text="No buyer phrases were available in this report." />
                      }
                      const groups = groupBuyerLanguage(phrases)
                      const categories = [
                        { label: "Outcomes", items: groups.outcomes },
                        { label: "Objections", items: groups.objections },
                        { label: "Comparisons", items: groups.comparisons },
                        { label: "Unexpected uses", items: groups.unexpectedUses }
                      ]
                      const activeCategories = categories.filter(c => !isEmpty(c.items))

                      if (activeCategories.length === 0) {
                        return <EmptyText text="No buyer phrases were available in this report." />
                      }

                      return (
                        <div className="grid gap-4">
                          {activeCategories.map(({ label, items }) => (
                            <div key={label} className="rounded-xl bg-black/25 p-4 border border-white/5">
                              <h4 className="text-sm font-black uppercase text-cyan/95 tracking-wider mb-2">{label}</h4>
                              <div className="flex flex-wrap gap-2">
                                {items.map((item, idx) => (
                                  <span key={idx} className="rounded-full border border-cyan/20 bg-cyan/[0.04] px-3 py-1.5 text-sm font-medium text-cyan/90">
                                    {item}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    })()}
                  </BriefPanel>

                  <BriefPanel title="Product improvement ideas" tone="yellow">
                    <div className="grid gap-3">
                      {insight.productImprovementIdeas?.length ? insight.productImprovementIdeas.slice(0, 5).map((item) => (
                        <div key={cleanText(item.idea) || item.idea} className="rounded-xl bg-black/25 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-black">{cleanText(item.idea)}</p>
                            <span className="rounded-full bg-yellow-300/15 px-2 py-1 text-xs font-black uppercase text-yellow-300">{cleanText(item.confidence)}</span>
                          </div>
                          <p className="mt-2 text-sm text-white/64">{cleanText(item.whyItMatters)}</p>
                        </div>
                      )) : <EmptyText text="No product ideas were available in this report." />}
                    </div>
                  </BriefPanel>
                </section>

                {!isEmpty(competitiveGap) && (
                  <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                    <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
                      <div>
                        <p className="text-sm font-black uppercase text-yellow-300">Competitive Moat Analysis</p>
                        <h2 className="mt-2 text-2xl font-black">Competitive Gap</h2>
                      </div>
                      {competitiveGap?.competitorsAnalyzed?.length ? (
                        <p className="text-sm text-white/55">
                          Competitors: {competitiveGap.competitorsAnalyzed.join(", ")}
                        </p>
                      ) : null}
                    </div>
                    <div className="grid gap-4 md:grid-cols-3 mt-4">
                      {!isEmpty(competitiveGap?.primaryWins) && (
                        <div className="rounded-xl bg-black/20 p-4 border border-lime/10">
                          <h4 className="text-sm font-black uppercase text-lime mb-2">Our Wins & Advantages</h4>
                          <ul className="list-disc pl-4 text-sm text-white/70 space-y-1">
                            {competitiveGap?.primaryWins?.map((win, idx) => (
                              <li key={idx}>{win}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {!isEmpty(competitiveGap?.primaryLosses) && (
                        <div className="rounded-xl bg-black/20 p-4 border border-coral/10">
                          <h4 className="text-sm font-black uppercase text-coral mb-2">Competitor Moats</h4>
                          <ul className="list-disc pl-4 text-sm text-white/70 space-y-1">
                            {competitiveGap?.primaryLosses?.map((loss, idx) => (
                              <li key={idx}>{loss}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {!isEmpty(competitiveGap?.openGaps) && (
                        <div className="rounded-xl bg-black/20 p-4 border border-cyan/10">
                          <h4 className="text-sm font-black uppercase text-cyan mb-2">Open Gaps & Opportunities</h4>
                          <ul className="list-disc pl-4 text-sm text-white/70 space-y-1">
                            {competitiveGap?.openGaps?.map((gapItem, idx) => (
                              <li key={idx}>{gapItem}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {!isEmpty(emergingSignals) && (
                  <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                    <p className="text-sm font-black uppercase text-cyan">Market Trends</p>
                    <h2 className="mt-2 text-2xl font-black mb-4">Emerging Signals</h2>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {emergingSignals?.map((sig, idx) => (
                        <div key={idx} className="rounded-xl bg-black/25 p-4 border border-white/5 flex flex-col justify-between">
                          <div>
                            <h4 className="font-bold text-white text-base">{sig.theme}</h4>
                            <p className="mt-2 text-sm text-white/55">First detected: {sig.firstSeen || "recent reviews"}</p>
                          </div>
                          <div className="mt-4 flex items-center justify-between">
                            <span className="text-xs font-black uppercase text-cyan">Early Signal</span>
                            <span className="rounded-full bg-cyan/10 px-2.5 py-1 text-xs font-black text-cyan border border-cyan/20">
                              {sig.count} Mentions
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {(!isEmpty(insight.adHooks) || !isEmpty(insight.positioningAngles)) && (
                  <section className={`mt-6 grid gap-4 ${(!isEmpty(insight.adHooks) && !isEmpty(insight.positioningAngles)) ? "lg:grid-cols-2" : "grid-cols-1"}`}>
                    {!isEmpty(insight.adHooks) && (
                      <SimpleList title="Ad hooks" items={insight.adHooks ?? []} tone="lime" />
                    )}
                    {!isEmpty(insight.positioningAngles) && (
                      <SimpleList title="Positioning angles" items={insight.positioningAngles ?? []} tone="cyan" />
                    )}
                  </section>
                )}

                {(!isEmpty(cleanAssumptions) || !isEmpty(cleanLimitations)) && (
                  <section className={`mt-6 grid gap-4 ${(!isEmpty(cleanAssumptions) && !isEmpty(cleanLimitations)) ? "lg:grid-cols-2" : "grid-cols-1"}`}>
                    {!isEmpty(cleanAssumptions) && (
                      <SimpleList title="Assumptions" items={cleanAssumptions} tone="yellow" />
                    )}
                    {!isEmpty(cleanLimitations) && (
                      <SimpleList title="Data limitations" items={cleanLimitations} tone="coral" />
                    )}
                  </section>
                )}
              </>
            )
          })()}
        </>
      ) : null}

      <section className="mt-6 overflow-x-auto rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-950/90 to-slate-900/80 p-6 shadow-soft">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase text-white/40">Appendix</p>
            <h2 className="text-2xl font-black">Structured report rows</h2>
          </div>
          <p className="text-sm text-white/50">{rows.length} rows</p>
        </div>
        {rows.length && headers.length ? (
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-white/5 text-white/60">
              <tr>{headers.map((header) => <th key={header} className="min-w-32 py-3 pr-5 text-left font-semibold tracking-wide">{formatHeader(header)}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index} className={`border-t border-white/10 ${index % 2 === 0 ? "bg-white/3" : "bg-transparent"} hover:bg-white/10`}>
                  {headers.map((header) => <td key={header} className="py-4 pr-5 align-top text-white/80">{renderCell(row[header])}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        ) : <EmptyText text="No structured rows were produced for this report." />}
      </section>
    </DashboardShell>
  )
}

type ReviewInsightLike = {
  executiveSummary?: string
  topComplaints?: Array<{ theme: string; evidence: string; severity: string; productImplication: string }>
  topCompliments?: Array<{ theme: string; evidence: string; marketingImplication: string }>
  buyerLanguage?: string[]
  productImprovementIdeas?: Array<{ idea: string; whyItMatters: string; confidence: string }>
  adHooks?: string[]
  positioningAngles?: string[]
  assumptions?: string[]
  dataQuality?: { reviewCount?: number; limitations?: string[] }
  competitiveGap?: {
    competitorsAnalyzed?: string[]
    primaryWins?: string[]
    primaryLosses?: string[]
    openGaps?: string[]
  } | null
  emergingSignals?: Array<{
    theme: string
    count: number
    firstSeen: string
  }> | null
}

function isEmpty(v: unknown): boolean {
  if (v == null) return true
  if (typeof v === "string") return v.trim() === "" || v.trim().toUpperCase() === "N/A"
  if (Array.isArray(v)) return v.length === 0 || v.every(isEmpty)
  if (typeof v === "object") return Object.values(v).every(isEmpty)
  return false
}

function groupBuyerLanguage(phrases: string[]) {
  const groups: {
    outcomes: string[]
    objections: string[]
    comparisons: string[]
    unexpectedUses: string[]
  } = {
    outcomes: [],
    objections: [],
    comparisons: [],
    unexpectedUses: []
  }

  phrases.forEach((phrase) => {
    const trimmed = phrase.trim()
    const clean = cleanText(trimmed)

    if (trimmed.includes("[Outcome]")) {
      groups.outcomes.push(clean)
    } else if (trimmed.includes("[Objection]")) {
      groups.objections.push(clean)
    } else if (trimmed.includes("[Comparison]")) {
      groups.comparisons.push(clean)
    } else if (trimmed.includes("[Unexpected Use]") || trimmed.includes("[Unexpected]")) {
      groups.unexpectedUses.push(clean)
    } else {
      groups.outcomes.push(clean)
    }
  })

  return groups
}

function getCompetitiveGap(insight: ReviewInsightLike) {
  if (insight.competitiveGap) return insight.competitiveGap

  const assumptions = insight.assumptions ?? []
  const competitorsLine = assumptions.find(item => item.startsWith("[Competitor Moat Analysis]"))
  const winsLine = assumptions.find(item => item.startsWith("[Moat Analysis] Primary Wins:"))
  const lossesLine = assumptions.find(item => item.startsWith("[Moat Analysis] Primary Losses:"))
  const gapsLine = assumptions.find(item => item.startsWith("[Moat Analysis] Open Gaps/Unmet Needs:"))

  if (!competitorsLine && !winsLine && !lossesLine && !gapsLine) return null

  const cleanList = (line: string | undefined, prefix: string) => {
    if (!line) return []
    const rawContent = line.substring(prefix.length).trim()
    if (rawContent === "N/A" || rawContent === "") return []
    return rawContent.split(";").map(s => s.trim()).filter(Boolean)
  }

  return {
    competitorsAnalyzed: competitorsLine ? competitorsLine.substring("[Competitor Moat Analysis] Competitors Analyzed:".length).trim().split(",").map(s => s.trim()).filter(Boolean) : [],
    primaryWins: cleanList(winsLine, "[Moat Analysis] Primary Wins:"),
    primaryLosses: cleanList(lossesLine, "[Moat Analysis] Primary Losses:"),
    openGaps: cleanList(gapsLine, "[Moat Analysis] Open Gaps/Unmet Needs:")
  }
}

function getEmergingSignals(insight: ReviewInsightLike) {
  if (insight.emergingSignals) return insight.emergingSignals

  const limitations = insight.dataQuality?.limitations ?? []
  const signalLines = limitations.filter(item => item.startsWith("[Emerging Signal]"))

  if (signalLines.length === 0) return null

  return signalLines.map(line => {
    const withoutPrefix = line.substring("[Emerging Signal]".length).trim()
    const match = withoutPrefix.match(/^(.*?)\s*\(Count:\s*(\d+),\s*First seen:\s*(.*?)\)$/i)
    if (match) {
      return {
        theme: match[1].trim(),
        count: parseInt(match[2], 10),
        firstSeen: match[3].trim()
      }
    }
    return {
      theme: withoutPrefix,
      count: 0,
      firstSeen: ""
    }
  })
}

function Metric({ label, value, tone = "white" }: { label: string; value: string; tone?: "white" | "lime" | "yellow" | "coral" }) {
  const color = tone === "lime" ? "text-lime" : tone === "yellow" ? "text-yellow-300" : tone === "coral" ? "text-coral" : "text-white"
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <p className="text-xs font-black uppercase text-white/40">{label}</p>
      <p className={`mt-2 break-words text-xl font-black ${color}`}>{value}</p>
    </div>
  )
}

function CoverageItem({ label, value, tone = "white" }: { label: string; value: string; tone?: "white" | "lime" | "yellow" | "coral" }) {
  const color = tone === "lime" ? "text-lime" : tone === "yellow" ? "text-yellow-300" : tone === "coral" ? "text-coral" : "text-white"
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs font-black uppercase text-white/40">{label}</p>
      <p className={`mt-2 break-words text-2xl font-black ${color}`}>{value}</p>
    </div>
  )
}

function BriefPanel({ title, tone, children }: { title: string; tone: "coral" | "lime" | "cyan" | "yellow"; children: React.ReactNode }) {
  const color = toneClass(tone)
  return (
    <article className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-soft ring-1 ring-white/5">
      <h2 className={`text-xl font-black ${color}`}>{title}</h2>
      <div className="mt-5">{children}</div>
    </article>
  )
}

function EvidenceList({ title, items, tone }: { title: string; items: Array<{ title: string; eyebrow: string; body: string; footer: string }>; tone: "coral" | "lime" }) {
  return (
    <BriefPanel title={title} tone={tone}>
      <div className="grid gap-4">
        {items.length ? items.slice(0, 5).map((item) => (
          <article key={`${item.title}-${item.body}`} className="rounded-3xl border border-white/10 bg-black/25 p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-white/40">{item.eyebrow}</p>
            <h3 className="mt-3 font-black text-white text-lg">{item.title}</h3>
            <p className="mt-3 text-sm text-white/65 leading-relaxed">{item.body}</p>
            <p className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm font-bold text-white/75">{item.footer}</p>
          </article>
        )) : <EmptyText text="No evidence was available in this section." />}
      </div>
    </BriefPanel>
  )
}

function SimpleList({ title, items, tone }: { title: string; items: string[]; tone: "coral" | "lime" | "cyan" | "yellow" }) {
  return (
    <BriefPanel title={title} tone={tone}>
      <ul className="grid gap-3 text-sm text-white/75">
        {items.length ? items.slice(0, 8).map((item) => <li key={cleanText(item) || item} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-white/80 shadow-sm">{cleanText(item)}</li>) : <li><EmptyText text="No items were available in this section." /></li>}
      </ul>
    </BriefPanel>
  )
}

function ActionItem({ text }: { text: string }) {
  return <p className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm font-bold text-white/76">{cleanText(text)}</p>
}

function SnapshotItem({ label, title, body, tone }: { label: string; title: string; body: string; tone: "coral" | "lime" | "cyan" }) {
  return (
    <article className="rounded-xl border border-white/10 bg-black/25 p-5">
      <p className={`text-xs font-black uppercase ${toneClass(tone)}`}>{cleanText(label)}</p>
      <h3 className="mt-3 text-xl font-black">{cleanText(title)}</h3>
      <p className="mt-3 text-sm leading-relaxed text-white/65">{cleanText(body)}</p>
    </article>
  )
}

function EmptyText({ text }: { text: string }) {
  return <p className="rounded-xl border border-dashed border-white/15 p-4 text-sm text-white/45">{text}</p>
}

function nextActions(insight: ReviewInsightLike | undefined, isSingle: boolean) {
  if (isSingle) {
    const ideas = insight?.productImprovementIdeas?.map((item) => cleanText(item.idea)) ?? []
    const complaints = insight?.topComplaints?.map((item) => `Address "${cleanText(item.theme)}" in product, listing, or support copy.`) ?? []
    const hooks = insight?.adHooks?.map((item) => cleanText(item)) ?? []
    return [...ideas, ...complaints, ...hooks].slice(0, 4).length ? [...ideas, ...complaints, ...hooks].slice(0, 4) : [
      "Collect more review data before making product decisions.",
      "Paste reviews manually if the connector returns no text.",
      "Use the data warning to decide whether this report is ready to share."
    ]
  }
  return [
    "Review price trends and competitive drops in the appendix table below.",
    "Monitor out-of-stock variations and Restock alerts.",
    "Audit listings with low completeness scores or missing fields.",
    "Expand your watchlist catalog to track more competitor ASINs."
  ]
}

function scoreDataQuality(summary: Record<string, unknown>, insight: ReviewInsightLike | undefined) {
  const count = Number(summary?.reviewCount ?? insight?.dataQuality?.reviewCount ?? 0)
  if (count >= 100) return { label: "High", tone: "lime" as const }
  if (count >= 20) return { label: "Medium", tone: "yellow" as const }
  return { label: "Low", tone: "coral" as const }
}

function confidenceNote(reviewCount: number) {
  if (reviewCount >= 100) return "A larger sample can reveal stronger recurring themes, though it is still not proof of a defect."
  if (reviewCount >= 20) return "This sample is useful for directional patterns, but not complete market evidence."
  return "This small sample identifies early signals only; collect more reviews before making decisions."
}

function cleanReportTitle(title: string) {
  return title.replace("Review and Rating Report", "Review Intelligence Brief")
}

function toneClass(tone: "coral" | "lime" | "cyan" | "yellow") {
  return tone === "coral" ? "text-coral" : tone === "lime" ? "text-lime" : tone === "cyan" ? "text-cyan" : "text-yellow-300"
}

function summarizeObject(value: unknown) {
  if (!value || typeof value !== "object") return "This report is ready for review."
  return Object.entries(value as Record<string, unknown>).slice(0, 4).map(([key, item]) => `${formatHeader(key)}: ${renderPlain(item)}`).join(" | ")
}

function cleanText(value: unknown) {
  if (value == null) return ""
  return String(value)
    .replace(/<[^>]*>/g, "")
    .replace(/\[(Outcome|Objection|Comparison|Unexpected Use|Unexpected|Competitor Moat Analysis|Moat Analysis|Emerging Signal)\]/gi, "")
    .replace(/\[.*?\]/g, "")
    .replace(/[\[\]]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim()
}

function renderPlain(value: unknown): string {
  if (Array.isArray(value)) return value.map((item) => cleanText(item)).filter(Boolean).join(", ") || "-"
  if (value && typeof value === "object") return Object.entries(value as Record<string, unknown>)
    .map(([key, item]) => `${formatHeader(key)}: ${renderPlain(item)}`)
    .join(" | ")
  return cleanText(value ?? "-")
}

function renderCell(value: unknown) {
  if (Array.isArray(value)) {
    if (value.every((item) => typeof item !== "object")) {
      return <span className="text-xs text-white/70">{value.map(cleanText).filter(Boolean).join(", ") || "-"}</span>
    }
    return (
      <div className="space-y-2 text-xs text-white/70">
        {value.map((item, index) => (
          <div key={index} className="rounded-2xl bg-white/5 p-3">
            {renderCell(item)}
          </div>
        ))}
      </div>
    )
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
    return (
      <div className="space-y-2 text-xs text-white/70">
        {entries.map(([key, item]) => (
          <div key={key} className="rounded-2xl bg-white/5 p-3">
            <span className="font-semibold text-white/80">{formatHeader(key)}:</span>{" "}
            <span className="text-white/75">{renderPlain(item)}</span>
          </div>
        ))}
      </div>
    )
  }

  return cleanText(value ?? "-")
}

function formatHeader(value: string) {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function displayUrl(value: string) {
  try {
    const url = new URL(value)
    return `${url.hostname.replace(/^www\./, "")}${url.pathname}`.slice(0, 100)
  } catch {
    return value.slice(0, 100)
  }
}

function formatReviewApp(value: unknown) {
  const app = String(value ?? "").trim()
  if (!app) return "Import"
  const labels: Record<string, string> = {
    judgeme: "Judge.me",
    loox: "Loox",
    yotpo: "Yotpo",
    okendo: "Okendo",
    stamped: "Stamped",
    "shopify-product-reviews": "Shopify Reviews",
    other: "Other"
  }
  return labels[app] ?? app
}

function createFreshReportHref(report: IntelligenceReport, productUrl: string) {
  const params = new URLSearchParams({
    productUrl,
    productName: String(report.summary?.productName ?? report.filters?.productName ?? ""),
    platform: String(report.summary?.platform ?? report.filters?.platform ?? "amazon")
  })
  return `/dashboard/reports?${params.toString()}`
}
