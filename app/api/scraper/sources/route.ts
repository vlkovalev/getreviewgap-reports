import { NextResponse } from "next/server"
import { z } from "zod"
import { addSource, getStore } from "@/lib/scrapers/store"

const sourceSchema = z.object({
  name: z.string().min(2),
  baseUrl: z.string().url(),
  sourceType: z.string().min(2).default("demo-store"),
  rateLimitSeconds: z.coerce.number().min(1).max(120).default(5),
  robotsNote: z.string().max(500).optional(),
  notes: z.string().max(1000).optional()
})

export async function GET() {
  return NextResponse.json({ sources: getStore().sources })
}

export async function POST(request: Request) {
  try {
    const parsed = sourceSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid source input", details: parsed.error.flatten() }, { status: 400 })
    }
    return NextResponse.json({ source: addSource(parsed.data) }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Could not create source" }, { status: 500 })
  }
}
