import { buildTranslationPrompt } from "../../../lib/ai/prompts"
import { generateNewsEnhancements } from "../../../lib/ai/news-enhancer"
import { callGeminiWithFallback } from "@/lib/gemini"
import { sanitizeReason } from "@/lib/ai/output"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const { text, tone = "formal", mode = "standard" } = await req.json()

    if (!text) {
      return Response.json({ error: "Text is required" }, { status: 400 })
    }

    // Gate news mode for Pro/trial users only
    if (mode === "news") {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return Response.json({ error: "News mode requires Pro" }, { status: 403 })
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_tier, is_trial_active, trial_ends_at, trial_used, trial_started_at")
        .eq("id", user.id)
        .maybeSingle()

      const tier = (profile?.subscription_tier || "free").toLowerCase()
      const isPro = tier === "pro"
      const now = new Date()
      const trialEnd = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null
      const trialStart = profile?.trial_started_at ? new Date(profile.trial_started_at) : null
      const isTrial =
        Boolean(profile?.is_trial_active && trialEnd && now <= trialEnd) ||
        (profile?.trial_used && trialStart && trialEnd && now <= trialEnd && tier !== "pro")

      if (!isPro && !isTrial) {
        return Response.json({ error: "News mode requires Pro" }, { status: 403 })
      }
    }

    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      // Return mock data for demo
      return Response.json({
        translation: tone === "friendly" ? "எப்படி இருக்கே?" : "எப்படி இருக்கிறீர்கள்?",
        reason: sanitizeReason(),
      })
    }

    const prompt = buildTranslationPrompt(text, tone, mode)

    const { data, model } = await callGeminiWithFallback(prompt, apiKey, {
      temperature: 0.5,
      maxOutputTokens: 400,
    })
    console.log("[translate] model used:", model)
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || ""

    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      let translation = parsed.translation || ""

      // Apply news-specific enhancements if in news mode
      if (mode === "news") {
        const enhancement = generateNewsEnhancements(translation)
        translation = enhancement.enhancedText
      }

      return Response.json({
        translation: translation,
        reason: sanitizeReason(parsed.reason),
        tone: parsed.tone || tone,
      })
    }

    return Response.json({ translation: "", reason: sanitizeReason() })
  } catch (error) {
    console.error("Translation error:", error)
    return Response.json({ error: "Failed to translate" }, { status: 500 })
  }
}
