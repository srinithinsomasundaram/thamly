import { callGeminiWithFallback } from "@/lib/gemini"

export async function POST(request: Request) {
  try {
    const { text } = await request.json()

    if (!text || text.trim().length === 0) {
      return Response.json({ suggestions: [] })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error("[v0] GEMINI_API_KEY environment variable is not set")
      return Response.json({ error: "API key not configured" }, { status: 500 })
    }

    const prompt = `You are an expert writing assistant for Tamil writers. Analyze the given text and provide 2-4 specific, actionable writing suggestions.

For each suggestion, respond in this exact JSON format:
[
  {
    "type": "grammar|clarity|spelling|tone",
    "title": "Brief title",
    "original": "the exact problematic text from input (only if applicable)",
    "suggested": "the improved version (only if applicable)",
    "reason": "detailed explanation of why this change improves the writing"
  }
]

Be concise, practical, and focus on the most impactful improvements. If the writing is excellent, return an empty array [].

Text to analyze: "${text}"`

    const { data, model } = await callGeminiWithFallback(prompt, apiKey, {
      temperature: 0.7,
      maxOutputTokens: 1024,
    })
    console.log("[ai-suggestions] model used:", model)
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text || ""

    try {
      const suggestions = JSON.parse(result)
      return Response.json({ suggestions: Array.isArray(suggestions) ? suggestions : [] })
    } catch {
      return Response.json({ suggestions: [] })
    }
  } catch (error) {
    console.error("[v0] Gemini API error:", error)
    return Response.json({ suggestions: [], error: "Failed to generate suggestions" }, { status: 500 })
  }
}
