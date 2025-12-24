import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

const NEWS_TEMPLATE = `📰 News Draft Template

Headline (single line):

Lead (1–2 sentences):

Body (facts and quotes):
- What happened
- Where/When
- Who is involved
- Impact / next steps
`

const COLUMN_ERROR = (error: any) => {
  const msg = (error?.message || "").toLowerCase()
  return msg.includes("column") && (msg.includes("mode") || msg.includes("source_draft_id"))
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const title = typeof body?.title === "string" && body.title.trim().length > 0 ? body.title.trim() : "News Draft"
    const sourceDraftId = typeof body?.sourceDraftId === "string" ? body.sourceDraftId : null

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const basePayload: Record<string, any> = {
      user_id: user.id,
      status: "draft",
      title,
      content: NEWS_TEMPLATE,
      mode: "news",
    }

    if (sourceDraftId) {
      basePayload.source_draft_id = sourceDraftId
    }

    let insert = await (supabase as any).from("drafts").insert(basePayload as any).select().single()

    if (insert.error && COLUMN_ERROR(insert.error)) {
      // Fallback if columns are missing (mode/source_draft_id not present in drafts)
      const { mode, source_draft_id, ...payload } = basePayload
      insert = await (supabase as any).from("drafts").insert(payload as any).select().single()
    }

    if (insert.error || !insert.data?.id) {
      console.error("[news/draft] create failed", insert.error)
      return NextResponse.json({ error: "Failed to create news draft" }, { status: 500 })
    }

    return NextResponse.json({
      id: insert.data.id,
      draft: insert.data,
      content: NEWS_TEMPLATE,
    })
  } catch (error) {
    console.error("[news/draft] unexpected error", error)
    return NextResponse.json({ error: "Failed to create news draft" }, { status: 500 })
  }
}
