import { type NextRequest, NextResponse } from "next/server"
import { callGeminiWithFallback } from "@/lib/gemini"

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json({ spellingErrors: [], info: "AI spelling unavailable" }, { status: 200 })
    }

    const { data, model } = await callGeminiWithFallback(
      `You are an expert Tamil spelling checker. Analyze Tamil text for spelling errors ONLY.

For each spelling error found, provide:
1. "word" - the misspelled word
2. "suggestions" - array of 2-4 correct spelling suggestions
3. "position" - approximate character position (estimated)
4. "explanation" - Brief Tamil explanation of the spelling error

Example format:
{
  "spellingErrors": [{
    "word": "வனக்கம்",
    "suggestions": ["வணக்கம்", "வனம்"],
    "position": 0,
    "explanation": "'வணக்கம்' என்பது சரியான எழுத்துப்பிழை. 'ண' என்ற எழுத்தை பயன்படுத்த வேண்டும்."
  }]
}

Focus ONLY on spelling errors, not grammar. Return ONLY the JSON object.

Text to check: "${text}"`,
      apiKey,
      { temperature: 0.2, maxOutputTokens: 1000 },
    )
    console.log("[spelling-check] model used:", model)
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!content) {
      return NextResponse.json({ spellingErrors: [], info: "AI service unavailable" }, { status: 200 })
    }

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      const result = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content)

      return NextResponse.json(result)
    } catch (parseError) {
      console.error("Failed to parse AI response:", content)
      return NextResponse.json({ spellingErrors: [] })
    }
  } catch (error) {
    console.error("Spelling check error:", error)
    return NextResponse.json({ spellingErrors: [], info: "Failed to check spelling" }, { status: 200 })
  }
}
