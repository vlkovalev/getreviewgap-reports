import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Choose new password", description: "Set a new ReviewGap password.", robots: { index: false, follow: false } }

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const params = await searchParams
  const token = params.token ?? ""
  return (
    <main className="px-5 py-20">
      <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/[0.04] p-7">
        <p className="font-black uppercase text-lime">Account recovery</p>
        <h1 className="mt-3 text-4xl font-black">Choose a new password</h1>
        {params.error ? <p className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-100">{errorMessage(params.error)}</p> : null}
        {!token ? (
          <div className="mt-6 rounded-xl border border-yellow-300/25 bg-yellow-300/10 p-4 text-yellow-50">
            Reset token missing. Request a new password reset link.
          </div>
        ) : (
          <form action="/api/auth/reset-password" method="post" className="mt-6 grid gap-4">
            <input type="hidden" name="token" value={token} />
            <label className="grid gap-2 text-sm text-white/70">
              New password
              <input suppressHydrationWarning name="password" type="password" required minLength={6} placeholder="At least 6 characters" className="rounded-xl border border-white/10 bg-black px-4 py-3 text-white" />
            </label>
            <label className="grid gap-2 text-sm text-white/70">
              Confirm password
              <input suppressHydrationWarning name="confirmPassword" type="password" required minLength={6} placeholder="Repeat new password" className="rounded-xl border border-white/10 bg-black px-4 py-3 text-white" />
            </label>
            <button className="rounded-full bg-lime px-5 py-3 font-black text-black">Update password</button>
          </form>
        )}
        <Link href="/forgot-password" className="mt-5 inline-flex font-bold text-white/70">Request a new link</Link>
      </div>
    </main>
  )
}

function errorMessage(error: string) {
  if (error === "expired") return "This reset link is invalid or expired. Request a new link."
  if (error === "rate") return "Too many reset attempts. Please try again soon."
  return "Check that both passwords match and are at least 6 characters."
}
