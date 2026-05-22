import type { Metadata } from "next"
import { ContactForm } from "@/components/ContactForm"

export const metadata: Metadata = { title: "Contact", description: "Contact ReviewGap for product research and report automation." }

export default function ContactPage() {
  return (
    <main className="px-5 py-20">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[.8fr_1.2fr]">
        <div>
          <p className="font-black uppercase text-lime">Contact</p>
          <h1 className="mt-4 text-5xl font-black md:text-7xl">Tell us what research workflow you need.</h1>
          <p className="mt-5 text-white/70">Use this form for custom Amazon review analysis, agency workflows, or API integration help.</p>
        </div>
        <ContactForm />
      </div>
    </main>
  )
}
