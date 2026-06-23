import assert from "node:assert/strict"
import { createCustomer, validateCustomerPasswordById } from "../lib/customer-store"
import { createPasswordResetToken, resetPasswordWithToken } from "../lib/password-reset"

async function main() {
  console.log("Starting password reset tests...")

  const email = `reset-${Date.now()}@reviewgap.test`
  const oldPassword = "oldPassword123"
  const newPassword = "newPassword456"
  const customer = await createCustomer(email, oldPassword)
  assert.ok(customer, "Customer should be created for reset test")

  const missingToken = await createPasswordResetToken(`missing-${Date.now()}@reviewgap.test`)
  assert.equal(missingToken, null, "Unknown email should not create a token")

  const token = await createPasswordResetToken(email)
  assert.ok(token, "Known customer should receive a reset token")

  const invalidReset = await resetPasswordWithToken(`${token}-wrong`, newPassword)
  assert.equal(invalidReset, false, "Invalid token should not reset password")
  assert.equal(await validateCustomerPasswordById(customer.id, oldPassword), true, "Old password should still work after invalid token")

  const resetOk = await resetPasswordWithToken(token, newPassword)
  assert.equal(resetOk, true, "Valid token should reset password")
  assert.equal(await validateCustomerPasswordById(customer.id, oldPassword), false, "Old password should stop working")
  assert.equal(await validateCustomerPasswordById(customer.id, newPassword), true, "New password should work")

  const reuseOk = await resetPasswordWithToken(token, "thirdPassword789")
  assert.equal(reuseOk, false, "Reset token should be single-use")
  assert.equal(await validateCustomerPasswordById(customer.id, newPassword), true, "Password should remain unchanged after token reuse")

  console.log("Password reset tests passed successfully.")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
