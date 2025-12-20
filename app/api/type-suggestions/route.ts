import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { word } = await req.json()

    if (!word || word.length < 2) {
      return NextResponse.json({ suggestions: [] })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error("[v0] GEMINI_API_KEY environment variable is not set")
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    const prompt = `You are a Tamil transliteration engine. Convert this English/Thanglish word into the TOP 4 most common Tamil words that match this phonetic spelling.

Return ONLY a valid JSON array with exactly 4 strings, nothing else. No markdown, no extra text.

Example response format:
["word1", "word2", "word3", "word4"]

Word to convert: ${word}`

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

    try {
      let suggestions = JSON.parse(responseText)

      // Ensure we always return exactly 4 suggestions or fewer if not available
      if (Array.isArray(suggestions)) {
        suggestions = suggestions.slice(0, 4)
      } else {
        suggestions = []
      }

      return NextResponse.json({ suggestions })
    } catch (parseError) {
      console.error("[v0] Error parsing Gemini response:", parseError)
      return NextResponse.json({ suggestions: [] })
    }
  } catch (error) {
    console.error("[v0] Gemini suggestion error:", error)
    return NextResponse.json({ suggestions: [] })
  }
}
