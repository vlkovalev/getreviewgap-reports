import type { Metadata } from "next"

export const metadata: Metadata = { title: "Privacy Policy", description: "Privacy policy for ReviewIntel." }

export default function PrivacyPage() {
  return (
    <main className="px-5 py-20">
      <div className="mx-auto max-w-3xl text-white/72">
        <h1 className="text-5xl font-black text-white">Privacy Policy</h1>
        <p className="mt-6">We collect information you submit through forms, such as name, email, company, product URLs, pasted review text, and messages. We use it to generate reports, respond to inquiries, and improve our services.</p>
        <p className="mt-4">We do not sell personal information. Email and analytics providers may process data under their own security and privacy terms when configured.</p>
      </div>
    </main>
  )
}
