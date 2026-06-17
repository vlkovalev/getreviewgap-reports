import { cookies } from "next/headers"
import { findCustomerById } from "@/lib/customer-store"
import { verifySession } from "@/lib/session-crypto"

export const CUSTOMER_COOKIE = "reviewgap_customer"

export async function getCurrentCustomer() {
  const cookieStore = await cookies()
  const token = cookieStore.get(CUSTOMER_COOKIE)?.value
  const customerId = await verifySession(token)
  if (!customerId) return null
  return findCustomerById(customerId)
}
