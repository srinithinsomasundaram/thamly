import { type NextRequest, NextResponse } from "next/server"

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
                  text: `You are an expert Tamil grammar teacher who provides clear, educational corrections. 

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

Return ONLY the JSON object. Provide detailed Tamil explanations that help learners understand the "why" behind each correction.

Analyze this Tamil text for grammar errors: "${text}". 

Provide detailed corrections with:
- Clear explanations in Tamil about why it's wrong
- Grammar rule names in Tamil (வினைச்சொல், புணர்ச்சி, etc.)
- Simple "aha moment" explanations that make the rules clear

Return ONLY the JSON object in the format specified.`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 2000,
          },
        }),
      },
    )

    if (!response.ok) {
      const errorBody = await response.text()
      console.error("Gemini API error:", response.status, errorBody)
      throw new Error(`Gemini API error: ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!content) {
      throw new Error("No response from Gemini API")
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
        overallFeedback: "Unable to analyze text at this time.",
        score: 0,
      })
    }
  } catch (error) {
    console.error("Grammar check error:", error)
    return NextResponse.json({ error: "Failed to check grammar" }, { status: 500 })
  }
}
