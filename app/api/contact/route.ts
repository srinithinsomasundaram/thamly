"use server"

import { NextResponse } from "next/server"
import { sendEmail, isSmtpConfigured } from "@/lib/email/send-email"

const RECIPIENT = process.env.CONTACT_TO || "srinithinoffl@gmail.com"

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 })
    }

    const { fullName, email, phone, topic, message } = body as Record<string, string>
    if (!fullName || !email || !message) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 })
    }

    if (!isSmtpConfigured()) {
      return NextResponse.json({ ok: false, error: "SMTP not configured" }, { status: 500 })
    }

    const subject = `New contact form from ${fullName} (${topic || "General"})`
    const text = [
      `Name: ${fullName}`,
      `Email: ${email}`,
      `Phone: ${phone || "Not provided"}`,
      `Topic: ${topic || "Not provided"}`,
      "",
      "Message:",
      message,
    ].join("\n")

    await sendEmail({
      to: RECIPIENT,
      subject,
      text,
      html: `<p><strong>Name:</strong> ${fullName}</p>
             <p><strong>Email:</strong> ${email}</p>
             <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
             <p><strong>Topic:</strong> ${topic || "Not provided"}</p>
             <p><strong>Message:</strong><br/>${message?.replace(/\n/g, "<br/>")}</p>`,
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error("Contact API error", error)
    return NextResponse.json({ ok: false, error: "Failed to send message" }, { status: 500 })
  }
}
