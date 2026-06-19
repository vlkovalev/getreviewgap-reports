import assert from "node:assert/strict"
import { assertPublicHttpUrl } from "../lib/url-safety"

async function rejects(url: string, label: string) {
  await assert.rejects(() => assertPublicHttpUrl(url), label)
}

async function resolves(url: string, label: string) {
  await assertPublicHttpUrl(url).catch((error) => {
    throw new Error(`${label}: expected to resolve but threw: ${error.message}`)
  })
}

async function main() {
  console.log("Starting URL safety guard tests...")

  await rejects("http://127.0.0.1/", "loopback IPv4 literal must be rejected")
  await rejects("http://127.0.0.1:5432/", "loopback IPv4 literal with port must be rejected")
  await rejects("http://169.254.169.254/latest/meta-data/", "link-local IPv4 (cloud metadata) must be rejected")
  await rejects("http://10.0.0.5/", "private 10.x IPv4 must be rejected")
  await rejects("http://172.16.0.5/", "private 172.16-31.x IPv4 must be rejected")
  await rejects("http://192.168.1.5/", "private 192.168.x IPv4 must be rejected")
  await rejects("http://localhost/", "localhost hostname must be rejected")
  await rejects("http://[::1]/", "IPv6 loopback must be rejected")
  await rejects("ftp://example.com/", "non-http(s) scheme must be rejected")
  await rejects("file:///etc/passwd", "file scheme must be rejected")

  await resolves("https://demo.com/products/glow-serum", "public domain over https must be allowed")
  await resolves("http://93.184.216.34/", "public IPv4 literal must be allowed")

  console.log("URL safety guard tests passed.")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
