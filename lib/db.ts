import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export function getDb() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient()
  }
  return globalForPrisma.prisma
}

export function hasRealDatabaseUrl() {
  const url = process.env.DATABASE_URL
  return Boolean(url && !url.includes("USER:PASSWORD") && !url.includes("HOST:5432"))
}

export async function withDbRetry<T>(operation: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      if (!isDatabaseConnectionError(error) || attempt === attempts) break
      await new Promise((resolve) => setTimeout(resolve, attempt * 350))
    }
  }
  throw lastError
}

export function isDatabaseConnectionError(error: unknown) {
  if (!error || typeof error !== "object") return false
  const message = "message" in error ? String(error.message) : ""
  const code = "code" in error ? String(error.code) : ""
  return code === "P1001" || message.includes("Can't reach database server") || message.includes("Connection terminated")
}
