import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { signCollaborationToken } from "@/lib/collaboration/tokens"
import { isSmtpConfigured, sendEmail } from "@/lib/email/send-email"

export const runtime = "nodejs"

function buildInviteLink(token: string) {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    "https://thamly.app"
  const trimmedBase = base.endsWith("/") ? base.slice(0, -1) : base
  return `${trimmedBase}/collab/join?token=${token}`
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const draftId = body?.draft_id as string | undefined
    const emailInput = (body?.email as string | undefined)?.toLowerCase().trim()

    if (!draftId || !emailInput || !emailInput.includes("@")) {
      return NextResponse.json({ error: "draft_id and email are required" }, { status: 400 })
    }

    // Ensure the requester owns the draft
    const { data: draft, error: draftError } = await supabase
      .from("drafts")
      .select("id")
      .eq("id", draftId)
      .eq("user_id", user.id)
      .single()

    if (draftError || !draft) {
      return NextResponse.json({ error: "Draft not found or unauthorized" }, { status: 403 })
    }

    // Either reset an existing invite or create a new one
    const { data: existingRows, error: existingError } = await supabase
      .from("draft_collaborators")
      .select("id,status")
      .eq("draft_id", draftId)
      .eq("collaborator_email", emailInput)
      .order("created_at", { ascending: false })
      .limit(1)

    if (existingError) {
      console.error("[Collab Invite] existing lookup failed", existingError)
      return NextResponse.json({ error: "Failed to create invite" }, { status: 500 })
    }

    const existing = existingRows?.[0]
    if (existing) {
      const { error } = await supabase
        .from("draft_collaborators")
        .update({
          status: "pending",
          collaborator_user_id: null,
          ended_at: null,
        })
        .eq("id", existing.id)
        .eq("owner_id", user.id)

      if (error) {
        console.error("[Collab Invite] failed to refresh invite", error)
        return NextResponse.json({ error: "Failed to refresh invite" }, { status: 500 })
      }
    } else {
      const { error } = await supabase.from("draft_collaborators").insert({
        draft_id: draftId,
        owner_id: user.id,
        collaborator_email: emailInput,
        status: "pending",
      } as any)

      if (error) {
        console.error("[Collab Invite] insert failed", error)
        return NextResponse.json({ error: "Failed to save invite" }, { status: 500 })
      }
    }

    const token = signCollaborationToken(
      { draft_id: draftId, email: emailInput },
      48,
    )
    const inviteLink = buildInviteLink(token)

    if (!isSmtpConfigured()) {
      return NextResponse.json(
        {
          error: "SMTP is not configured. Add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM to send invites.",
          inviteLink,
        },
        { status: 500 },
      )
    }

    try {
      await sendEmail({
        to: emailInput,
        subject: `${user.user_metadata?.full_name || user.email} invited you to collaborate in Thamly`,
        text: `You have been invited to collaborate on a draft in Thamly.\n\nOpen the draft: ${inviteLink}\n\nIf you did not expect this, you can ignore the message.`,
        html: `
          <p>You have been invited to collaborate on a draft in <strong>Thamly</strong>.</p>
          <p><a href="${inviteLink}" style="color:#0f766e;font-weight:600;">Open the draft</a></p>
          <p>If you did not expect this, you can safely ignore the email.</p>
        `,
      })
    } catch (error) {
      console.error("[Collab Invite] email send failed", error)
      return NextResponse.json(
        { error: "Failed to send invitation email. Copy and share the link manually.", inviteLink },
        { status: 500 },
      )
    }

    return NextResponse.json({ ok: true, inviteLink, emailSent: true })
  } catch (error) {
    console.error("[Collab Invite] error", error)
    return NextResponse.json({ error: "Unexpected error creating invite" }, { status: 500 })
  }
}
