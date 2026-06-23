"use client"

import { useState } from "react"

export function BetaFeedbackForm({ reportId }: { reportId: string }) {
  const [rating, setRating] = useState(0)
  const [usefulness, setUsefulness] = useState("")
  const [confusing, setConfusing] = useState("")
  const [missing, setMissing] = useState("")
  const [status, setStatus] = useState("")
  const [busy, setBusy] = useState(false)

  async function submit() {
    if (!rating) {
      setStatus("Choose a rating first.")
      return
    }
    setBusy(true)
    setStatus("Sending feedback...")
    const response = await fetch("/api/beta-feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reportId, rating, usefulness, confusing, missing })
    })
    const payload = await response.json().catch(() => ({}))
    setBusy(false)
    if (!response.ok) {
      setStatus(payload.error ?? "Could not send feedback.")
      return
    }
    setStatus("Feedback saved. Thank you.")
    setUsefulness("")
    setConfusing("")
    setMissing("")
  }

  return (
    <section className="mt-6 rounded-2xl border border-cyan/20 bg-cyan/10 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase text-cyan">Beta feedback</p>
          <h2 className="mt-2 text-2xl font-black">Help tune report quality</h2>
          <p className="mt-2 max-w-2xl text-sm text-white/65">Rate this report as if you were deciding whether it is useful for a real product or listing decision.</p>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              className={rating === value ? "h-10 w-10 rounded-full bg-lime font-black text-black" : "h-10 w-10 rounded-full border border-white/15 bg-black/30 font-black text-white/70 hover:border-lime"}
              aria-label={`Rate ${value} out of 5`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <label className="grid gap-2 text-sm text-white/70">
          Most useful insight
          <textarea value={usefulness} onChange={(event) => setUsefulness(event.target.value)} rows={3} maxLength={1200} className="rounded-xl border border-white/10 bg-black px-4 py-3 text-white" />
        </label>
        <label className="grid gap-2 text-sm text-white/70">
          Most confusing part
          <textarea value={confusing} onChange={(event) => setConfusing(event.target.value)} rows={3} maxLength={1200} className="rounded-xl border border-white/10 bg-black px-4 py-3 text-white" />
        </label>
        <label className="grid gap-2 text-sm text-white/70">
          Missing or wrong
          <textarea value={missing} onChange={(event) => setMissing(event.target.value)} rows={3} maxLength={1200} className="rounded-xl border border-white/10 bg-black px-4 py-3 text-white" />
        </label>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={submit} disabled={busy} className="rounded-full bg-lime px-5 py-3 font-black text-black disabled:opacity-50">Send feedback</button>
        {status ? <p className="text-sm text-white/65">{status}</p> : null}
      </div>
    </section>
  )
}
