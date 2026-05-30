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
      