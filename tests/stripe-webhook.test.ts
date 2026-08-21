import assert from "node:assert/strict"
import { shouldCreditInvoicePaid } from "../lib/stripe-webhook"

assert.equal(shouldCreditInvoicePaid({ billing_reason: "subscription_create" }), false)
assert.equal(shouldCreditInvoicePaid({ billing_reason: "subscription_cycle" }), true)
assert.equal(shouldCreditInvoicePaid({ billing_reason: null }), true)
assert.equal(shouldCreditInvoicePaid(undefined), true)

console.log("stripe webhook tests passed")
