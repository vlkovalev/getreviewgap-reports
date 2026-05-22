import Link from "next/link"

export default function NotFound() {
  return (
    <main className="grid min-h-[70vh] place-items-center px-5 text-center">
      <div>
        <p className="font-black uppercase text-lime">404</p>
        <h1 className="mt-4 text-5xl font-black">This report is missing.</h1>
        <Link href="/" className="btn-primary mt-8">Back home</Link>
      </div>
    </main>
  )
}
