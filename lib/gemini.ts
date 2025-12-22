const GEMINI_MODEL = "gemini-1.5-flash"
const BASE_URL = "https://generativelanguage.googleapis.com/v1/models"

export const geminiModel = GEMINI_MODEL

export const geminiUrl = (apiKey: string) => `${BASE_URL}/${GEMINI_MODEL}:generateContent?key=${apiKey}`

export const defaultGenConfig = { temperature: 0.5, maxOutputTokens: 512 }

export async function callGemini(prompt: string, apiKey: string, generationConfig = defaultGenConfig) {
  const response = await fetch(geminiUrl(apiKey), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig,
    }),
  })

  const data = await response.json().catch(() => ({}))
  return { response, data }
}
