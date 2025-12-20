import { NextResponse } from "next/server"
import { buildUnifiedPrompt } from "../../../lib/ai/prompts"
import { generateNewsEnhancements } from "../../../lib/ai/news-enhancer"
import { enhanceForNewsTone } from "../../../lib/ai/news-enhancer"

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
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 400 },
        }),
      },
    )

    if (!response.ok) {
      const err = await response.text()
      console.error("Gemini comprehensive-check error:", response.status, err)
      return NextResponse.json({ success: false, error: "AI request failed" }, { status: 500 })
    }

    const data = await response.json()
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || ""

    let parsed: any = null
    try {
      const match = content.match(/\{[\s\S]*\}/)
      parsed = match ? JSON.parse(match[0]) : JSON.parse(content)
    } catch (e) {
      console.error("Failed to parse comprehensive-check response:", content)
    }

    // Handle different response formats based on mode
    if (mode === "news") {
      // News mode returns structured format: headline, news, caption, keywords
      if (!parsed.headline && !parsed.news) {
        return NextResponse.json({ success: false, error: "Invalid news AI response" }, { status: 500 })
      }

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
    } else {
      // Standard mode
      if (!parsed || !parsed.best) {
        return NextResponse.json({ success: false, error: "Invalid AI response" }, { status: 500 })
      }

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
  } catch (error) {
    console.error("Comprehensive check error:", error)
    return NextResponse.json({ success: false, error: "Failed to analyze text" }, { status: 500 })
  }
}
