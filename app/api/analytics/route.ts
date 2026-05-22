import { NextResponse } from "next/server"
import { z } from "zod"
import { trackServerEvent } from "@/lib/analytics"

const eventSchema = z.object({
  name: z.string().trim().min(1).max(80),
  properties: z.record(z.string(), z.unknown()).optional()
})

export async function POST(request: Request) {
  const parsed = eventSchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 })
  await trackServerEvent(parsed.data)
  return NextResponse.json({ ok: true })
}
