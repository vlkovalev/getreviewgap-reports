import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { resources } from "@/lib/content"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://reviewgap.com"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = resources.find((item) => item.slug === slug)
  if (!post) return {}
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      url: `${siteUrl}/resources/${post.slug}`
    }
  }
}

export function generateStaticParams() {
  return resources.map((post) => ({ slug: post.slug }))
}

export default async function ResourceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = resources.find((item) => item.slug === slug)
  if (!post) notFound()

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    url: `${siteUrl}/resources/${post.slug}`,
    publisher: {
      "@type": "Organization",
      name: "ReviewGap",
      url: siteUrl
    }
  }

  return (
    <main className="px-5 py-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="mx-auto max-w-3xl">
        <div className="flex flex-wrap gap-2">{post.tags.map((tag) => <span key={tag} className="rounded-full bg-lime px-3 py-1 text-xs font-black text-ink">{tag}</span>)}</div>
        <h1 className="mt-6 text-5xl font-black leading-tight md:text-7xl">{post.title}</h1>
        <p className="mt-6 text-xl text-white/70">{post.excerpt}</p>
        <div className="mt-10 rounded-3xl bg-white/8 p-8 text-lg leading-8 text-white/78">{post.content}</div>
      </article>
    </main>
  )
}
