import { NextResponse } from "next/server"
import { callGeminiWithFallback } from "@/lib/gemini"
import { getInstantSuggestions } from "@/lib/tamil-transliterator"

const isPureTamil = (text: string) => /^[\u0B80-\u0BFF\s.,?!]+$/.test(text || "")
const isInvalidOutput = (text: string) =>
  /(ஹெண்|யொஉர்|ஸப்டி|ணே\s|wஹெண்|birthday\?|இதை சிறப்பாக மாற்றுகிறேன்)/i.test(text || "")

const cleanJson = (text: string) =>
  (text || "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim()

const parseAiJson = (text: string) => {
  try {
    return JSON.parse(cleanJson(text))
  } catch {
    return null
  }
}

function buildPrompt(text: string, context?: string, mode?: string) {
  const newsBlock =
    mode === "news"
      ? `
News mode override:
- Use formal Tamil news style.
- Avoid spoken endings.
- Keep it neutral, reportable, and concise.
`
      : ""

  return `
You are a Tamil smart typing engine.

TASK:
- Understand user intent from Roman Tamil / English fragments.
- Return up to 3 natural Tamil options.
- Do NOT transliterate letter-by-letter.
- Translate by meaning, not by sound.

${newsBlock}

RULES:
- Output ONLY pure Tamil script.
- Do NOT include English words.
- Do NOT include explanations or meta text.
- If output resembles phonetic mapping (ஹெண்/யொஉர்/ஸப்டி), regenerate.

Return ONLY JSON:
{
  "options": ["", "", ""]
}

Input:
"${text}"

Context (optional):
"${context || ""}"

FINAL SELF-CHECK:
- If any option contains phonetic Tamil of English letters, regenerate.
- Output must read like native written Tamil.
`.trim()
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    const text = typeof body?.text === "string" ? body.text.trim() : ""
    const context = typeof body?.context === "string" ? body.context.trim() : ""
    const mode = typeof body?.mode === "string" ? body.mode.trim().toLowerCase() : "standard"

    if (!text) {
      return NextResponse.json({ options: [], error: "Text is required" }, { status: 400 })
    }

    // If no AI key, fall back to transliterator suggestions
    if (!process.env.GEMINI_API_KEY) {
      const fallback = getInstantSuggestions(text)
        .map((s) => s.tamil)
        .filter((t) => isPureTamil(t) && !isInvalidOutput(t))
        .slice(0, 3)
      return NextResponse.json({ options: fallback })
    }

    const prompt = buildPrompt(text, context, mode)
    const { data, model } = await callGeminiWithFallback(prompt, process.env.GEMINI_API_KEY, {
      temperature: 0.2,
      topP: 0.8,
      maxOutputTokens: 128,
    })
    console.log("[ai/smart-typing] model used:", model)

    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
    const parsed = parseAiJson(raw)
    const options = Array.isArray(parsed?.options) ? parsed.options : []

    const cleaned = options
      .map((o: any) => (typeof o === "string" ? o.trim() : ""))
      .filter((o: string) => o && isPureTamil(o) && !isInvalidOutput(o))
      .slice(0, 3)

    // If AI returned nothing useful, fall back to transliterator suggestions
    if (cleaned.length === 0) {
      const fallback = getInstantSuggestions(text)
        .map((s) => s.tamil)
        .filter((t) => isPureTamil(t) && !isInvalidOutput(t))
        .slice(0, 3)
      return NextResponse.json({ options: fallback })
    }

    return NextResponse.json({ options: cleaned })
  } catch (error) {
    console.error("[ai/smart-typing] error", error)
    return NextResponse.json({ options: [], error: "AI failed" }, { status: 200 })
  }
}
