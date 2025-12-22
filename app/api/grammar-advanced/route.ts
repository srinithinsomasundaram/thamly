import { type NextRequest, NextResponse } from "next/server"
import { callGeminiWithFallback } from "@/lib/gemini"
import { SAFE_TAMIL_REASON } from "@/lib/ai/output"

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 })
    }

    const { data, model } = await callGeminiWithFallback(
      `You are an expert Tamil grammar teacher who provides clear, educational corrections. 

GLOBAL CONSTRAINTS (MANDATORY):
- Output MUST be valid minified JSON only.
- Do NOT use markdown, backticks, comments, or explanations outside JSON.
- Do NOT include trailing commas.
- Do NOT repeat input text unless required by schema.
- If unsure, return the safest minimal valid output per schema.
- Never hallucinate facts.

For each grammar error found, provide:
1. "original" - the incorrect word/phrase
2. "corrected" - the correct word/phrase
3. "explanation" - A detailed explanation IN TAMIL explaining why the original is wrong. Use simple Tamil that helps learners understand.
4. "grammarRule" - The Tamil grammar term (e.g., வினைச்சொல், இறந்தகால வினைமுற்று, புணர்ச்சி, எதிர்கால வினைமுற்று)
5. "learnMore" - A simple "aha moment" explanation that makes the rule clear

Example format:
{
  "correctedText": "full corrected text",
  "corrections": [{
    "original": "தொடங்கியது",
    "corrected": "தொடங்கியிருந்தது",
    "explanation": "இங்கே, 'தொடங்கியது' என்ற வினைச்சொல், அவர்கள் வந்தடைந்த அதே கணத்தில் விழா தொடங்கியதாகப் பொருள் தருகிறது. நிகழ்வு முன்னரே தொடங்கிவிட்டது என்பதைத் தெளிவாகக் காட்ட, 'தொடங்கியிருந்தது' என்ற இறந்தகால வினைமுற்றைப் பயன்படுத்துவதே சரியானது.",
    "grammarRule": "இறந்தகால வினைமுற்று",
    "learnMore": "Past perfect tense shows an action completed before another past action. Use -இருந்த- forms when something happened before the main event."
  }],
  "overallFeedback": "உங்கள் எழுத்து மிகவும் நன்றாக உள்ளது! சில இலக்கண மாற்றங்களுடன் இது இன்னும் சிறப்பாக இருக்கும்.",
  "score": 85
}

The "overallFeedback" MUST be a short Tamil sentence (max 8 words).
Return ONLY the JSON object. Provide detailed Tamil explanations that help learners understand the "why" behind each correction.

Analyze this Tamil text for grammar errors: "${text}". 

Provide detailed corrections with:
- Clear explanations in Tamil about why it's wrong
- Grammar rule names in Tamil (வினைச்சொல், புணர்ச்சி, etc.)
- Simple "aha moment" explanations that make the rules clear
Return ONLY the JSON object in the format specified.`,
      apiKey,
      { temperature: 0.4, maxOutputTokens: 2000 },
    )
    console.log("[grammar-advanced] model used:", model)

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!content) {
      return NextResponse.json({ error: "AI service unavailable" }, { status: 503 })
    }

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      const result = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content)

      return NextResponse.json(result)
    } catch (parseError) {
      console.error("Failed to parse AI response:", content)
      return NextResponse.json({
        correctedText: text,
        corrections: [],
        overallFeedback: SAFE_TAMIL_REASON,
        score: 0,
      })
    }
  } catch (error) {
    console.error("Grammar check error:", error)
    return NextResponse.json({ error: "Failed to check grammar" }, { status: 500 })
  }
}
