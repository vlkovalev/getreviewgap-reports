import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-session"

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  const db = getDb()
  return NextResponse.json(await db.resourcePost.findMany({ orderBy: { createdAt: "desc" } }))
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  const body = await request.json()
  if (!body.title || !body.slug || !body.excerpt || !body.content) return NextResponse.json({ message: "Missing fields" }, { status: 400 })
  const db = getDb()
  return NextResponse.json(await db.resourcePost.create({
    data: { title: body.title, slug: body.slug, excerpt: body.excerpt, content: body.content, tags: body.tags || [], publishedAt: new Date() }
  }))
}
