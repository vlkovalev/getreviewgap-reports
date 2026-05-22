import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "Sign up", description: "Create a ReviewIntel Reports account." }

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string; created?: string }> }) {
  const params = await searchParams
  return (
    <main className="px-5 py-20">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[.9fr_1.1fr]">
        <div>
          <p className="font-black uppercase text-lime">Sign up</p>
          <h1 className="mt-4 text-5xl font-black md:text-7xl">Create your account.</h1>
          <p className="mt-5 text-lg text-white/70">New accounts start with 1 report credit so you can try the product before choosing a plan.</p>
        </div>
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-7">
          <h2 className="text-2xl font-black">Sign up</h2>
          {params.error ? <p className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-100">Use a valid email and a password of at least 6 characters.</p> : null}
          {params.created ? <p className="mt-4 rounded-xl border border-lime/30 bg-lime/10 p-3 text-sm text-lime">Account created. You can now choose your next step.</p> : null}
          <form action="/api/auth/login" method="post" className="mt-6 grid gap-4">
            <input type="hidden" name="mode" value="signup" />
            <input type="hidden" name="redirectTo" value="/signup?created=1" />
            <label className="grid gap-2 text-sm text-white/70">
              Email
              <input suppressHydrationWarning name="email" type="email" required placeholder="you@example.com" className="rounded-xl border border-white/10 bg-black px-4 py-3 text-white" />
            </label>
            <label className="grid gap-2 text-sm text-white/70">
              Password
              <input suppressHydrationWarning name="password" type="password" required minLength={6} placeholder="At least 6 characters" className="rounded-xl border border-white/10 bg-black px-4 py-3 text-white" />
            </label>
            <button suppressHydrationWarning className="rounded-full bg-lime px-5 py-3 font-black text-black">Create account</button>
          </form>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/login" className="font-bold text-lime">Already have an account?</Link>
            <Link href="/onboarding" className="font-bold text-white/70">View onboarding</Link>
          </div>
        </section>
      </div>
    </main>
  )
}
