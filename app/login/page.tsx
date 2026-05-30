import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "Sign in", description: "Sign in to your ReviewGap account.", robots: { index: false, follow: false } }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; signedIn?: string }> }) {
  const params = await searchParams
  return (
    <main className="px-5 py-20">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[.9fr_1.1fr]">
        <div>
          <p className="font-black uppercase text-lime">Sign in</p>
          <h1 className="mt-4 text-5xl font-black md:text-7xl">Welcome back.</h1>
          <p className="mt-5 text-lg text-white/70">Sign in to open your reports, credits, and billing page.</p>
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/65">
            Demo account: <span className="font-bold text-white">demo@reviewgap.test</span> / <span className="font-bold text-white">demo1234</span>
          </div>
        </div>
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-7">
          <h2 className="text-2xl font-black">Sign in</h2>
          {params.error ? <p className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-100">Check your email and password, then try again.</p> : null}
          {params.signedIn ? <p className="mt-4 rounded-xl border border-lime/30 bg-lime/10 p-3 text-sm text-lime">You are signed in. Choose where to go next.</p> : null}
          <form action="/api/auth/login" method="post" className="mt-6 grid gap-4">
            <input type="hidden" name="mode" value="login" />
            <input type="hidden" name="redirectTo" value="/login?signedIn=1" />
            <label className="grid gap-2 text-sm text-white/70">
              Email
              <input suppressHydrationWarning name="email" type="email" required placeholder="you@example.com" className="rounded-xl border border-white/10 bg-black px-4 py-3 text-white" />
            </label>
            <label className="grid gap-2 text-sm text-white/70">
              Password
              <input suppressHydrationWarning name="password" type="password" required minLength={6} placeholder="Your password" className="rounded-xl border border-white/10 bg-black px-4 py-3 text-white" />
            </label>
            <button suppressHydrationWarning className="rounded-full bg-lime px-5 py-3 font-black text-black">Sign in</button>
          </form>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/signup" className="font-bold text-lime">Create account</Link>
            <Link href="/dashboard/reports" className="font-bold text-white/70">Go to my reports</Link>
          </d