"use client"

import { useState } from "react"

export function ContactForm() {
  const [status, setStatus] = useState("")

  async function submit(formData: FormData) {
    setStatus("Sending...")
    formData.set("consent", formData.get("consent") === "on" ? "true" : "false")
    const res = await fetch("/api/inquiries", { method: "POST", body: formData })
    const data = await res.json()
    setStatus(data.message || (res.ok ? "Success" : "Something went wrong"))
  }

  return (
    <form action={submit} className="card grid gap-4 p-6">
      <input suppressHydrationWarning className="hidden" name="website" tabIndex={-1} autoComplete="off" />
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold">Name<input suppressHydrationWarning name="name" required className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-lime" /></label>
        <label className="grid gap-2 text-sm font-bold">Email<input suppressHydrationWarning name="email" type="email" required className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-lime" /></label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold">Company<input suppressHydrationWarning name="company" className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-lime" /></label>
        <label className="grid gap-2 text-sm font-bold">Service interest
          <select suppressHydrationWarning name="serviceInterest" required className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-lime">
            <option value="Amazon review reports">Amazon review reports</option>
            <option value="Shopify review reports">Shopify review reports</option>
            <option value="Agency workflow">Agency workflow</option>
            <option value="Custom integration">Custom integration</option>
          </select>
        </label>
      </div>
      <label className="grid gap-2 text-sm font-bold">Budget range
        <select suppressHydrationWarning name="budgetRange" className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-lime">
          <option value="">Not sure yet</option>
          <option value="Under $1,000">Under $1,000</option>
          <option value="$1,000-$5,000">$1,000-$5,000</option>
          <option value="$5,000+">$5,000+</option>
        </select>
      </label>
      <label className="grid gap-2 text-sm font-bold">Message<textarea suppressHydrationWarning name="message" required minLength={10} className="min-h-36 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-lime" /></label>
      <label className="flex gap-3 text-sm text-white/70"><input suppressHydrationWarning name="consent" type="checkbox" required className="mt-1" />I agree to be contacted about this request.</label>
      <button className="btn-primary" type="submit">Submit inquiry</button>
      {status && <p className="text-sm text-white/70">{status}</p>}
    </form>
  )
}
