import { NextResponse } from "next/server"
import { sendEmail, isSmtpConfigured } from "@/lib/email/send-email"

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const email = typeof body?.email === "string" ? body.email.trim() : ""
    const name = typeof body?.name === "string" ? body.name.trim() : ""

    if (!email) {
      return NextResponse.json({ ok: false, error: "Email is required" }, { status: 400 })
    }

    if (!isSmtpConfigured()) {
      return NextResponse.json({ ok: false, error: "SMTP not configured" }, { status: 500 })
    }

    const siteUrl ="https://thamly.in"

    const editorUrl = `${siteUrl}/editor`
    const draftsUrl = `${siteUrl}/drafts`

    const safeName = name || "there"

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to Thamly</title>
</head>
<body style="margin:0; padding:0; background-color:#f3f6f6; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0"
          style="max-width:520px; background:#ffffff; border-radius:14px; box-shadow:0 12px 30px rgba(0,0,0,0.06); padding:40px;">
          
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <h2 style="margin:0; font-size:22px; color:#0f2f2e;">
                Welcome to Thamly, ${safeName || "there"}
              </h2>
            </td>
          </tr>

          <tr>
            <td style="color:#374151; font-size:15px; line-height:1.6;">
              <p style="margin:0 0 12px 0;">Start writing Tamil with AI—grammar fixes, transliteration, and news tone in one editor.</p>
              <ul style="margin:0 0 18px 18px; padding:0; color:#374151; font-size:15px; line-height:1.6;">
                <li>Type English/Tanglish, get clean Tamil instantly.</li>
                <li>News Mode: sentence-by-sentence edits, neutral tone.</li>
                <li>Grammar + spelling checks built for Tamil.</li>
              </ul>
              <p style="margin:0 0 20px 0;">Click the button below to start a draft.</p>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding-bottom:24px;">
              <a href="${draftsUrl}"
                 style="
                   display:inline-block;
                   padding:14px 30px;
                   background:#08383b;
                   color:#ffffff;
                   text-decoration:none;
                   border-radius:10px;
                   font-weight:600;
                   font-size:15px;
                 ">
                Start writing
              </a>
            </td>
          </tr>

          <tr>
            <td style="color:#6b7280; font-size:13px; line-height:1.6;">
              <p style="margin:0 0 8px 0;">If the button doesn’t work, copy and paste this link:</p>
              <p style="word-break:break-all; margin:0;">
                <a href="${draftsUrl}" style="color:#08383b; text-decoration:none;">${draftsUrl}</a>
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding-top:32px; color:#9ca3af; font-size:12px; text-align:center;">
              <p style="margin:0;">Need help? Reply to this email anytime. If you didn’t create an account, you can ignore this.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

    const text = `Hi ${safeName},

Start writing Tamil with AI—grammar fixes, transliteration, and news tone in one editor.

Start writing: ${draftsUrl}

- Type English/Tanglish, get clean Tamil.
- News Mode: neutral, sentence-by-sentence edits.
- Grammar + spelling checks built for Tamil.

If the button doesn’t work, copy the link above.

Need help? Reply to this email. If you didn’t create an account, ignore this.`

    await sendEmail({
      to: email,
      subject: "Welcome to Thamly — start writing in Tamil",
      text,
      html,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[welcome email] error", error)
    return NextResponse.json({ ok: false, error: "Failed to send welcome" }, { status: 500 })
  }
}
