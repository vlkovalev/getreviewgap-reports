"use client"

import { useEffect } from "react"

export function AnalyticsBeacon() {
  useEffect(() => {
    const payload = JSON.stringify({
      name: "page_view",
      properties: {
        path: window.location.pathname,
        referrer: document.referrer || null
      }
    })
    navigator.sendBeacon?.("/api/analytics", new Blob([payload], { type: "application/json" }))
  }, [])

  return null
}
