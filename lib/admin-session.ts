import { cookies } from "next/headers"

export const ADMIN_SESSION_COOKIE = "admin_session"
export const ADMIN_SESSION_VALUE = "ok"

export async function requireAdmin() {
  const cookieStore = await cookies()
  return cookieStore.get(ADMIN_SESSION_COOKIE)?.value === ADMIN_SESSION_VALUE
}
