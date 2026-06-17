import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-session"

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  const db = getDb()
  return NextResponse.json(await db.fAQ.findMany({ orderBy: { order: "asc" } }))
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  const body = await request.json()
  if (!body.question || !body.answer) return NextResponse.json({ message: "Missing fields" }, { status: 400 })
  const db = getDb()
  return NextResponse.json(await db.fAQ.create({ data: { question: body.question, answer: body.answer, order: Number(body.order || 0) } }))
}
