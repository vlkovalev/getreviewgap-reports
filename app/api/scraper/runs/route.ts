import { NextResponse } from "next/server"
import { getStore } from "@/lib/scrapers/store"

export async function GET() {
  return NextResponse.json({ runs: getStore().runs })
}
