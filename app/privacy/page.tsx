import type { Metadata } from "next"

export const metadata: Metadata = { title: "Privacy Policy", description: "Privacy policy for ReviewIntel." }

export default function PrivacyPage() {
  return (
    <main className="px-5 py-20">
      <div className="mx-auto max-w-3xl text-white/72">
        <h1 className="text-5xl font-black text-white">Privacy Policy</h1>
        <p className="mt-6">We collect information you submit through forms, such as name, email, company, product URLs, pasted review text, report preferences, and messages. We use it to generate reports, respond to inquiries, process credits, secure accounts, and improve our services.</p>
        <p className="mt-4">We do not sell personal information. Email and analytics providers may process data under their own security and privacy terms when configured.</p>
        <h2 className="mt-10 text-2xl font-black text-white">Reports and review data</h2>
        <p className="mt-4">Reports may include public product-review text, derived summaries, product URLs, generated recommendations, and export files. Reports are private to the signed-in account that created them unless the account holder chooses to share the output.</p>
        <p className="mt-4">Customers should not submit private account data, sensitive personal information, or review content they are not permitted to process. We may retain report inputs and outputs so customers can view and export their reports later.</p>
        <h2 className="mt-10 text-2xl font-black text-white">Payments</h2>
        <p className="mt-4">Payments are processed by third-party providers such as Stripe or PayPal. We do not store full card numbers. Purchase metadata, plan IDs, payment status, and credit balances may be stored so the product can grant credits and show billing history.</p>
        <h2 className="mt-10 text-2xl font-black text-white">Analytics</h2>
        <p className="mt-4">We may use privacy-conscious analytics and advertising pixels to understand page views, signup events, checkout starts, and report-generation events. Tracking IDs are only active when configured in production environment variables.</p>
      </div>
    </main>
  )
}
