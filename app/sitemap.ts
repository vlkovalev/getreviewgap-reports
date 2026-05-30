import type { MetadataRoute } from "next"
import { resources } from "@/lib/content"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  // Only public, indexable pages — dashboard/auth/checkout pages are noindex
  const staticRoutes = ["", "/pricing", "/about", "/resources", "/contact", "/compliance", "/privacy", "/terms"]
  return [
    ...staticRoutes.map((route) => ({ url: `${base}${route}`, lastModified: new Date() })),
    ...resources.map((post) => ({ url: `${base}/re