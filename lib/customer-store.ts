import bcrypt from "bcryptjs"
import { getDb, hasRealDatabaseUrl, withDbRetry } from "@/lib/db"

export type Customer = {
  id: string
  email: string
  password?: string
  credits: number
  createdAt: string
}

export type CreditLedgerItem = {
  id: string
  createdAt: string
  amount: number
  reason: string
  referenceId?: string | null
}

export type PurchaseHistoryItem = {
  id: string
  createdAt: string
  provider: string
  planId: string
  amount: number
  currency: string
  status: string
  credits: number
}

const memory = globalThis as unknown as {
  reviewIntelCustomers?: Customer[]
  reviewIntelCreditTransactions?: Array<CreditLedgerItem & { customerId: string }>
  reviewIntelCustomerPurchases?: Array<PurchaseHistoryItem & { customerId: string }>
}

function memoryCustomers() {
  memory.reviewIntelCustomers ||= [
    {
      id: "cust-demo",
      email: "demo@reviewgap.test",
      password: "demo1234",
      credits: 3,
      createdAt: new Date().toISOString()
    }
  ]
  return memory.reviewIntelCustomers
}

function memoryTransactions() {
  memory.reviewIntelCreditTransactions ||= []
  return memory.reviewIntelCreditTransactions
}

function memoryPurchases() {
  memory.reviewIntelCustomerPurchases ||= []
  return memory.reviewIntelCustomerPurchases
}

function toCustomer(record: { id: string; email: string; credits: number; createdAt: Date | string }): Customer {
  return {
    id: record.id,
    email: record.email,
    credits: record.credits,
    createdAt: typeof record.createdAt === "string" ? record.createdAt : record.createdAt.toISOString()
  }
}

export async function findCustomerByEmail(email: string) {
  if (hasRealDatabaseUrl()) {
    const customer = await withDbRetry(() => getDb().customerAccount.findUnique({ where: { email: email.toLowerCase() } }))
    return customer ? toCustomer(customer) : null
  }
  return memoryCustomers().find((customer) => customer.email.toLowerCase() === email.toLowerCase()) ?? null
}

export async function validateCustomerPassword(email: string, password: string) {
  if (hasRealDatabaseUrl()) {
    const customer = await withDbRetry(() => getDb().customerAccount.findUnique({ where: { email: email.toLowerCase() } }))
    if (!customer) return null
    const valid = await bcrypt.compare(password, customer.passwordHash)
    return valid ? toCustomer(customer) : null
  }
  const customer = memoryCustomers().find((item) => item.email.toLowerCase() === email.toLowerCase())
  return customer?.password === password ? customer : null
}

export async function findCustomerById(id: string | undefined) {
  if (!id) return null
  if (hasRealDatabaseUrl()) {
    const customer = await withDbRetry(() => getDb().customerAccount.findUnique({ where: { id } }))
    return customer ? toCustomer(customer) : null
  }
  return memoryCustomers().find((customer) => customer.id === id) ?? null
}

export async function createCustomer(email: string, password: string) {
  const normalizedEmail = email.toLowerCase()
  const existing = await findCustomerByEmail(normalizedEmail)
  if (existing) return existing

  if (hasRealDatabaseUrl()) {
    const passwordHash = await bcrypt.hash(password, 10)
    const customer = await withDbRetry(() => getDb().customerAccount.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        credits: 1,
        transactions: {
          create: {
            amount: 1,
            reason: "signup_bonus"
          }
        }
      }
    }))
    return toCustomer(customer)
  }

  const customer: Customer = {
    id: crypto.randomUUID(),
    email: normalizedEmail,
    password,
    credits: 1,
    createdAt: new Date().toISOString()
  }
  memoryCustomers().push(customer)
  memoryTransactions().push({
    id: crypto.randomUUID(),
    customerId: customer.id,
    amount: 1,
    reason: "signup_bonus",
    createdAt: new Date().toISOString()
  })
  return customer
}

