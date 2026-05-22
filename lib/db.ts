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
