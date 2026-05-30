import Link from "next/link"
import { site } from "@/lib/content"

const footerLinks = [
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
  { label: "Resources", href: "/resources" },
  { label: "Contact", href: "/contact" },
  { label: "Compliance", href: "/compliance" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms", href: "/terms" }
]

export function Footer() {
  return (
    <footer className="border-t border-white/10 px-5 py-10 text-sm text-white/60">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 md:flex-row 