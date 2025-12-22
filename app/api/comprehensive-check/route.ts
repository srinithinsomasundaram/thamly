import { NextResponse } from "next/server"
import { buildUnifiedPrompt } from "../../../lib/ai/prompts"
import { enhanceForNewsTone } from "../../../lib/ai/news-enhancer"
import { callGeminiWithFallback } from "@/lib/gemini"

function extractJson(text: string) {
  if (!text) return null
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim()
  try {
    return JSON.parse(cleaned)
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        return JSON.parse(match[0])
      } catch {
        return null
      }
    }
    return null
  }
}

function extractBestFallback(text: string) {
  if (!text) return ""
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim()
  // Try to grab "best": "<text>" across lines
  const bestMatch = cleaned.match(/"best"\s*:\s*"([\s\S]*?)"/)
  if (bestMatch?.[1]) {
    return bestMatch[1].trim()
  }
  // If response is missing the closing quote, grab everything after "best":
  const looseMatch = cleaned.match(/"best"\s*:\s*"([\s\S]*)/)
  if (looseMatch?.[1]) {
    return looseMatch[1].trim()
  }
  // Fallback to cleaned text minus braces
  return cleaned.replace(/^{/, "").replace(/}$/, "").trim()
}

function normalizeResult(input: string, parsed: any, tone: string, bestFallback: string) {
  const base = {
    best: bestFallback || input,
    translation: "",
    grammar: "",
    tone: tone || "formal",
    spelling: "",
    score: 50,
    hint: "Fallback applied",
  }

  if (!parsed || typeof parsed !== "object") return base

  return {
    best: typeof parsed.best === "string" && parsed.best.trim() ? parsed.best.trim() : base.best,
    translation: typeof parsed.translation === "string" ? parsed.translation : "",
    grammar: typeof parsed.grammar === "string" ? parsed.grammar : "",
    tone: typeof parsed.tone === "string" && parsed.tone.trim() ? parsed.tone : base.tone,
    spelling: typeof parsed.spelling === "string" ? parsed.spelling : "",
    score: typeof parsed.score === "number" ? parsed.score : base.score,
    hint: typeof parsed.hint === "string" && parsed.hint.trim() ? parsed.hint : base.hint,
  }
}

export async function POST(req: Request) {
  try {
    const { text, context = "", selectedWord = "", tone = "formal", mode = "standard" } = await req.json()

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ success: false, error: "Text is required" }, { status: 400 })
    }

    // Mock response when no API key
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        success: true,
        result: {
          type: "grammar",
          original: text,
          suggestions: [`[Demo] ${text}`],
          reason: "Gemini API key not set. This is a demo grammar fix.",
          position: 0,
        },
      })
    }

    const prompt = buildUnifiedPrompt(text, tone, mode)
    const { data, model } = await callGeminiWithFallback(prompt, process.env.GEMINI_API_KEY, {
      temperature: 0.2,
      topP: 0.9,
      maxOutputTokens: 256,
    })
    console.log("[comprehensive-check] model used:", model)
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || ""

    const parsed: any = extractJson(content)
    const bestFallbackRaw = parsed?.best || extractBestFallback(content)
    const bestFallback = bestFallbackRaw && bestFallbackRaw.length > 6 ? bestFallbackRaw : text
    if (!parsed) {
      console.warn("[comprehensive-check] unstructured response, using fallback text")
    }

    // Handle different response formats based on mode
    if (mode === "news") {
      // News mode returns structured format: headline, news, caption, keywords
      if (parsed?.headline || parsed?.news) {
        // Apply TNWS enhancements to the news content
        const enhancedNews = parsed.news ? enhanceForNewsTone(parsed.news) : ""

        return NextResponse.json({
          success: true,
          result: {
            type: "news",
            headline: parsed.headline || "",
            news: enhancedNews,
            caption: parsed.caption || "",
            keywords: parsed.keywords || [],
            original: text,
            reason: parsed.hint || "Converted to professional news format.",
          },
        })
      }
      // If news parse fails, gracefully downgrade to grammar suggestion
    } else {
      // Standard mode
      if (parsed?.best) {
        const normalized = normalizeResult(text, parsed, tone, bestFallback)

        return NextResponse.json({
          success: true,
          result: {
            type: "grammar",
            original: text,
            suggestions: [normalized.best],
            reason: normalized.hint || "Improved for grammar, tone, and spelling.",
            position: 0,
          },
        })
      }
    }

    const normalized = normalizeResult(text, parsed, tone, bestFallback)

    // Fallback: return best-effort suggestion instead of 500
    const fallbackSuggestion = normalized.best || text
    return NextResponse.json({
      success: true,
      result: {
        type: "grammar",
        original: text,
        suggestions: [fallbackSuggestion],
        reason: normalized.hint || "AI response was unstructured; returning best-effort correction.",
        position: 0,
      },
      warning: "AI response could not be fully parsed; used fallback text.",
    })
  } catch (error) {
    console.error("Comprehensive check error:", error)
    return NextResponse.json({ success: false, error: "Failed to analyze text" }, { status: 500 })
  }
}
