export function shouldCreditInvoicePaid(invoice: { billing_reason?: string | null } | undefined) {
  return invoice?.billing_reason !== "subscription_create"
}
