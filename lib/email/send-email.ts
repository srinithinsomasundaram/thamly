import nodemailer from "nodemailer"

type SendEmailPayload = {
  to: string
  subject: string
  text: string
  html?: string
}

const REQUIRED_ENV = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"] as const

const missingEnvVars = () => REQUIRED_ENV.filter((key) => !process.env[key] || process.env[key] === "")

export const isSmtpConfigured = () => missingEnvVars().length === 0

export async function sendEmail({ to, subject, text, html }: SendEmailPayload) {
  const missing = missingEnvVars()
  if (missing.length > 0) {
    throw new Error(`Missing SMTP env vars: ${missing.join(", ")}`)
  }

  const port = Number(process.env.SMTP_PORT)
  const secure = port === 465

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  return transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    text,
    html,
  })
}
