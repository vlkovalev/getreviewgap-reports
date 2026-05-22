import type { Metadata } from "next"
import "./globals.css"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { AnalyticsBeacon } from "@/components/AnalyticsBeacon"
import { TrackingScripts } from "@/components/TrackingScripts"
import { site } from "@/lib/content"

export const metadata: Metadata = {
  title: {
    default: `${site.name} | AI E-commerce Research`,
    template: `%s | ${site.name}`
  },
  description: site.description,
  openGraph: {
    title: site.name,
    description: site.description,
    type: "website"
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Header />
        <AnalyticsBeacon />
        <TrackingScripts />
        {children}
        <Footer />
      </body>
    </html>
  )
}
