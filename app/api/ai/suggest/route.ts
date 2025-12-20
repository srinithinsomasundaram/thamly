import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { word, context } = await request.json()

    if (!word || typeof word !== "string" || word.trim().length === 0) {
      return NextResponse.json({ suggestions: [] }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error("[v0] GEMINI_API_KEY environment variable is not set")
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    const contextInfo = context ? `Context: "${context}"` : ""

    const prompt = `You are an AI writing assistant for Tamil (Thamly). Analyze this word and provide multiple smart alternatives.

Word to analyze: "${word}"
${contextInfo}

Provide exactly 4 context-aware suggestions:
1. First suggestion: Best correction or most relevant alternative
2. Second suggestion: Synonym or related word
3. Third suggestion: Alternative form or variation
4. Fourth suggestion: Enhanced or stronger version

Rules:
- Return ONLY the 4 suggestions, one per line
- Each line should have ONLY the Tamil/word suggestion
- No explanations, numbers, or extra text
- If the word is already in Tamil, provide synonyms and variations
- If the word is in Thanglish/English, convert to Tamil first, then provide variations

Format (exactly 4 lines):
suggestion1
suggestion2
suggestion3
suggestion4`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
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
            temperature: 0.7,
            maxOutputTokens: 512,
          },
        }),
      },
    )

    if (!response.ok) {
      const errorData = await response.json()
      console.error("[v0] Gemini API error:", errorData)
      throw new Error(`Gemini API error: ${response.statusText}`)
    }

    const data = await response.json()
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || ""
    const suggestions = responseText
      .split("\n")
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0)
      .slice(0, 4)

    return NextResponse.json({
      suggestions: suggestions.length > 0 ? suggestions : [word],
    })
  } catch (error) {
    console.error("[v0] Error in suggest endpoint:", error)
    return NextResponse.json({ error: "Failed to generate suggestions", suggestions: [] }, { status: 500 })
  }
}
