import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const ACTIONS = ["translation", "grammar", "spelling", "improvement"] as const
type Action = (typeof ACTIONS)[number]

function getTodayUtcStart() {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0)).toISOString()
}

type UsageCounts = {
  translation: number
  grammar: number
  spelling: number
  improvement: number
  total: number
}

async function fetchCounts(userId: string): Promise<UsageCounts> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("usage_logs")
    .select("action")
    .eq("user_id", userId)
    .gte("created_at", getTodayUtcStart())

  if (error) throw error

  const counts: UsageCounts = {
    translation: 0,
    grammar: 0,
    spelling: 0,
    improvement: 0,
    total: 0,
  }

  data?.forEach((row) => {
    const action = (row as any).action as Action
    if (ACTIONS.includes(action)) {
      counts[action] += 1
      counts.total += 1
    }
  })
  return counts
}

async function syncProfileUsage(userId: string, counts: UsageCounts) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("profiles")
    .update({
      usage_count: counts.total,
      usage_reset_at: new Date().toISOString(),
    })
    .eq("id", userId)
  if (error) {
    console.error("[AI Usage] failed to sync profile usage", error)
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const counts = await fetchCounts(user.id)
    await syncProfileUsage(user.id, counts)

    return NextResponse.json({
      counts,
    })
  } catch (error) {
    console.error("[AI Usage] GET error", error)
    return NextResponse.json({ error: "Failed to fetch usage" }, { status: 500 })
  }
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
    const action = body?.action as Action
    if (!ACTIONS.includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const { error } = await supabase.from("usage_logs").insert({
      user_id: user.id,
      action,
      metadata: { source: "editor" },
    } as any)
    if (error) {
      console.error("[AI Usage] insert error", error)
    }

    const counts = await fetchCounts(user.id)
    await syncProfileUsage(user.id, counts)

    return NextResponse.json({
      counts,
    })
  } catch (error) {
    console.error("[AI Usage] POST error", error)
    return NextResponse.json({ error: "Failed to record usage" }, { status: 500 })
  }
}
