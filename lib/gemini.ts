const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"
const PERPLEXITY_URL = "https://api.perplexity.ai/chat/completions"
const DEFAULT_PERPLEXITY_MODEL = process.env.PERPLEXITY_MODEL || "llama-3.1-sonar-large-128k-online"

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

async function callPerplexity(
  prompt: string,
  apiKey: string,
  generationConfig: GenerationConfig,
): Promise<GeminiResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 4000)
  try {
    const res = await fetch(PERPLEXITY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEFAULT_PERPLEXITY_MODEL,
        messages: [
          { role: "system", content: "You are a Tamil-first assistant. Return plain text only." },
          { role: "user", content: prompt },
        ],
        temperature: generationConfig.temperature,
        top_p: generationConfig.topP,
        max_tokens: generationConfig.maxOutputTokens,
      }),
      signal: controller.signal,
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(`Perplexity error: ${res.status}`)
    }
    const text = data?.choices?.[0]?.message?.content || ""
    return {
      candidates: [
        {
          content: {
            parts: [{ text }],
          },
        },
      ],
    }
  } finally {
    clearTimeout(timer)
  }
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

  // If Gemini stack fails, try Perplexity if configured
  if (process.env.PERPLEXITY_API_KEY) {
    try {
      const data = await callPerplexity(prompt, process.env.PERPLEXITY_API_KEY, config)
      return { data, model: DEFAULT_PERPLEXITY_MODEL }
    } catch (err) {
      lastError = { provider: "perplexity", error: (err as any)?.message || String(err) }
      console.error("Perplexity fetch error:", lastError)
    }
  }

  throw new Error("All AI providers failed: " + JSON.stringify(lastError))
}
