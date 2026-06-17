import dns from "node:dns"

const BLOCKED_HOSTNAMES = new Set(["localhost"])

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split(".").map(Number)
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return false
  const [a, b] = parts
  if (a === 10) return true
  if (a === 127) return true
  if (a === 0) return true
  if (a === 169 && b === 254) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  return false
}

function isPrivateIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase()
  if (normalized === "::1") return true
  if (normalized.startsWith("::ffff:")) return isPrivateIpv4(normalized.slice("::ffff:".length))
  if (normalized.startsWith("fe80:") || normalized.startsWith("fc") || normalized.startsWith("fd")) return true
  return false
}

function isPrivateIp(ip: string): boolean {
  return ip.includes(":") ? isPrivateIpv6(ip) : isPrivateIpv4(ip)
}

/**
 * Throws if the URL targets a non-http(s) scheme or a private/loopback/link-local
 * address, including after DNS resolution (guards against DNS rebinding).
 */
export async function assertPublicHttpUrl(rawUrl: string): Promise<void> {
  const parsed = new URL(rawUrl)
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http/https URLs are allowed")
  }
  const hostname = parsed.hostname.toLowerCase()
  if (BLOCKED_HOSTNAMES.has(hostname) || isPrivateIp(hostname)) {
    throw new Error("URL resolves to a blocked address")
  }
  const addresses = await dns.promises.lookup(hostname, { all: true }).catch(() => [])
  if (addresses.some(({ address }) => isPrivateIp(address))) {
    throw new Error("URL resolves to a blocked address")
  }
}
