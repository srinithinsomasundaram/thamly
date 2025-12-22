import { callGeminiWithFallback } from "@/lib/gemini"

export async function POST(request: Request) {
  try {
    const { text } = await request.json()

    if (!text || !text.trim()) {
      return Response.json({ suggestions: [] })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error("[v0] GEMINI_API_KEY environment variable is not set")
      return Response.json({ error: "API key not configured" }, { status: 500 })
    }

    const prompt = `You are a Tamil language expert AI specialized in Tamil writing assistance. Analyze the following Tamil text comprehensively.

Tamil Text: "${text}"

FOCUS AREAS:
1. Verb Conjugation Errors - Catch incorrect verb forms and tense usage
2. Sandhi Rule Violations - Identify and correct complex sandhi (புணர்ச்சி) mistakes
3. Subject-Verb Agreement - Guarantee proper agreement between subjects and verbs
4. Spelling Errors - Including phonetic awareness (சோதணையா vs சோதனையா confusion)
5. Formal vs Informal Tone - Suggest appropriate formality level for context
6. Cultural Sensitivity - Ensure respectful and culturally appropriate language
7. Clarity Improvements - Suggest clearer, more concise expressions
8. Dialect Variations - Recognize regional spelling variations (Tamil from across the globe)
9. Contextual Fixes - Provide corrections based on sentence meaning, not random suggestions

Return ONLY valid JSON array. No markdown, no extra text:
[
  {
    "type": "spelling",
    "original": "incorrect word",
    "suggestion": "correct word",
    "reason": "explanation (phonetic awareness: ___)"
  },
  {
    "type": "grammar",
    "original": "incorrect phrase",
    "suggestion": "correct phrase",
    "reason": "explanation (verb form / sandhi / subject-verb agreement)"
  },
  {
    "type": "clarity",
    "original": "unclear phrase",
    "suggestion": "clearer phrase",
    "reason": "explanation (style / formality / cultural context)"
  }
]

If there are no issues, return: []
Important: Return ONLY the JSON array, nothing else.`

    const { data, model } = await callGeminiWithFallback(prompt, apiKey, {
      temperature: 0.7,
      maxOutputTokens: 2000,
    })
    console.log("[analyze] model used:", model)
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text || ""

    let suggestions = []
    try {
      const jsonMatch = result.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0])
      }
    } catch (parseError) {
      console.error("[v0] Error parsing AI response:", parseError)
    }

    return Response.json({ suggestions })
  } catch (error) {
    console.error("[v0] Analysis error:", error)
    return Response.json({ error: "Failed to analyze text" }, { status: 500 })
  }
}
