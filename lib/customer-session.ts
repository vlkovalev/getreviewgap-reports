import { cookies } from "next/headers"
import { findCustomerById } from "@/lib/customer-store"

export const CUSTOMER_COOKIE = "reviewgap_customer"

export async function getCurrentCustomer() {
  const cookieStore = await cookies()
  return findCustomerById(cookieStore.get(CUSTOMER_COOKIE)?.value)
}
