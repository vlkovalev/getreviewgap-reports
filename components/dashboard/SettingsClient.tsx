"use client"

import { useState, useEffect } from "react"
import { SignOutButton } from "@/components/SignOutButton"
import type { Customer } from "@/lib/customer-store"
import type { ReportType } from "@/lib/scrapers/types"

const reportTypes: Array<{ value: ReportType; label: string }> = [
  { value: "REVIEW_RATING", label: "Review and Rating" },
  { value: "EXECUTIVE_SUMMARY", label: "Review Intelligence Summary" },
  { value: "DATA_QUALITY", label: "Review Data Quality" }
]

const reviewDepths = [
  { value: 5, label: "Quick (5 pages)" },
  { value: 10, label: "Standard (10 pages)" },
  { value: 50, label: "Deep (50 pages)" }
] as const

const shopifyReviewApps = [
  { value: "judgeme", label: "Judge.me" },
  { value: "loox", label: "Loox" },
  { value: "yotpo", label: "Yotpo" },
  { value: "okendo", label: "Okendo" },
  { value: "stamped", label: "Stamped" },
  { value: "shopify-product-reviews", label: "Shopify Product Reviews" },
  { value: "other", label: "Other / custom" }
] as const

export interface ReportPreferences {
  reportType: ReportType
  platform: "amazon" | "shopify"
  reviewPageLimit: 5 | 10 | 50
  reviewApp: string
}

const DEFAULT_PREFERENCES: ReportPreferences = {
  reportType: "REVIEW_RATING",
  platform: "amazon",
  reviewPageLimit: 10,
  reviewApp: "judgeme"
}

