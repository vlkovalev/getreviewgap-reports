import type { MetadataRoute } from "next"
import { resources } from "@/lib/content"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  const staticRoutes = ["", "/dashboard", "/dashboard/settings", "/pricing", "/about", "/resources", "/contact", "/privacy", "/terms"]
  return [
    ...staticRoutes.map((route) => ({ url: `${base}${route}`, lastModified: new Date() })),
    ...resources.map((post) => ({ url: `${base}/resources/${post.slug}`, lastModified: new Date() }))
  ]
}
