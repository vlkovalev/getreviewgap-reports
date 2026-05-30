import type { Metadata } from "next"

export const metadata: Metadata = { title: "About", description: "ReviewGap helps Shopify brands, Amazon sellers, and agencies turn competitor reviews into actionable product and marketing insights — fast." }

export default function AboutPage() {
  return (
    <main className="px-5 py-20">
      <div className="mx-auto max-w-4xl">
        <p className="font-black uppercase text-cyan">About</p>
        <h1 className="mt-4 text-5xl font-black md:text-7xl">Fast competitor research for product teams.</h1>
        <p className="mt-6 text-xl text-white/70">
          ReviewGap turns competitor Amazon reviews into product decisions, positioning angles, and ad hooks. It is 