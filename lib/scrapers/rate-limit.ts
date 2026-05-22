export function getRequestDelayMs(rateLimitSeconds: number) {
  return Math.max(1000, rateLimitSeconds * 1000)
}
