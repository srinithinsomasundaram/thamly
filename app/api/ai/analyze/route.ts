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
            maxOutputTokens: 256,
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
    const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ""

    return Response.json({ analysis })
  } catch (error) {
    console.error("[v0] Error in analyze endpoint:", error)
    return Response.json({ analysis: "" }, { status: 500 })
  }
}
