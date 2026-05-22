export default function AdminLoginPage() {
  const hasConfiguredAdmin = Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD)
  return (
    <main className="grid min-h-[70vh] place-items-center px-5">
      <form action="/api/admin/login" method="post" className="card grid w-full max-w-md gap-4 p-6">
        <p className="font-black uppercase text-lime">Owner area</p>
        <h1 className="text-3xl font-black">Admin login</h1>
        <p className="text-sm text-white/60">
          {hasConfiguredAdmin ? "This private area is for the ReviewIntel owner and staff only." : "Local demo credentials: admin@example.com / change-this-password"}
        </p>
        <label className="grid gap-2 text-sm font-bold">Email<input suppressHydrationWarning name="email" type="email" className="rounded-xl border border-white/10 bg-white/10 px-4 py-3" /></label>
        <label className="grid gap-2 text-sm font-bold">Password<input suppressHydrationWarning name="password" type="password" className="rounded-xl border border-white/10 bg-white/10 px-4 py-3" /></label>
        <button suppressHydrationWarning className="btn-primary">Log in</button>
        <p className="border-t border-white/10 pt-4 text-sm text-white/60">
          Looking for your reports? <a href="/login" className="font-black text-lime">Use customer sign in</a>.
        </p>
      </form>
    </main>
  )
}
