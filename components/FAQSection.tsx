import { faqs } from "@/lib/content"

export function FAQSection() {
  return (
    <section className="px-5 py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-4xl font-black md:text-6xl">FAQ</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {faqs.map((faq) => (
            <article key={faq.question} className="card p-6">
              <h3 className="font-black">{faq.question}</h3>
              <p className="mt-3 text-white/68">{faq.answer}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
