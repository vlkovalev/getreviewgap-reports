import { createHash, randomBytes, timingSafeEqual } from "node:crypto"
import bcrypt from "bcryptjs"
import type { Prisma } from "@prisma/client"
import { getDb, hasRealDatabaseUrl, withDbRetry } from "@/lib/db"
import { findCustomerByEmail, updateCustomerPassword } from "@/lib/customer-store"

const RESET_TTL_MS = 30 * 60 * 1000

const memory = globalThis as unknown as {
  reviewIntelPasswordResets?: Array<{
    customerId: string
    email: string
    tokenHash: string
    expiresAt: string
    usedAt?: string
    createdAt: string
  }>
}

function memoryResets() {
  memory.reviewIntelPasswordResets ||= []
  return memory.reviewIntelPasswordResets
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

function tokenMatches(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

export async function createPasswordResetToken(email: string) {
  const normalizedEmail = email.trim().toLowerCase()
  const customer = await findCustomerByEmail(normalizedEmail)
  if (!customer) return null

  const token = randomBytes(32).toString("base64url")
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + RESET_TTL_MS)

  if (hasRealDatabaseUrl()) {
    await withDbRetry(() => getDb().auditEvent.create({
      data: {
        actorId: customer.id,
        action: "password_reset_requested",
        entity: "customer_account",
        entityId: customer.id,
        metadata: {
          email: normalizedEmail,
          tokenHash,
          expiresAt: expiresAt.toISOString(),
          usedAt: null
        } as Prisma.InputJsonValue
      }
    }))
  } else {
    memoryResets().push({
      customerId: customer.id,
      email: normalizedEmail,
      tokenHash,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString()
    })
  }

  return token
}

export async function resetPasswordWithToken(token: string, newPassword: string) {
  const tokenHash = hashToken(token)
  const now = new Date()

  if (hasRealDatabaseUrl()) {
    const db = getDb()
    const events = await withDbRetry(() => db.auditEvent.findMany({
      where: { action: "password_reset_requested", entity: "customer_account" },
      orderBy: { createdAt: "desc" },
      take: 50
    }))

    const event = events.find((item) => {
      const metadata = item.metadata as { tokenHash?: string; expiresAt?: string; usedAt?: string | null } | null
      if (!metadata?.tokenHash || !metadata.expiresAt || metadata.usedAt) return false
      if (new Date(metadata.expiresAt).getTime() < now.getTime()) return false
      return tokenMatches(metadata.tokenHash, tokenHash)
    })

    if (!event?.entityId) return false

    const customerId = event.entityId
    const passwordHash = await bcrypt.hash(newPassword, 10)
    await withDbRetry(() => db.$transaction([
      db.customerAccount.update({
        where: { id: customerId },
        data: { passwordHash }
      }),
      db.auditEvent.update({
        where: { id: event.id },
        data: {
          metadata: {
            ...((event.metadata as Record<string, unknown>) ?? {}),
            usedAt: now.toISOString()
          } as Prisma.InputJsonValue
        }
      }),
      db.auditEvent.create({
        data: {
          actorId: customerId,
          action: "password_reset_completed",
          entity: "customer_account",
          entityId: customerId
        }
      })
    ]))
    return true
  }

  const reset = memoryResets().find((item) => {
    if (item.usedAt) return false
    if (new Date(item.expiresAt).getTime() < now.getTime()) return false
    return tokenMatches(item.tokenHash, tokenHash)
  })
  if (!reset) return false
  const updated = await updateCustomerPassword(reset.customerId, newPassword)
  if (!updated) return false
  reset.usedAt = now.toISOString()
  return true
}
