import type { Metadata } from "next"
import Link from "next/link"
import { resources } from "@/lib/content"

export const metadata: Metadata = { title: "Resources", description: "Tutorials for AI-powered PowerPoint presentation design." }

export default function ResourcesPage() {
  return (
    <main className="px-5 py-20">
      <div className="mx-auto max-w-6xl">
        <p className="font-black uppercase text-cyan">Resources</p>
        <h1 className="mt-4 text-5xl font-black md:text-7xl">Tutorials and production notes</h1>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {resources.map((post) => (
            <Link key={post.slug} href={`/resources/${post.slug}`} className="card block p-6 hover:border-lime/60">
              <h2 className="text-2xl font-black">{post.title}</h2>
              <p className="mt-4 text-white/66">{post.excerpt}</p>
              <div className="mt-5 flex flex-wrap gap-2">{post.tags.map((tag) => <span key={tag} className="rounded-full bg-white/10 px-3 py-1 text-xs">{tag}</span>)}</div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
