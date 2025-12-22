import { NextResponse } from "next/server"
import { callGeminiWithFallback } from "@/lib/gemini"

export async function POST(req: Request) {
  try {
    const { text, context, tone } = await req.json()

    const prompt = `
You are a Tamil grammar and style assistant. Fix grammar, sandhi, and context of the given Tamil text.
Maintain tone: ${tone}. Provide a clear corrected version and 1 alternate phrasing.

Context: ${context}
Text: ${text}
Return in JSON: {"main": "corrected text", "alt": "alternate phrasing"}.
`

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        result: JSON.stringify({
          main: `[Demo Mode] Corrected version of your text with proper Tamil grammar. (Add GEMINI_API_KEY to enable real AI suggestions)`,
          alt: "This is an alternate phrasing suggestion.",
        }),
      })
    }

    const { data, model } = await callGeminiWithFallback(prompt, process.env.GEMINI_API_KEY, {
      temperature: 0.4,
      maxOutputTokens: 300,
    })
    console.log("[grammar-check] model used:", model)
    const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text || ""

    return NextResponse.json({ result: textOutput })
  } catch (error) {
    console.error("[v0] Gemini API error:", error)
    return NextResponse.json({ error: "Failed to get AI suggestions" }, { status: 500 })
  }
}
