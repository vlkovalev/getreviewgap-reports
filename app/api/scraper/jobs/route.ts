import { NextResponse } from "next/server"
import { z } from "zod"
import { addJob, getStore } from "@/lib/scrapers/store"

const jobSchema = z.object({
  name: z.string().min(2),
  sourceId: z.string().min(1),
  targetUrls: z.array(z.string().url()).min(1),
  schedule: z.string().max(100).optional()
})

export async function GET() {
  return NextResponse.json({ jobs: getStore().jobs })
}

export async function POST(request: Request) {
  try {
    const parsed = jobSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid job input", details: parsed.error.flatten() }, { status: 400 })
    }
    if (!getStore().sources.some((source) => source.id === parsed.data.sourceId)) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 })
    }
    return NextResponse.json({ job: addJob(parsed.data) }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Could not create job" }, { status: 500 })
  }
}
