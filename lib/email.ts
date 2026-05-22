import { Resend } from "resend"

let resend: Resend | null = null

function getResend() {
  if (!process.env.RESEND_API_KEY) return null
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY)
  return resend
}

export async function sendEmail(input: { to: string; subject: string; html: string }) {
  const client = getResend()
  if (!client) return { skipped: true }

  await client.emails.send({
    from: process.env.EMAIL_FROM || "ReviewIntel Reports <hello@example.com>",
    ...input
  })

  return { skipped: false }
}

export function leadConfirmationHtml(name: string) {
  return `<p>Hi ${name},</p><p>Thanks for requesting the ReviewIntel sample report. We will send the resource and next steps shortly.</p>`
}

export function inquiryConfirmationHtml(name: string) {
  return `<p>Hi ${name},</p><p>Thanks for contacting ReviewIntel Reports. We received your inquiry and will reply soon.</p>`
}
