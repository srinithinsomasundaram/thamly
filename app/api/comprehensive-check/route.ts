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
  // Try to grab "best": "<text>"
  const bestMatch = cleaned.match(/"best"\s*:\s*"([^"]+)/)
  if (bestMatch?.[1]) {
    return bestMatch[1].trim()
  }
  // Fallback to cleaned text minus braces
  return cleaned.replace(/^{/, "").replace(/}$/, "").trim()
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
      temperature: 0.4,
      maxOutputTokens: 400,
    })
    console.log("[comprehensive-check] model used:", model)
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || ""

    const parsed: any = extractJson(content)
    if (!parsed) {
      console.error("Failed to parse comprehensive-check response:", content)
    }
    const bestFallback = parsed?.best || extractBestFallback(content)

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
        let enhancedText = parsed.best

        return NextResponse.json({
          success: true,
          result: {
            type: "grammar",
            original: text,
            suggestions: [enhancedText],
            reason: parsed.hint || "Improved for grammar, tone, and spelling.",
            position: 0,
          },
        })
      }
    }

    // Fallback: return best-effort suggestion instead of 500
    const fallbackSuggestion = bestFallback || text
    return NextResponse.json({
      success: true,
      result: {
        type: "grammar",
        original: text,
        suggestions: [fallbackSuggestion],
        reason: parsed?.hint || "AI response was unstructured; returning best-effort correction.",
        position: 0,
      },
      warning: "AI response could not be fully parsed; used fallback text.",
    })
  } catch (error) {
    console.error("Comprehensive check error:", error)
    return NextResponse.json({ success: false, error: "Failed to analyze text" }, { status: 500 })
  }
}
