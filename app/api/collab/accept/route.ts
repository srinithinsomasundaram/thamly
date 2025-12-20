import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { verifyCollaborationToken } from "@/lib/collaboration/tokens"

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
    const token = body?.token as string | undefined
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 })
    }

    const verification = verifyCollaborationToken(token)
    if (!verification.valid || !verification.payload) {
      const status = verification.reason === "Expired" ? 410 : 401
      return NextResponse.json({ error: verification.reason || "Invalid token" }, { status })
    }

    const inviteEmail = verification.payload.email.toLowerCase()
    const userEmail = (user.email || "").toLowerCase()
    if (inviteEmail !== userEmail) {
      return NextResponse.json({ error: "Email mismatch for this invite" }, { status: 403 })
    }

    const { data: inviteRows, error: inviteError } = await supabase
      .from("draft_collaborators")
      .select("id,status")
      .eq("draft_id", verification.payload.draft_id)
      .eq("collaborator_email", inviteEmail)
      .order("created_at", { ascending: false })
      .limit(1)

    if (inviteError) {
      console.error("[Collab Accept] fetch failed", inviteError)
      return NextResponse.json({ error: "Failed to verify invite" }, { status: 500 })
    }

    const invite = inviteRows?.[0]
    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 })
    }

    if (invite.status === "ended") {
      return NextResponse.json({ error: "Collaboration ended by owner" }, { status: 410 })
    }

    const { error: updateError } = await supabase
      .from("draft_collaborators")
      .update({
        collaborator_user_id: user.id,
        status: "accepted",
      })
      .eq("id", invite.id)

    if (updateError) {
      console.error("[Collab Accept] update failed", updateError)
      return NextResponse.json({ error: "Failed to accept invite" }, { status: 500 })
    }

    return NextResponse.json({ ok: true, draftId: verification.payload.draft_id })
  } catch (error) {
    console.error("[Collab Accept] error", error)
    return NextResponse.json({ error: "Unexpected error accepting invite" }, { status: 500 })
  }
}
