import crypto from "crypto"
import { NextResponse } from "next/server"

import { USAGE_LIMITS } from "@/lib/constants"
import { createClient } from "@/lib/supabase/server"

const MAX_AUDIO_BYTES = 10 * 1024 * 1024 // ~10 MB
const STT_LIMITS = {
  free: Number(process.env.STT_DAILY_LIMIT_FREE ?? USAGE_LIMITS.free ?? 30),
  pro: Number(process.env.STT_DAILY_LIMIT_PRO ?? USAGE_LIMITS.pro ?? 2000),
  enterprise: Number(process.env.STT_DAILY_LIMIT_ENTERPRISE ?? USAGE_LIMITS.enterprise ?? Infinity),
}

export const runtime = "nodejs"

function getClientIp(req: Request) {
  const xff = req.headers.get("x-forwarded-for")
  if (xff) return xff.split(",")[0]?.trim() || "unknown"
  return req.headers.get("x-real-ip") || "unknown"
}

function todayUtcStartIso() {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString()
}

function mapTierToLimit(tier: string | null | undefined, trialActive: boolean, status?: string | null) {
  if (trialActive) return Infinity
  const normalized = (tier || "free").toLowerCase()
  if (normalized === "enterprise") return STT_LIMITS.enterprise
  if (normalized === "pro" || (status || "").toLowerCase() === "active") return STT_LIMITS.pro
  return STT_LIMITS.free
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sttUrl = process.env.STT_URL
    const sttKey = process.env.STT_API_KEY
    if (!sttUrl || !sttKey) {
      return NextResponse.json({ error: "STT provider not configured" }, { status: 500 })
    }

    const contentLengthHeader = req.headers.get("content-length")
    if (contentLengthHeader && Number(contentLengthHeader) > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error: "Audio too large" }, { status: 413 })
    }

    const formData = await req.formData().catch(() => null)
    if (!formData) {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
    }

    const audio = formData.get("audio") || formData.get("file")
    if (!audio || typeof (audio as any).arrayBuffer !== "function") {
      return NextResponse.json({ error: "No audio provided" }, { status: 400 })
    }

    const audioBlob = audio as Blob
    const audioSize = typeof (audioBlob as any).size === "number" ? (audioBlob as any).size : 0

    if (audioSize > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error: "Audio too large" }, { status: 413 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier, subscription_status, is_trial_active, trial_ends_at")
      .eq("id", user.id)
      .maybeSingle()

    const trialEnd = profile?.trial_ends_at ? new Date(profile.trial_ends_at as any) : null
    const trialActive = Boolean(profile?.is_trial_active && trialEnd && new Date() <= trialEnd)
    const sttLimit = mapTierToLimit(profile?.subscription_tier, trialActive, profile?.subscription_status)

    if (Number.isFinite(sttLimit)) {
      const { count: usedToday, error: countError } = await supabase
        .from("usage_logs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("action", "stt_transcribe")
        .gte("created_at", todayUtcStartIso())

      if (!countError && typeof usedToday === "number" && usedToday >= sttLimit) {
        return NextResponse.json(
          { error: "Daily STT limit reached", limit: sttLimit, remaining: 0 },
          { status: 429 },
        )
      }
    }

    const forward = new FormData()
    forward.append("file", audioBlob, "voice.webm")

    const sttRes = await fetch(sttUrl, {
      method: "POST",
      headers: {
        "x-api-key": sttKey,
      },
      body: forward,
    })

    let transcript = ""
    let rawText = ""

    try {
      const json = await sttRes.clone().json()
      transcript = (json?.text || json?.transcript || "").toString().trim()
    } catch {
      rawText = await sttRes.text().catch(() => "")
      transcript = rawText.trim()
    }

    if (!sttRes.ok) {
      const message = transcript || rawText || "Transcription failed"
      return NextResponse.json({ error: message }, { status: sttRes.status })
    }

    if (!transcript) {
      return NextResponse.json({ error: "Empty transcript" }, { status: 422 })
    }

    const tokensUsed = Math.max(1, Math.ceil(transcript.length / 4))
    const requestId = crypto.randomUUID()

    const { error: usageError } = await supabase.from("usage_logs").insert({
      user_id: user.id,
      action: "stt_transcribe",
      tokens_used: tokensUsed,
      request_id: requestId,
      ip: getClientIp(req),
      metadata: { provider: "stt_bridge", bytes: audioSize },
    } as any)

    if (usageError) {
      console.error("[stt bridge] usage log insert failed", usageError)
    }

    return NextResponse.json({ text: transcript, provider: "stt_bridge" })
  } catch (error) {
    console.error("[stt bridge] unexpected error", error)
    return NextResponse.json({ error: "Transcription failed" }, { status: 500 })
  }
}
