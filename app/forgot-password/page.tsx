import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Reset password", description: "Request a ReviewGap password reset.", robots: { index: false, follow: false } }

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ sent?: string }> }) {
  const params = await searchParams
  return (
    <main className="px-5 py-20">
      <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/[0.04] p-7">
        <p className="font-black uppercase text-lime">Account recovery</p>
        <h1 className="mt-3 text-4xl font-black">Reset your password</h1>
        <p className="mt-4 text-white/65">Enter your account email. If it exists, we will send a reset link that expires in 30 minutes.</p>
        {params.sent ? <p className="mt-4 rounded-xl border border-lime/30 bg-lime/10 p-3 text-sm text-lime">If that email exists, a reset link has been sent.</p> : null}
        <form action="/api/auth/forgot-password" method="post" className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm text-white/70">
            Email
            <input suppressHydrationWarning name="email" type="email" required placeholder="you@example.com" className="rounded-xl border border-white/10 bg-black px-4 py-3 text-white" />
          </label>
          <button className="rounded-full bg-lime px-5 py-3 font-black text-black">Send reset link</button>
        </form>
        <Link href="/login" className="mt-5 inline-flex font-bold text-white/70">Back to sign in</Link>
      </div>
    </main>
  )
}
