const hits = new Map<string, { count: number; reset: number }>()

export function isRateLimited(key: string, limit = 8, windowMs = 60_000) {
  const now = Date.now()
  const current = hits.get(key)

  if (!current || current.reset < now) {
    hits.set(key, { count: 1, reset: now + windowMs })
    return false
  }

  current.count += 1
  return current.count > limit
}
