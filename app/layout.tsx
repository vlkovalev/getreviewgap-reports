import type { Metadata } from "next"
import "./globals.css"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { AnalyticsBeacon } from "@/components/AnalyticsBeacon"
import { TrackingScripts } from "@/components/TrackingScripts"
import { site } from "@/lib/content"

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://reviewgap.com"),
  title: {
    default: `${site.name} | AI Competitor Review Intelligence`,
    template: `%s | ${site.name}`
  },
  description: "ReviewGap turns competitor reviews into AI-powered reports for Shopify brands and Amazon sellers. Find complaints, buyer language, and product gaps in minutes.",
  openGraph: {
    title: `${site.name} | AI Competitor Review Intelligence`,
    description: "ReviewGap turns competitor reviews into AI-powered reports for Shopify brands 