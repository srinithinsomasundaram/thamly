import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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
    if (!draftId) {
      return NextResponse.json({ error: "draft_id is required" }, { status: 400 })
    }

    const { data: draft, error: draftError } = await supabase
      .from("drafts")
      .select("id")
      .eq("id", draftId)
      .eq("user_id", user.id)
      .single()

    if (draftError || !draft) {
      return NextResponse.json({ error: "Only the owner can end collaboration" }, { status: 403 })
    }

    const attemptSoftEnd = await supabase
      .from("draft_collaborators")
      .update({
        status: "ended",
        ended_at: new Date().toISOString(),
      })
      .eq("draft_id", draftId)
      .eq("owner_id", user.id)
      .neq("status", "ended")

    let error = attemptSoftEnd.error

    if (error && typeof (error as any)?.message === "string") {
      const msg = (error as any).message.toLowerCase()
      const missingEndedAt = msg.includes("ended_at")
      if (missingEndedAt) {
        // Fallback if ended_at column is missing in this project
        const retry = await supabase
          .from("draft_collaborators")
          .update({ status: "ended" })
          .eq("draft_id", draftId)
          .eq("owner_id", user.id)
          .neq("status", "ended")
        error = retry.error
      }
    }

    if (error) {
      console.error("[Collab End] update failed", error)
      return NextResponse.json({ error: "Failed to end collaboration" }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[Collab End] error", error)
    return NextResponse.json({ error: "Unexpected error ending collaboration" }, { status: 500 })
  }
}
