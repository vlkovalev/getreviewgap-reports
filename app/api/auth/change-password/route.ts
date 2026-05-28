import { NextRequest, NextResponse } from "next/server"
import { getCurrentCustomer } from "@/lib/customer-session"
import { validateCustomerPasswordById, updateCustomerPassword } from "@/lib/customer-store"

export async function POST(request: NextRequest) {
  try {
    const customer = await getCurrentCustomer()
    if (!customer) {
      return NextResponse.json({ error: "Unauthorized", details: "You must be signed in to change your password." }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Bad Request", details: "Current password and new password are required." }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Bad Request", details: "New password must be at least 6 characters long." }, { status: 400 })
    }

    const isValid = await validateCustomerPasswordById(customer.id, currentPassword)
    if (!isValid) {
      return NextResponse.json({ error: "Forbidden", details: "The current password you entered is incorrect." }, { status: 403 })
    }

    const updated = await updateCustomerPassword(customer.id, newPassword)
    if (!updated) {
      return NextResponse.json({ error: "Internal Server Error", details: "Failed to update your password. Please try again." }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Password updated successfully." })
  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error", details: error.message || "An unexpected error occurred." }, { status: 500 })
  }
}
