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

const STT_MODEL = process.env.STT_MODEL || "whisper-1"
const SELF_HOSTED_STT_URL = process.env.LOCAL_STT_URL || process.env.STT_SERVICE_URL
const openaiKey = process.env.OPENAI_API_KEY

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

function pickFileName(contentType: string) {
  if (contentType.includes("wav")) return "audio.wav"
  if (contentType.includes("mp4")) return "audio.mp4"
  if (contentType.includes("mpeg")) return "audio.mp3"
  if (contentType.includes("ogg")) return "audio.ogg"
  return "audio.webm"
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

    const contentLengthHeader = req.headers.get("content-length")
    if (contentLengthHeader && Number(contentLengthHeader) > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error: "Audio too large" }, { status: 413 })
    }

    const contentType = req.headers.get("content-type") || "application/octet-stream"
    const bodyBuffer = Buffer.from(await req.arrayBuffer())

    if (!bodyBuffer.byteLength) {
      return NextResponse.json({ error: "No audio received" }, { status: 400 })
    }

    if (bodyBuffer.byteLength > MAX_AUDIO_BYTES) {
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

    let transcript = ""
    let provider = ""

    if (openaiKey) {
      const formData = new FormData()
      const uint8 = new Uint8Array(bodyBuffer)
      formData.append("file", new File([uint8], pickFileName(contentType), { type: contentType }))
      formData.append("model", STT_MODEL)
      formData.append("language", "ta")

      const resp = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
        },
        body: formData,
      })

      if (!resp.ok) {
        const errText = await resp.text().catch(() => "OpenAI STT error")
        console.error("[stt] OpenAI provider failed", resp.status, errText)
        return NextResponse.json({ error: "Transcription failed" }, { status: 502 })
      }

      const data = (await resp.json().catch(() => ({}))) as { text?: string }
      transcript = (data.text || "").trim()
      provider = `openai:${STT_MODEL}`
    } else if (SELF_HOSTED_STT_URL) {
      const uint8 = new Uint8Array(bodyBuffer)
      const resp = await fetch(SELF_HOSTED_STT_URL, {
        method: "POST",
        headers: { "Content-Type": contentType },
        body: uint8,
      })

      if (!resp.ok) {
        const text = await resp.text().catch(() => "STT provider error")
        console.error("[stt] self-hosted provider failed", resp.status, text)
        return NextResponse.json({ error: "Transcription failed" }, { status: 502 })
      }

      const data = await resp.json().catch(() => ({}))
      transcript = (data.text || data.transcript || "").trim()
      provider = "self_hosted"
    } else {
      return NextResponse.json({ error: "No STT provider configured" }, { status: 500 })
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
      metadata: { provider, bytes: bodyBuffer.byteLength },
    } as any)

    if (usageError) {
      console.error("[stt] usage log insert failed", usageError)
    }

    return NextResponse.json({ text: transcript, provider })
  } catch (error) {
    console.error("[stt] unexpected error", error)
    return NextResponse.json({ error: "Transcription failed" }, { status: 500 })
  }
}
