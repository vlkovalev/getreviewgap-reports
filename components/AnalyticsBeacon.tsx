"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

export function AnalyticsBeacon() {
  const pathname = usePathname()

  useEffect(() => {
    trackClientEvent("page_view", {
      path: pathname,
      referrer: document.referrer || null
    })
  }, [pathname])

  return null
}

export function trackClientEvent(name: string, properties: Record<string, unknown> = {}) {
  const payload = JSON.stringify({ name, properties })
  const sent = navigator.sendBeacon?.("/api/analytics", new Blob([payload], { type: "application/json" }))
  if (!sent) {
    void fetch("/api/analytics", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: payload
    })
  }

  const win = window as Window & {
    gtag?: (...args: unknown[]) => void
    fbq?: (...args: unknown[]) => void
    lintrk?: (...args: unknown[]) => void
  }
  win.gtag?.("event", name, properties)
  win.fbq?.("trackCustom", name, properties)
  win.lintrk?.("track", { conversion_id: name, ...properties })
}
