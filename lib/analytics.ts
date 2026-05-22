import type { Prisma } from "@prisma/client"

export type AnalyticsEvent = {
  name: string
  properties?: Record<string, unknown>
}

export async function trackServerEvent(event: AnalyticsEvent) {
  if (!process.env.DATABASE_URL) return
  try {
    const { getDb, hasRealDatabaseUrl } = await import("@/lib/db")
    if (!hasRealDatabaseUrl()) return
    await getDb().auditEvent.create({
      data: {
        action: `analytics.${event.name}`,
        entity: "analytics_event",
        metadata: (event.properties ?? {}) as Prisma.InputJsonValue
      }
    })
  } catch {
    // Analytics must never break a customer workflow.
  }
}
