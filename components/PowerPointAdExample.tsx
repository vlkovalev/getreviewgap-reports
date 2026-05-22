const storyboard = [
  ["01", "Hook", "Glass objects drift in around the product name."],
  ["02", "Reveal", "The product scene lands on the left side of the slide."],
  ["03", "Offer", "Editable headline, benefits, and CTA animate in."],
  ["04", "Close", "Final frame holds for sales or webinar narration."]
]

export function PowerPointAdExample() {
  return (
    <section className="px-5 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 max-w-3xl">
          <p className="font-black uppercase text-coral">Example build</p>
          <h2 className="mt-3 text-4xl font-black md:text-6xl">A sample PowerPoint ad concept made for the site.</h2>
          <p className="mt-5 text-lg text-white/70">
            This is a fictional editable slide concept for a beauty-tech product launch. It shows the type of branded scene, ad-style composition, and slide logic the services are designed to produce.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
          <div className="rounded-[28px] border border-white/12 bg-white p-4 text-ink shadow-soft">
            <div className="relative aspect-video overflow-hidden rounded-3xl bg-[#ddd9d0]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,#c7ff3d_0_7%,transparent_7.4%),radial-gradient(circle_at_40%_70%,#72e4dd_0_6%,transparent_6.5%),radial-gradient(circle_at_80%_28%,#ff8ea3_0_8%,transparent_8.6%)] opacity-95" />
              <div className="absolute left-[9%] top-[12%] h-[72%] w-[22%] rotate-[-8deg] rounded-[28px] border border-black/15 bg-[linear-gradient(90deg,rgba(255,255,255,.75),transparent_24%,rgba(0,0,0,.14)),linear-gradient(180deg,#fff,#c7ff3d)] shadow-2xl" />
              <div className="absolute left-[13%] top-[39%] grid h-20 w-20 place-items-center rounded-full bg-ink text-xl font-black text-lime">AURA</div>
              <div className="absolute right-[8%] top-[15%] w-[43%]">
                <div className="mb-5 inline-flex rounded-full border border-black/10 bg-white/70 px-4 py-2 text-xs font-black uppercase">AI launch deck / editable PPT</div>
                <h3 className="text-5xl font-black leading-none">Glow serum launch</h3>
                <p className="mt-4 text-lg text-black/62">Cinematic product reveal, clean sales copy, and a final frame designed for a brand pitch.</p>
                <div className="mt-8 grid grid-cols-3 gap-3">
                  {["Storyboard", "AI visuals", "PPT timing"].map((item) => (
                    <div key={item} className="rounded-2xl border border-black/10 bg-white/70 p-3 text-sm font-black">{item}</div>
                  ))}
                </div>
              </div>
              <div className="absolute bottom-5 left-5 flex gap-2">
                <span className="h-2 w-10 rounded-full bg-ink" />
                <span className="h-2 w-2 rounded-full bg-ink/30" />
                <span className="h-2 w-2 rounded-full bg-ink/30" />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-2xl font-black">Storyboard for the ad</h3>
            <div className="mt-5 grid gap-3">
              {storyboard.map(([num, title, text]) => (
                <div key={num} className="rounded-2xl border border-white/10 bg-white/7 p-4">
                  <p className="text-sm font-black text-lime">{num} · {title}</p>
                  <p className="mt-2 text-white/68">{text}</p>
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm text-white/55">
              Real client work would replace this mock product with approved brand assets, product photos, copy, and usage rights.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