export function SettingsClient({ customer }: { customer: Customer | null }) {
  // Report Defaults State (loaded from localStorage)
  const [preferences, setPreferences] = useState<ReportPreferences>(DEFAULT_PREFERENCES)
  const [prefsMessage, setPrefsMessage] = useState("")

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordStatus, setPasswordStatus] = useState<{ type: "success" | "error" | ""; message: string }>({ type: "", message: "" })
  const [passwordBusy, setPasswordBusy] = useState(false)

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("reviewgap_report_preferences")
      if (stored) {
        const parsed = JSON.parse(stored)
        setPreferences({
          reportType: parsed.reportType ?? DEFAULT_PREFERENCES.reportType,
          platform: parsed.platform ?? DEFAULT_PREFERENCES.platform,
          reviewPageLimit: parsed.reviewPageLimit ?? DEFAULT_PREFERENCES.reviewPageLimit,
          reviewApp: parsed.reviewApp ?? DEFAULT_PREFERENCES.reviewApp
        })
      }
    } catch (e) {
      console.error("Failed to load preferences from localStorage", e)
    }
  }, [])

  // Save preferences to localStorage
  const savePreferences = (updated: Partial<ReportPreferences>) => {
    const next = { ...preferences, ...updated }
    setPreferences(next)
    try {
      localStorage.setItem("reviewgap_report_preferences", JSON.stringify(next))
      setPrefsMessage("Report defaults updated successfully.")
      setTimeout(() => setPrefsMessage(""), 4000)
    } catch (e) {
      setPrefsMessage("Failed to save preferences.")
    }
  }

  // Handle password change submit
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordStatus({ type: "", message: "" })

    if (newPassword.length < 6) {
      setPasswordStatus({ type: "error", message: "New password must be at least 6 characters long." })
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: "error", message: "Confirm password does not match new password." })
      return
    }

    setPasswordBusy(true)
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword })
      })

      const data = await response.json()
      if (!response.ok) {
        setPasswordStatus({ type: "error", message: data.details || data.error || "Failed to change password." })
      } else {
        setPasswordStatus({ type: "success", message: "Your password has been successfully updated." })
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      }
    } catch (err: any) {
      setPasswordStatus({ type: "error", message: err.message || "A network error occurred. Please try again." })
    } finally {
      setPasswordBusy(false)
    }
  }

  return (
    <div className="grid gap-6">
      {/* Profile Overview Card */}
      <section className="card p-6 border border-white/10 bg-white/[0.04] rounded-3xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase text-lime tracking-wider">Account Profile</p>
            <h2 className="mt-2 text-3xl font-black text-white">{customer ? customer.email : "Not signed in"}</h2>
            <p className="mt-2 text-white/65">
              {customer
                ? "Your intelligence reports, credits, and subscriptions are tied to this email."
                : "Sign in to save reports, buy report packs, and access your billing dashboard."}
            </p>
          </div>
          {customer ? (
            <SignOutButton />
          ) : (
            <a href="/login" className="rounded-full bg-lime px-5 py-3 font-black text-black hover:bg-lime/90 transition-all duration-300">
              Sign In
            </a>
          )}
        </div>
      </section>

      {/* 3-Column Info Cards */}
      <section className="grid gap-5 md:grid-cols-3">
        <div className="card p-6 border border-white/10 bg-white/[0.04] rounded-3xl relative overflow-hidden group hover:border-cyan/40 transition-all duration-300">
          <div className="absolute -right-12 -bottom-12 w-24 h-24 bg-cyan/10 rounded-full blur-xl group-hover:bg-cyan/20 transition-all duration-300" />
          <p className="text-sm font-black uppercase text-cyan tracking-wider">Available Credits</p>
          <h2 className="mt-3 text-4xl font-black text-white">{customer?.credits ?? 0}</h2>
          <p className="mt-2 text-sm text-white/65">1 credit is used per AI competitor review analysis report.</p>
          <a href="/dashboard/billing" className="btn-secondary mt-5 inline-flex items-center gap-2 group-hover:border-white/35">
            Manage Credits
          </a>
        </div>

        <div className="card p-6 border border-white/10 bg-white/[0.04] rounded-3xl relative overflow-hidden group hover:border-lime/40 transition-all duration-300">
          <div className="absolute -right-12 -bottom-12 w-24 h-24 bg-lime/10 rounded-full blur-xl group-hover:bg-lime/20 transition-all duration-300" />
          <p className="text-sm font-black uppercase text-lime tracking-wider">Analysis Formats</p>
          <h2 className="mt-3 text-4xl font-black text-white">CSV + JSON + PDF</h2>
          <p className="mt-2 text-sm text-white/65">Exports are formatted for excel, presentations, and developer code bases.</p>
        </div>

        <div className="card p-6 border border-white/10 bg-white/[0.04] rounded-3xl relative overflow-hidden group hover:border-coral/40 transition-all duration-300">
          <div className="absolute -right-12 -bottom-12 w-24 h-24 bg-coral/10 rounded-full blur-xl group-hover:bg-coral/20 transition-all duration-300" />
          <p className="text-sm font-black uppercase text-coral tracking-wider">Active Marketplace</p>
          <h2 className="mt-3 text-4xl font-black text-white">Multi-Market</h2>
          <p className="mt-2 text-sm text-white/65">Analyzing Shopify/DTC and Amazon (.com, .ca, .co.uk, and more).</p>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Report Defaults Form */}
        <section className="card p-6 border border-white/10 bg-white/[0.04] rounded-3xl flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-black text-white">Report Preferences</h2>
            <p className="mt-2 text-sm text-white/60">
              Customize the default filters and options when loading the report generator dashboard.
            </p>

            <div className="mt-6 space-y-4">
              <label className="grid gap-2 text-sm text-white/70">
                <span>Default Report Type</span>
                <select
                  value={preferences.reportType}
                  onChange={(e) => savePreferences({ reportType: e.target.value as ReportType })}
                  className="rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-white focus:border-lime focus:outline-none transition"
                >
                  {reportTypes.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm text-white/70">
                <span>Default Review Source</span>
                <select
                  value={preferences.platform}
                  onChange={(e) => savePreferences({ platform: e.target.value as "amazon" | "shopify" })}
                  className="rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-white focus:border-lime focus:outline-none transition"
                >
                  <option value="amazon">Amazon Marketplace</option>
                  <option value="shopify">Shopify / DTC Store</option>
                </select>
              </label>

              <label className="grid gap-2 text-sm text-white/70">
                <span>Default Review Depth (Amazon only)</span>
                <select
                  value={preferences.reviewPageLimit}
                  onChange={(e) => savePreferences({ reviewPageLimit: Number(e.target.value) as 5 | 10 | 50 })}
                  className="rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-white focus:border-lime focus:outline-none transition"
                >
                  {reviewDepths.map((depth) => (
                    <option key={depth.value} value={depth.value}>{depth.label}</option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm text-white/70">
                <span>Preferred Shopify Review App</span>
                <select
                  value={preferences.reviewApp}
                  onChange={(e) => savePreferences({ reviewApp: e.target.value })}
                  className="rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-white focus:border-lime focus:outline-none transition"
                >
                  {shopifyReviewApps.map((app) => (
                    <option key={app.value} value={app.value}>{app.label}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="mt-6">
            {prefsMessage && (
              <div className="rounded-xl bg-lime/10 border border-lime/30 p-3 text-sm text-lime font-bold animate-fadeIn">
                {prefsMessage}
              </div>
            )}
          </div>
        </section>

        {/* Change Password / Account Security Form */}
        <section className="card p-6 border border-white/10 bg-white/[0.04] rounded-3xl">
          <h2 className="text-2xl font-black text-white">Account Security</h2>
          <p className="mt-2 text-sm text-white/60">
            Keep your credentials updated. Choose a strong and unique password to protect your account credits.
          </p>

          {customer ? (
            <form onSubmit={handlePasswordChange} className="mt-6 space-y-4">
              <label className="grid gap-2 text-sm text-white/70">
                <span>Current Password</span>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-white focus:border-lime focus:outline-none transition"
                />
              </label>

              <label className="grid gap-2 text-sm text-white/70">
                <span>New Password</span>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-white focus:border-lime focus:outline-none transition"
                />
              </label>

              <label className="grid gap-2 text-sm text-white/70">
                <span>Confirm New Password</span>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-white focus:border-lime focus:outline-none transition"
                />
              </label>

              <button
                type="submit"
                disabled={passwordBusy}
                className="mt-2 w-full rounded-full bg-lime px-5 py-3 font-black text-black hover:bg-lime/90 transition-all duration-300 disabled:opacity-50"
              >
                {passwordBusy ? "Updating password..." : "Change Password"}
              </button>
            </form>
          ) : (
            <div className="mt-8 rounded-2xl border border-white/10 bg-black/35 p-6 text-center">
              <p className="font-bold text-white/80">Security controls locked</p>
              <p className="mt-2 text-sm text-white/50">Please sign in to update account security credentials.</p>
              <a href="/login" className="btn-secondary mt-4">Sign in to account</a>
            </div>
          )}

          <div className="mt-4">
            {passwordStatus.type === "success" && (
              <div className="rounded-xl bg-lime/10 border border-lime/30 p-3 text-sm text-lime font-bold animate-fadeIn">
                {passwordStatus.message}
              </div>
            )}
            {passwordStatus.type === "error" && (
              <div className="rounded-xl bg-coral/10 border border-coral/30 p-3 text-sm text-coral font-bold animate-fadeIn">
                {passwordStatus.message}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
