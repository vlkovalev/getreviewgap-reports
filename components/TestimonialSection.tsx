const testimonials = [
  ["Creative Director", "The workflow made our pitch deck feel closer to a campaign film than a normal slide file."],
  ["Marketing Lead", "The best part is that the presentation still stays editable after the AI visuals are added."],
  ["Freelance Designer", "It gave me a repeatable process instead of random AI experiments."]
]

export function TestimonialSection() {
  return (
    <section className="px-5 py-20">
      <div className="mx-auto max-w-6xl">
        <p className="font-black uppercase text-lime">Results people want</p>
        <h2 className="mt-3 text-4xl font-black md:text-6xl">Presentation work that feels premium, but stays practical.</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {testimonials.map(([name, quote]) => (
            <figure key={name} className="card p-6">
              <blockquote className="text-lg text-white/82">“{quote}”</blockquote>
              <figcaption className="mt-5 font-black text-lime">{name}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
