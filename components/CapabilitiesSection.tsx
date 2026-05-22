const capabilities = [
  {
    service: "Workshop",
    available: "Yes",
    details: "The site can collect leads and sell the offer. Delivery is live training: storyboard method, prompt systems, AI visuals, transition planning, and PowerPoint assembly."
  },
  {
    service: "Team Training",
    available: "Yes",
    details: "Inquiry flow is ready. The actual training can be customized by industry, team skill level, and preferred AI tools."
  },
  {
    service: "Presentation Build",
    available: "Yes, with inputs",
    details: "We can scope a done-for-you deck, but production needs approved brand assets, product images, copy direction, and AI tool access."
  },
  {
    service: "AI image/video generation",
    available: "Partially",
    details: "The website explains and sells it. To generate assets inside the website, we need API keys and a paid generation provider integration."
  },
  {
    service: "PowerPoint file export",
    available: "Not yet",
    details: "The business can deliver PPT files manually. In-browser PPTX generation can be added as a next feature with a PPTX export library."
  },
  {
    service: "Payments",
    available: "Not yet",
    details: "Pricing and inquiry pages exist. Stripe checkout can be added once prices, products, refund policy, and keys are confirmed."
  }
]

export function CapabilitiesSection() {
  return (
    <section className="px-5 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 max-w-3xl">
          <p className="font-black uppercase text-lime">Capabilities</p>
          <h2 className="mt-3 text-4xl font-black md:text-6xl">What we can offer now, and what needs setup.</h2>
          <p className="mt-5 text-lg text-white/70">
            The website is ready to market the services, capture leads, and collect project inquiries. Some automated production features need provider accounts before they can run inside the site.
          </p>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-white/10">
          <div className="grid bg-white/10 px-5 py-4 text-sm font-black uppercase text-white/58 md:grid-cols-[.8fr_.5fr_1.7fr]">
            <span>Service</span>
            <span>Capability</span>
            <span>Notes</span>
          </div>
          {capabilities.map((item) => (
            <div key={item.service} className="grid gap-3 border-t border-white/10 px-5 py-5 md:grid-cols-[.8fr_.5fr_1.7fr]">
              <strong>{item.service}</strong>
              <span className="font-black text-lime">{item.available}</span>
              <p className="text-white/68">{item.details}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
