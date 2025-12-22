import crypto from "crypto"
import { NextResponse } from "next/server"

import { USAGE_LIMITS } from "@/lib/constants"
import { createClient } from "@/lib/supabase/server"
import { callGeminiWithFallback } from "@/lib/gemini"

type Mode = "standard" | "news" | "blog" | "academic" | "email"

const ALLOWED_MODES: Mode[] = ["standard", "news", "blog", "academic", "email"]
const MAX_INPUT_LENGTH = 1800
const SUBSCRIPTION_ACTIVE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000 // 30 days after last update

function detectLanguage(text: string): "tam" | "eng" | "mixed" | "thanglish" {
  const tamilChars = (text.match(/[\u0B80-\u0BFF]/g) || []).length
  const asciiChars = (text.match(/[A-Za-z]/g) || []).length
  const total = Math.max(text.length, 1)

  const tamilRatio = tamilChars / total
  const asciiRatio = asciiChars / total

  if (tamilRatio > 0.8) return "tam"
  const phoneticWords = ["epdi", "epadi", "vanga", "vanakkam", "sapadu", "ennada", "irukinga", "seri", "venum"]
  const romanWords = text.split(/\s+/).filter((w) => /^[A-Za-z']+$/.test(w))
  const phoneticHits = romanWords.filter((w) => phoneticWords.some((p) => w.toLowerCase().includes(p)))

  if (asciiRatio > 0.6 && phoneticHits.length === 0) return "eng"
  if (phoneticHits.length / Math.max(romanWords.length, 1) > 0.5) return "thanglish"
  return "mixed"
}

function mapTierToLimit(tier: string | null | undefined, trialActive: boolean) {
  // Trial and paid should remain unlimited; free has a daily cap
  if (trialActive) return Infinity
  const normalized = (tier || "free").toLowerCase()
  if (normalized === "pro") return Infinity
  if (normalized === "enterprise") return USAGE_LIMITS.enterprise
  if (normalized === "trial") return Infinity
  return USAGE_LIMITS.free
}

function getTodayDateString() {
  return new Date().toISOString().slice(0, 10)
}

function getClientIp(req: Request) {
  const xff = req.headers.get("x-forwarded-for")
  if (xff) return xff.split(",")[0].trim()
  return req.headers.get("x-real-ip") || "unknown"
}

function buildPrompt(input: string, mode: Mode, language: string) {
  const modeInstruction =
    mode === "news"
      ? "Rewrite like a professional Tamil news reporter. Keep neutral tone, tight sentences, and compact numbers."
      : mode === "academic"
        ? "Rewrite in academic Tamil with clear structure and formal vocabulary."
        : mode === "email"
          ? "Rewrite as a concise, polite email in Tamil."
          : mode === "blog"
            ? "Rewrite in a clear, reader-friendly blog tone."
            : "Fix grammar, spelling, clarity, and provide a natural Tamil rendering."

  return `
You are Thamly, a Tamil-first AI writing partner. Input may be English, Tanglish, or Tamil.

Task:
1) Detect language of the input (tam | eng | mixed | thanglish).
2) Produce a JSON response only, no markdown. Use this shape:
{
  "input": "...",
  "language": "tam|eng|mixed|thanglish",
  "best": "single best improved Tamil output",
  "translation": { "tamil": "Tamil translation/rewrite", "english": "English if input was Tamil" },
  "spelling": { "corrected": "spelling-fixed text" },
  "grammar": { "corrected": "grammar-fixed text" },
  "tone": { "formal": "formal option", "news": "news option" },
  "score": 72,
  "explanations": ["brief reason 1", "brief reason 2"]
}

Rules:
- Focus on Tamil correctness, clarity, and the requested mode: ${modeInstruction}
- Keep responses concise; avoid bullet lists.
- Always return valid JSON only.

Input (${language}): """${input}"""
`
}

function parseGeminiJson(raw: string) {
  const direct = raw.trim()
  const match = direct.match(/\{[\s\S]*\}/)
  const jsonCandidate = match ? match[0] : direct
  try {
    return JSON.parse(jsonCandidate)
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    const rawText = typeof body?.text === "string" ? body.text : ""
    const mode: Mode = ALLOWED_MODES.includes(body?.mode) ? body.mode : "standard"

    const text = rawText.trim().slice(0, MAX_INPUT_LENGTH)
    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch or initialize profile for usage tracking
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("id, subscription_tier, subscription_status, subscription_updated_at, usage_count, usage_reset_at, email, trial_started_at, trial_ends_at, is_trial_active, trial_used")
      .eq("id", user.id)
      .maybeSingle()

    if (!profileRow) {
      const fallbackEmail = user.email || `${user.id}@placeholder.thamly`
      const { error: createProfileError } = await supabase
        .from("profiles")
        .insert({ id: user.id, email: fallbackEmail, subscription_tier: "free" })
      if (createProfileError) {
        console.error("[Unified AI] failed to seed profile", createProfileError)
      }
    }

    let usageCount = profileRow?.usage_count ?? 0
    const today = getTodayDateString()
    const resetDate = profileRow?.usage_reset_at
      ? new Date(profileRow.usage_reset_at as any).toISOString().slice(0, 10)
      : today

    if (resetDate !== today) {
      usageCount = 0
      await supabase
        .from("profiles")
        .update({ usage_count: 0, usage_reset_at: today })
        .eq("id", user.id)
    }

    const trialStart = profileRow?.trial_started_at ? new Date(profileRow.trial_started_at as any) : null
    const trialEnd = profileRow?.trial_ends_at ? new Date(profileRow.trial_ends_at as any) : null
    const now = new Date()
    const trialExpired = Boolean(trialEnd && now > trialEnd)
    let trialActive =
      (profileRow as any)?.is_trial_active === true && trialEnd && now <= trialEnd
        ? true
        : Boolean((profileRow as any)?.trial_used && trialStart && trialEnd && now <= trialEnd && (profileRow?.subscription_tier || "free") !== "pro")

    const subscriptionUpdatedAt = profileRow?.subscription_updated_at ? new Date(profileRow.subscription_updated_at as any) : null
    const subscriptionEndsAt =
      profileRow?.subscription_status === "active" && subscriptionUpdatedAt
        ? new Date(subscriptionUpdatedAt.getTime() + SUBSCRIPTION_ACTIVE_WINDOW_MS)
        : null
    const subscriptionActive = Boolean(subscriptionEndsAt && subscriptionEndsAt >= now)

    let normalizedTier = (profileRow?.subscription_tier || "free").toLowerCase()
    const hasPaidSubscription = subscriptionActive || normalizedTier === "pro"
    const needsTrialCleanup = trialExpired
    const needsExpiredSubCleanup = normalizedTier === "pro" && !subscriptionActive

    if (needsTrialCleanup || needsExpiredSubCleanup) {
      trialActive = false
      const updates: Record<string, any> = {
        is_trial_active: false,
        subscription_updated_at: (subscriptionUpdatedAt || new Date()).toISOString(),
      }

      if (needsTrialCleanup && hasPaidSubscription) {
        normalizedTier = "pro"
        updates.subscription_tier = "pro"
        updates.subscription_status = "active"
      } else if (needsTrialCleanup && !hasPaidSubscription) {
        normalizedTier = "free"
        updates.subscription_tier = "free"
        updates.subscription_status = "inactive"
      }

      if (needsExpiredSubCleanup) {
        normalizedTier = "free"
        updates.subscription_tier = "free"
        updates.subscription_status = "inactive"
      }

      const { error: stateUpdateError } = await supabase.from("profiles").update(updates).eq("id", user.id)
      if (stateUpdateError) {
        console.error("[Unified AI] failed to sync subscription state", stateUpdateError)
      }
    }

    const limit = mapTierToLimit(normalizedTier, trialActive)
    if (Number.isFinite(limit) && usageCount >= limit) {
      return NextResponse.json(
        {
          error: "Daily AI limit reached",
          code: "USAGE_LIMIT_EXCEEDED",
          limit,
          remaining: 0,
        },
        { status: 429 },
      )
    }

    const language = detectLanguage(text)
    const requestId = crypto.randomUUID()
    const ip = getClientIp(req)

    const baseResponse = {
      input: text,
      mode,
      language,
      best: "",
      translation: { tamil: "", english: "" },
      spelling: { corrected: "" },
      grammar: { corrected: "" },
      tone: { formal: "", news: "" },
      score: 85,
      explanations: [] as string[],
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      const fallback = {
        ...baseResponse,
        best: text,
        translation: { tamil: language === "tam" ? text : "AI demo: Tamil translation unavailable", english: "" },
        spelling: { corrected: text },
        grammar: { corrected: text },
        explanations: ["GEMINI_API_KEY missing, returning input as-is."],
      }
      return NextResponse.json(fallback, { status: 200 })
    }

    const prompt = buildPrompt(text, mode, language)
    const { data, model } = await callGeminiWithFallback(prompt, apiKey, {
      temperature: 0.4,
      maxOutputTokens: 512,
    })
    console.log("[ai/unified] model used:", model)
    const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text || ""
    const parsed = parseGeminiJson(aiText) || {}

    const responseBody = {
      ...baseResponse,
      input: parsed.input || text,
      language: (parsed.language as string) || language,
      best: parsed.best || parsed.translation?.tamil || parsed.grammar?.corrected || text,
      translation: {
        tamil: parsed.translation?.tamil || parsed.translation || "",
        english: parsed.translation?.english || "",
      },
      spelling: {
        corrected: parsed.spelling?.corrected || parsed.spelling || parsed.best || text,
      },
      grammar: {
        corrected: parsed.grammar?.corrected || parsed.best || text,
      },
      tone: {
        formal: parsed.tone?.formal || "",
        news: parsed.tone?.news || "",
      },
      score: Number(parsed.score) > 0 ? Math.min(Number(parsed.score), 100) : baseResponse.score,
      explanations: Array.isArray(parsed.explanations) ? parsed.explanations : baseResponse.explanations,
    }

    // Log usage (best-effort; don't block response on failure)
    const tokensUsed = Math.max(1, Math.ceil(text.length / 4))
    const newUsageCount = usageCount + 1

    const { error: usageError } = await supabase
      .from("usage_logs")
      .insert({
        user_id: user.id,
        action: "ai_unified",
        tokens_used: tokensUsed,
        request_id: requestId,
        ip,
        metadata: { mode, language: responseBody.language, score: responseBody.score },
      } as any)
    if (usageError) {
      console.error("[Unified AI] usage log insert failed", usageError)
    }

    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update({ usage_count: newUsageCount, usage_reset_at: today })
      .eq("id", user.id)
    if (profileUpdateError) {
      console.error("[Unified AI] profile usage update failed", profileUpdateError)
    }

    return NextResponse.json(responseBody, { status: 200 })
  } catch (error) {
    console.error("[Unified AI] unexpected error", error)
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 })
  }
}
