"use client"

import { useState } from "react"

export function LeadForm({ source = "lead-magnet" }: { source?: string }) {
  const [status, setStatus] = useState("")

  async function submit(formData: FormData) {
    setStatus("Sending...")
    const res = await fetch("/api/leads", { method: "POST", body: formData })
    const data = await res.json()
    setStatus(data.message || (res.ok ? "Success" : "Something went wrong"))
  }

  return (
    <form action={submit} className="card grid gap-4 p-6">
      <input suppressHydrationWarning type="hidden" name="source" value={source} />
      <input suppressHydrationWarning className="hidden" name="website" tabIndex={-1} autoComplete="off" />
      <label className="grid gap-2 text-sm font-bold">
        Name
        <input suppressHydrationWarning name="name" required minLength={2} className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-lime" />
      </label>
      <label className="grid gap-2 text-sm font-bold">
        Email
        <input suppressHydrationWarning name="email" type="email" required className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-lime" />
      </label>
      <label className="grid gap-2 text-sm font-bold">
        Company, optional
        <input suppressHydrationWarning name="company" className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-lime" />
      </label>
      <label className="grid gap-2 text-sm font-bold">
        Message, optional
        <textarea suppressHydrationWarning name="message" className="min-h-28 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-lime" />
      </label>
      <button className="btn-primary" type="submit">Send me the checklist</button>
      {status && <p className="text-sm text-white/70">{status}</p>}
    </form>
  )
}
