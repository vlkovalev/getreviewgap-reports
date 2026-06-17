import { NextResponse } from "next/server"
import { z } from "zod"
import { addSource, getStore } from "@/lib/scrapers/store"

const sourceSchema = z.object({
  name: z.string().min(2),
  baseUrl: z.string().url().refine((val) => val.startsWith("http://") || val.startsWith("https://"), {
    message: "URL must use http or https scheme",
  }),
  sourceType: z.string().min(2).default("demo-store"),
  rateLimitSeconds: z.coerce.number().min(1).max(120).default(5),
  robotsNote: z.string().max(500).optional(),
  notes: z.string().max(1000).optional()
})

function sanitizeInput(str: string): string {
  return str.replace(/<[^>]*>/g, "").trim()
}

export async function GET() {
  return NextResponse.json({ sources: getStore().sources })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = sourceSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid source input", details: parsed.error.flatten() }, { status: 400 })
    }

    const sanitized = {
      ...parsed.data,
      name: sanitizeInput(parsed.data.name),
      robotsNote: parsed.data.robotsNote ? sanitizeInput(parsed.data.robotsNote) : undefined,
      notes: parsed.data.notes ? sanitizeInput(parsed.data.notes) : undefined,
    }

    return NextResponse.json({ source: addSource(sanitized) }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Could not create source" }, { status: 500 })
  }
}
