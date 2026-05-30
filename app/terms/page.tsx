import type { Metadata } from "next"

export const metadata: Metadata = { title: "Terms of Service", description: "ReviewGap terms of service covering acceptable use, report credits, data handling, and lawful review intelligence requirements." }

export default function TermsPage() {
  return (
    <main className="px-5 py-20">
      <div className="mx-auto max-w-3xl text-white/72">
        <h1 className="text-5xl font-black text-white">Terms</h1>
        <p className="mt-6">Reports are generated for informational product research and marketing planning. They should be reviewed by a human before business decisions are made.</p>
        <p className="mt-4">Third-party AI and scraping tools are not owned by ReviewGap and may change pricing, features, terms, or availability.</p>
        <h2 className="mt-10 text-2xl font-black text-white">Lawful-use boundaries</h2>
        <p className="mt-4">The product is designed for derived analysis of customer-supplied, authorized, or otherwise permitted review content. Users are responsible for complying with marketplace terms, robots policies, privacy laws, and applicable local rules before submitting URLs, review exports, pasted reviews, or other source material.</p>
        <p className="mt-4">ReviewGap does not provide login bypassing, CAPTCHA circumvention, paywall bypassing, access-control evasion, seller contact-data resale, cross-border personal-data harvesting, or raw competitor price scraping as a resale service.</p>
        <p className="mt-4">If a marketplace, website, API provider, or data source does not allow the requested use, users should use an official API, approved data provider, uploaded export, or manual pasted review text instead.</p>
        <h2 className="mt-10 text-2xl font-black text-white">No marketplace affiliation</h2>
        <p className="mt-4">ReviewGap is an independent product and is not affiliated with, endorsed by, or sponsored by Amazon, Shopify, Stripe, PayPal, Apify, OpenAI, or any marketplace named in reports.</p>
        <h2 className="mt-10 text-2xl font-black text-white">Refunds and credits</h2>
        <p className="mt-4">One report credit is consumed when a report is generated. If report generation fails after a credit is consumed, the system is designed to return that credit automatically. Paid purchases are generally final after credits are used, but you can contact support for billing errors, duplicate charges, or failed access.</p>
        <h2 className="mt-10 text-2xl font-black text-white">AI output limitations</h2>
        <p className="mt-4">AI-generated summaries can be incomplete or wrong. Users should review outputs before making product, legal, financial, advert