export async function consumeCredit(customerId: string, referenceId?: string) {
  if (hasRealDatabaseUrl()) {
    const db = getDb()
    const customer = await withDbRetry(() => db.customerAccount.findUnique({ where: { id: customerId } }))
    if (!customer || customer.credits <= 0) return false
    await withDbRetry(() => db.$transaction([
      db.customerAccount.update({ where: { id: customerId }, data: { credits: { decrement: 1 } } }),
      db.creditTransaction.create({ data: { customerId, amount: -1, reason: "report_generation", referenceId } })
    ]))
    return true
  }

  const customer = memoryCustomers().find((item) => item.id === customerId)
  if (!customer || customer.credits <= 0) return false
  customer.credits -= 1
  memoryTransactions().push({
    id: crypto.randomUUID(),
    customerId,
    amount: -1,
    reason: "report_generation",
    referenceId,
    createdAt: new Date().toISOString()
  })
  return true
}

export async function addCredits(customerId: string, credits: number, reason = "purchase", referenceId?: string) {
  if (hasRealDatabaseUrl()) {
    const db = getDb()
    const customer = await withDbRetry(() => db.customerAccount.update({
      where: { id: customerId },
      data: {
        credits: { increment: credits },
        transactions: {
          create: {
            amount: credits,
            reason,
            referenceId
          }
        }
      }
    }))
    return toCustomer(customer)
  }

  const customer = memoryCustomers().find((item) => item.id === customerId)
  if (!customer) return null
  customer.credits += credits
  memoryTransactions().push({
    id: crypto.randomUUID(),
    customerId,
    amount: credits,
    reason,
    referenceId,
    createdAt: new Date().toISOString()
  })
  return customer
}

export async function addCreditsOnce(customerId: string, credits: number, reason = "purchase", referenceId?: string) {
  if (!referenceId) return addCredits(customerId, credits, reason)

  if (hasRealDatabaseUrl()) {
    const db = getDb()
    const existing = await withDbRetry(() => db.creditTransaction.findFirst({ where: { customerId, reason, referenceId } }))
    if (existing) return findCustomerById(customerId)
    return addCredits(customerId, credits, reason, referenceId)
  }

  const existing = memoryTransactions().find((item) => item.customerId === customerId && item.reason === reason && item.referenceId === referenceId)
  if (existing) return findCustomerById(customerId)
  return addCredits(customerId, credits, reason, referenceId)
}

export async function getCustomerCreditLedger(customerId: string, limit = 10): Promise<CreditLedgerItem[]> {
  if (hasRealDatabaseUrl()) {
    const rows = await withDbRetry(() => getDb().creditTransaction.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
      take: limit
    }))
    return rows.map((row) => ({
      id: row.id,
      amount: row.amount,
      reason: row.reason,
      referenceId: row.referenceId,
      createdAt: row.createdAt.toISOString()
    }))
  }

  return memoryTransactions()
    .filter((item) => item.customerId === customerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
    .map(({ customerId: _customerId, ...item }) => item)
}

export async function getCustomerPurchases(customerId: string, limit = 8): Promise<PurchaseHistoryItem[]> {
  if (hasRealDatabaseUrl()) {
    const rows = await withDbRetry(() => getDb().customerPurchase.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
      take: limit
    }))
    return rows.map((row) => ({
      id: row.id,
      provider: row.provider,
      planId: row.planId,
      amount: row.amount,
      currency: row.currency,
      status: row.status,
      credits: row.credits,
      createdAt: row.createdAt.toISOString()
    }))
  }

  return memoryPurchases()
    .filter((item) => item.customerId === customerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
    .map(({ customerId: _customerId, ...item }) => item)
}

export async function validateCustomerPasswordById(id: string, password: string): Promise<boolean> {
  if (hasRealDatabaseUrl()) {
    const customer = await withDbRetry(() => getDb().customerAccount.findUnique({ where: { id } }))
    if (!customer) return false
    return await bcrypt.compare(password, customer.passwordHash)
  }
  const customer = memoryCustomers().find((item) => item.id === id)
  return customer?.password === password || false
}

export async function updateCustomerPassword(id: string, newPassword: string): Promise<boolean> {
  if (hasRealDatabaseUrl()) {
    const passwordHash = await bcrypt.hash(newPassword, 10)
    await withDbRetry(() => getDb().customerAccount.update({
      where: { id },
      data: { passwordHash }
    }))
    return true
  }

  const customer = memoryCustomers().find((item) => item.id === id)
  if (!customer) return false
  customer.password = newPassword
  return true
}

