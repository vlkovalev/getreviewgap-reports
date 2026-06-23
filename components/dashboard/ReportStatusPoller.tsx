"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

const PROGRESS_MESSAGES = [
  "Connecting to review source...",
  "Retrieving marketplace reviews...",
  "Scraping written review texts...",
  "Analyzing reviews with OpenAI...",
  "Clustering buyer complaints & compliments...",
  "Extracting ad hooks and customer keywords...",
  "Writing final executive intelligence brief..."
]

export function ReportStatusPoller({ reportId }: { reportId: string }) {
  const [status, setStatus] = useState<string>("GENERATING")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [progressIndex, setProgressIndex] = useState(0)
  const router = useRouter()

  useEffect(() => {
    // Rotate messages to show progress action
    const messageInterval = setInterval(() => {
      setProgressIndex((prev) => (prev < PROGRESS_MESSAGES.length - 1 ? prev + 1 : prev))
    }, 4500)

    let pollInterval: NodeJS.Timeout

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/scraper/reports/${reportId}`)
        if (!response.ok) return
        const data = await response.json()
        if (data.report) {
          const currentStatus = data.report.status
          setStatus(currentStatus)
          if (currentStatus === "COMPLETED") {
            clearInterval(pollInterval)
            clearInterval(messageInterval)
            router.refresh()
            window.location.reload()
          } else if (currentStatus === "FAILED") {
            clearInterval(pollInterval)
            clearInterval(messageInterval)
            setErrorMsg(data.report.errorMessage || "An unexpected error occurred during analysis.")
          }
        }
      } catch (err) {
        console.error("Error polling report status", err)
      }
    }

    // Poll status every 2.5 seconds
    pollInterval = setInterval(checkStatus, 2500)
    checkStatus()

    return () => {
      clearInterval(pollInterval)
      clearInterval(messageInterval)
    }
  }, [reportId, router])

  if (status === "FAILED" || errorMsg) {
    return (
      <div className="mx-auto max-w-2xl rounded-[2rem] border border-red-500/20 bg-red-950/20 p-8 text-center backdrop-blur-md shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-400">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="mt-6 text-2xl font-black text-red-200">Analysis Failed</h2>
        <p className="mt-3 text-white/70 leading-relaxed">
          {errorMsg || "The report generator could not retrieve or analyze reviews for this product URL."}
        </p>
        <p className="mt-2 text-sm text-white/50">Your report credit has been automatically refunded to your balance.</p>
        <div className="mt-8 flex justify-center gap-4">
          <a href="/dashboard/reports" className="rounded-full bg-lime px-6 py-3 font-black text-black transition hover:bg-lime/90">
            Try another product
          </a>
          <a href="/dashboard/billing" className="rounded-full border border-white/10 bg-white/5 px-6 py-3 font-black text-white hover:bg-white/10">
            View billing ledger
          </a>
        </div>
      </div>
    )
  }

  // Calculate simulated percentage
  const percent = Math.min(95, Math.round(((progressIndex + 1) / PROGRESS_MESSAGES.length) * 100))

  return (
    <div className="mx-auto max-w-2xl rounded-[2.5rem] border border-white/10 bg-slate-950/70 p-10 text-center backdrop-blur-xl shadow-2xl shadow-black/50">
      {/* Animated glowing spinner */}
      <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
        <div className="absolute inset-0 rounded-full border-4 border-white/5"></div>
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-lime border-r-lime/30"></div>
        <div className="absolute h-16 w-16 rounded-full bg-lime/10 blur-xl animate-pulse"></div>
        <span className="text-xs font-black uppercase text-lime">{percent}%</span>
      </div>

      <h2 className="mt-8 text-3xl font-black tracking-tight text-white md:text-4xl">Generating Review Brief</h2>
      
      {/* Glassmorphic progress box */}
      <div className="mt-6 rounded-2xl border border-white/5 bg-white/5 p-4 min-h-[4rem] flex items-center justify-center">
        <p className="text-lg font-medium text-white/80 animate-pulse">
          {PROGRESS_MESSAGES[progressIndex]}
        </p>
      </div>

      <div className="mt-8 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div 
          className="h-full bg-gradient-to-r from-lime to-cyan transition-all duration-1000 ease-out"
          style={{ width: `${percent}%` }}
        ></div>
      </div>

      <p className="mt-6 text-sm text-white/50 max-w-md mx-auto">
        Analyzing and compiling review intelligence reports takes up to 45 seconds due to live data retrieval and LLM processing. Feel free to stay on this page or check back later.
      </p>
    </div>
  )
}
