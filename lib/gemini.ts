const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"

export const GEMINI_FALLBACK_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.5-pro",
] as const

export const defaultGenConfig = {
  temperature: 0.2,
  topP: 0.9,
  maxOutputTokens: 256,
}

type GeminiResult = {
  candidates?: any[]
}

type GenerationConfig = {
  temperature: number
  topP: number
  maxOutputTokens: number
}

export async function callGeminiWithFallback(
  prompt: string,
  apiKey: string,
  generationConfig?: Partial<GenerationConfig>,
): Promise<{ data: GeminiResult; model: string }> {
  let lastError: any = null
  const config: GenerationConfig = {
    ...defaultGenConfig,
    ...(generationConfig || {}),
  }

  for (const model of GEMINI_FALLBACK_MODELS) {
    const url = `${BASE_URL}/${model}:generateContent?key=${apiKey}`
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: config,
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
