import { NextResponse } from "next/server"
import { geminiUrl } from "@/lib/gemini"

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

    const requestUrl = geminiUrl(process.env.GEMINI_API_KEY)

    const response = await fetch(requestUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 300,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("[v0] Gemini API error:", errorData)
      return NextResponse.json({ error: "AI unavailable" }, { status: 503 })
    }

    const data = await response.json()
    const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text || ""

    return NextResponse.json({ result: textOutput })
  } catch (error) {
    console.error("[v0] Gemini API error:", error)
    return NextResponse.json({ error: "Failed to get AI suggestions" }, { status: 500 })
  }
}
