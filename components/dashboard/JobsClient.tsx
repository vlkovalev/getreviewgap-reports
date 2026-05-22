"use client"

import { useState } from "react"
import type { ScrapeJob, ScraperSource } from "@/lib/scrapers/types"

export function JobsClient({ initialJobs, sources }: { initialJobs: ScrapeJob[]; sources: ScraperSource[] }) {
  const [jobs, setJobs] = useState(initialJobs)
  const [status, setStatus] = useState("")

  async function runJob(id: string) {
    setStatus("Analyzing demo review data...")
    const response = await fetch(`/api/scraper/jobs/${id}/run`, { method: "POST" })
    const payload = await response.json()
    setStatus(response.ok ? `Review batch completed: ${payload.run.status}` : payload.error)
  }

  async function createJob(formData: FormData) {
    const targetUrls = String(formData.get("targetUrls") ?? "").split("\n").map((url) => url.trim()).filter(Boolean)
    const response = await fetch("/api/scraper/jobs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: formData.get("name"), sourceId: formData.get("sourceId"), targetUrls, schedule: formData.get("schedule") || undefined })
    })
    const payload = await response.json()
    if (response.ok) setJobs((current) => [payload.job, ...current])
    setStatus(response.ok ? "Review batch created." : payload.error)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
      <form action={createJob} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <h2 className="text-2xl font-black">Create review batch</h2>
        <p className="mt-3 text-sm text-white/60">Add a few public Amazon product URLs you want to compare. In demo mode, no live third-party request is made.</p>
        <label className="mt-5 block text-sm text-white/70">
          Batch name
          <input name="name" required placeholder="Competitor serum review analysis" className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white" />
        </label>
        <label className="mt-3 block text-sm text-white/70">
          Review source
          <select name="sourceId" required className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white">
            {sources.map((source) => <option key={source.id} value={source.id}>{source.name}</option>)}
          </select>
        </label>
        <label className="mt-3 block text-sm text-white/70">
          Amazon product URLs
          <textarea name="targetUrls" required placeholder={"https://www.amazon.com/dp/example-serum\nhttps://www.amazon.com/dp/example-cream"} rows={5} className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white" />
        </label>
        <label className="mt-3 block text-sm text-white/70">
          Refresh schedule
          <input name="schedule" placeholder="Manual for now" className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white" />
        </label>
        <button className="mt-4 w-full rounded-full bg-lime px-5 py-3 font-black text-black">Create review batch</button>
        {status ? <p className="mt-4 text-sm text-white/65">{status}</p> : null}
      </form>
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <h2 className="text-2xl font-black">Review batches</h2>
        <div className="mt-5 space-y-3">
          {jobs.map((job) => (
            <div key={job.id} className="rounded-xl border border-white/10 bg-black/30 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold">{job.name}</p>
                  <p className="text-xs text-white/50">{job.targetUrls.length} product URLs · {job.status}</p>
                </div>
                <button onClick={() => runJob(job.id)} className="rounded-full bg-white px-3 py-2 text-xs font-black text-black">Analyze now</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
