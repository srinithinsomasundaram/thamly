import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

const missingEnv = (key: string) => !process.env[key] || process.env[key] === ""

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const to = body?.to || process.env.SMTP_USER
    const subject = body?.subject || "SMTP working 🚀"
    const text = body?.text || "Your SMTP setup is successful!"

    if (missingEnv("SMTP_HOST") || missingEnv("SMTP_PORT") || missingEnv("SMTP_USER") || missingEnv("SMTP_PASS") || missingEnv("SMTP_FROM")) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing SMTP env vars (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM)",
        },
        { status: 400 },
      )
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

    try {
      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to,
        subject,
        text,
      })

      return NextResponse.json({
        ok: true,
        messageId: info.messageId,
        envelope: info.envelope,
        accepted: info.accepted,
        rejected: info.rejected,
        response: info.response,
      })
    } catch (error: any) {
      console.error("[SMTP Debug] send error", error)
      return NextResponse.json(
        {
          ok: false,
          error: error?.message || "Failed to send",
          code: error?.code,
          response: error?.response,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("[SMTP Debug] unexpected error", error)
    return NextResponse.json({ ok: false, error: "Unexpected error" }, { status: 500 })
  }
}
