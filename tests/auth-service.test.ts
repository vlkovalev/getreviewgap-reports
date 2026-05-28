import assert from "node:assert/strict"
import { createCustomer, validateCustomerPasswordById, updateCustomerPassword, findCustomerByEmail } from "../lib/customer-store"

async function main() {
  console.log("Starting authentication & settings service tests...")

  // Generate a unique test email to avoid colliding with other memory tests
  const testEmail = `test-settings-${Date.now()}@reviewgap.test`
  const initialPassword = "securePassword123"

  // 1. Create a test customer
  const customer = await createCustomer(testEmail, initialPassword)
  assert.ok(customer, "Customer should be successfully created")
  assert.equal(customer.email, testEmail, "Customer email should match normalized input")

  // 2. Validate current password works
  const isValidOriginal = await validateCustomerPasswordById(customer.id, initialPassword)
  assert.equal(isValidOriginal, true, "Initial password should be valid")

  // 3. Validate incorrect password fails
  const isInvalidCheck = await validateCustomerPasswordById(customer.id, "wrongPassword")
  assert.equal(isInvalidCheck, false, "Incorrect password should fail validation")

  // 4. Update the password
  const newPassword = "newSuperSecurePassword456"
  const updateSuccess = await updateCustomerPassword(customer.id, newPassword)
  assert.equal(updateSuccess, true, "Password update should return true on success")

  // 5. Verify the old password no longer works
  const isValidOldAfterChange = await validateCustomerPasswordById(customer.id, initialPassword)
  assert.equal(isValidOldAfterChange, false, "Old password should no longer be valid after change")

  // 6. Verify the new password now works
  const isValidNewAfterChange = await validateCustomerPasswordById(customer.id, newPassword)
  assert.equal(isValidNewAfterChange, true, "New password should be valid after change")

  // 7. Double check invalid user ID fails
  const isInvalidUserCheck = await validateCustomerPasswordById("fake-user-id", "somePassword")
  assert.equal(isInvalidUserCheck, false, "Invalid user ID should return false")

  console.log("Authentication & settings service tests passed successfully.")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
