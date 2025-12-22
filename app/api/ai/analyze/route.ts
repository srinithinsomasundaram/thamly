import { callGeminiWithFallback } from "@/lib/gemini"

export async function POST(request: Request) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return Response.json({ analysis: "" })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error("[v0] GEMINI_API_KEY environment variable is not set")
      return Response.json({ error: "API key not configured" }, { status: 500 })
    }

    const prompt = `Analyze this Tamil text and provide brief grammar and style suggestions:

"${text}"

Provide a concise suggestion (1-2 sentences). If the text is fine, say "Text looks good!"`

    const { data, model } = await callGeminiWithFallback(prompt, apiKey, {
      temperature: 0.7,
      maxOutputTokens: 256,
    })
    console.log("[ai/analyze] model used:", model)
    const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ""

    return Response.json({ analysis })
  } catch (error) {
    console.error("[v0] Error in analyze endpoint:", error)
    return Response.json({ analysis: "" }, { status: 500 })
  }
}
