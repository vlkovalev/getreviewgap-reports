const encoder = new TextEncoder()

if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET must be set in production")
}

const SECRET = process.env.SESSION_SECRET || "reviewgap_super_secret_fallback_key_32_chars_long"

async function getCryptoKey() {
  const keyData = encoder.encode(SECRET)
  return crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  )
}

export async function signSession(customerId: string): Promise<string> {
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 30 // 30 days
  const payload = `${customerId}:${expiresAt}`
  const key = await getCryptoKey()
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload)
  )
  const signatureHex = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
  return `${payload}:${signatureHex}`
}

export async function verifySession(tokenValue: string | undefined): Promise<string | null> {
  if (!tokenValue) return null
  const parts = tokenValue.split(":")
  if (parts.length !== 3) return null
  const [customerId, expiresAtStr, signatureHex] = parts
  const expiresAt = parseInt(expiresAtStr, 10)
  if (isNaN(expiresAt) || expiresAt < Date.now()) return null

  const payload = `${customerId}:${expiresAt}`
  const key = await getCryptoKey()
  const expectedBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload)
  )
  const expectedHex = Array.from(new Uint8Array(expectedBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")

  if (signatureHex !== expectedHex) return null
  return customerId
}
