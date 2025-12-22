const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"

export const GEMINI_FALLBACK_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.5-pro",
] as const

export const defaultGenConfig = {
  temperature: 0.4,
  maxOutputTokens: 512,
}

type GeminiResult = {
  candidates?: any[]
}

export async function callGeminiWithFallback(
  prompt: string,
  apiKey: string,
  generationConfig = defaultGenConfig,
): Promise<{ data: GeminiResult; model: string }> {
  let lastError: any = null

  for (const model of GEMINI_FALLBACK_MODELS) {
    const url = `${BASE_URL}/${model}:generateContent?key=${apiKey}`
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        return { data, model }
      }

      lastError = { model, status: res.status, data }
      console.error("Gemini model failed:", lastError)
    } catch (err) {
      lastError = { model, error: err }
      console.error("Gemini fetch error:", lastError)
    }
  }

  throw new Error("All Gemini models failed: " + JSON.stringify(lastError))
}
