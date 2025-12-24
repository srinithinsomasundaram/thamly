import { NextResponse } from "next/server"
import { callGeminiWithFallback } from "@/lib/gemini"

const isPureTamil = (text: string) => /^[\u0B80-\u0BFF\s.,?!]+$/.test(text || "")
const isInvalidOutput = (text: string) =>
  /(ஹெண்|யொஉர்|ஸப்டி|ணே\s|wஹெண்|birthday\?|இதை சிறப்பாக மாற்றுகிறேன்)/i.test(text || "")

const detectLanguage = (text: string) => {
  const tamil = /[\u0B80-\u0BFF]/.test(text || "")
  return tamil ? "ta" : "en"
}

function cleanJson(text: string) {
  return (text || "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim()
}

function parseAiJson(text: string) {
  try {
    return JSON.parse(cleanJson(text))
  } catch {
    return null
  }
}

function buildPrompt(text: string, context?: string, tone?: string, mode?: string) {
  const newsBlock =
    mode === "news"
      ? `
You are a senior Tamil news editor with decades of newsroom experience.

IMPORTANT:
- If the input text is already correct for Tamil news writing, you MUST return:
  { "suggestions": [ { "type": "NO_CHANGE" } ] }
- You are NOT allowed to respond with advice, summaries, explanations, or rewrite statements.
- Any response outside the defined JSON schema is INVALID.

Writing style:
- Formal Tamil news language
- Neutral, factual, unbiased
- Clear and concise
- No emotional or poetic expressions

Editorial rules:
- Do not sensationalize
- Do not add opinions
- Do not assume facts
- Preserve accuracy

Correction rules:
- Correct only what is wrong
- Improve clarity only if needed
- Maintain journalistic tone
- If sentence is already suitable for news, say NO_CHANGE
- NEVER summarise or merge multiple sentences into one.
- NEVER rewrite the whole content.
- If content is not news-appropriate, respond with "NOT_NEWS_CONTENT".
- Translation/rewrites are disabled in news mode; focus ONLY on grammar, clarity, tone.
- Process each sentence independently; do NOT rewrite the entire paragraph.

Headline discipline:
- Headline is short, factual, neutral
- Body is clear, reportable Tamil
`
      : ""

  return `
You are Thamly AI Orchestrator. Generate Tamil-only suggestions as JSON.

CRITICAL RULE:
- The "suggested" field MUST contain ONLY the final Tamil text. Do NOT explain, do NOT mention AI/actions.
- NEVER transliterate English/Tanglish letter-by-letter into Tamil.
- Tanglish/English must be translated by meaning, not phonetics.
- If output resembles phonetic mapping (ஹெண்/யொஉர்/ஸப்டி), it is INVALID.

TASKS:
- Detect grammar, spelling, clarity, tone issues, and mixed-language cleanup.
- If no change needed, do NOT include a suggestion.

JSON SHAPE (array):
{
  "suggestions": [
    {
      "type": "Grammar|Spelling|Clarity|Tone|SmartTyping",
      "from": "original fragment",
      "to": "Tamil corrected fragment",
      "reason": "Short Tamil reason",
      "confidence": 0-100
    },
    {
      "type": "NO_CHANGE"
    }
  ]
}

${newsBlock}

INPUT:
"${text}"

CONTEXT (optional):
"${context || ""}"

TONE (optional):
"${tone || "formal"}"
`.trim()
}

function buildEnglishNewsPrompt(text: string) {
  return `
You are a professional English news editor.

IMPORTANT:
- If the input text is already correct for news writing, you MUST return:
  { "suggestions": [ { "type": "NO_CHANGE" } ] }
- Do NOT translate to Tamil.
- Do NOT provide summaries or advice.
- Only return the defined JSON.

Rules:
- Formal, neutral news tone.
- No rewrites unless correcting grammar/clarity.
- If grammar is correct, return NO_CHANGE.

Return ONLY this JSON:
{
  "suggestions": [
    { "type": "NO_CHANGE" },
    {
      "type": "Grammar",
      "from": "original fragment",
      "to": "corrected English fragment",
      "reason": "Short English reason",
      "confidence": 0-100
    }
  ]
}

Input:
"${text}"
`.trim()
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    const text = typeof body?.text === "string" ? body.text.trim() : ""
    const context = typeof body?.context === "string" ? body.context.trim() : ""
    const tone = typeof body?.tone === "string" ? body.tone.trim() : ""

    if (!text) {
      return NextResponse.json({ suggestions: [], error: "Text is required" }, { status: 400 })
    }

    const mode = typeof body?.mode === "string" ? body.mode.trim().toLowerCase() : "standard"
    const language = detectLanguage(text)

    // News-mode validator: block casual/greeting/meta content from being rewritten
    if (mode === "news") {
      const sentences = text
        .split(/[\n\.!?]+/)
        .map((s: string) => s.trim())
        .filter((s: string): s is string => Boolean(s))
      const isNonNews = (s: string) =>
        /(வணக்கம்|ஹலோ|hello|hi|how are|ok|சரி|தயவு செய்து|thanks|நன்றி)/i.test(s)
      const nonNews = sentences.filter(isNonNews)
      if (nonNews.length > 0) {
        return NextResponse.json({
          suggestions: [
            {
              type: "NewsModeWarning",
              from: "",
              to: "",
              reason:
                "இந்த உள்ளடக்கம் செய்தி எழுதும் மொழிக்குப் பொருத்தமில்லை. உரையாடல் அல்லது விளக்க மொழி கண்டறியப்பட்டது.",
              confidence: 0,
              details: nonNews,
            },
          ],
        })
      }
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ suggestions: [], info: "AI unavailable" }, { status: 200 })
    }

    const prompt = language === "en" ? buildEnglishNewsPrompt(text) : buildPrompt(text, context, tone, mode)
    const { data, model } = await callGeminiWithFallback(prompt, process.env.GEMINI_API_KEY, {
      temperature: 0.1,
      topP: 0.8,
      maxOutputTokens: 256,
    })
    console.log("[ai/agents] model used:", model)

    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
    const parsed = parseAiJson(raw)
    const items = Array.isArray(parsed?.suggestions) ? parsed.suggestions : []

    const normalized = items
      .map((s: any) => {
        // Allow explicit NO_CHANGE
        if (s?.type === "NO_CHANGE") {
          return {
            type: "NO_CHANGE",
            from: "",
            to: "",
            reason:
              typeof s?.reason === "string" && s.reason.trim().length > 0
                ? s.reason.trim()
                : "இந்த உள்ளடக்கம் செய்தி மொழிக்கு ஏற்றதாக உள்ளது. திருத்தம் தேவையில்லை.",
            confidence: 100,
          }
        }
        const to = typeof s?.to === "string" ? s.to.trim() : ""
        const from = typeof s?.from === "string" ? s.from.trim() : text
        const type = typeof s?.type === "string" ? s.type : "Grammar"
        const reason = typeof s?.reason === "string" ? s.reason.trim() : ""
        const confidence = typeof s?.confidence === "number" ? Math.max(0, Math.min(100, s.confidence)) : 0

        if (language === "ta") {
          if (!to || !isPureTamil(to) || isInvalidOutput(to)) return null
        } else {
          // English path: ensure we don't mention Tamil/translation
          const lowerReason = reason.toLowerCase()
          if (lowerReason.includes("tamil") || lowerReason.includes("translate")) return null
        }

        return {
          type,
          from,
          to,
          reason,
          confidence,
        }
      })
      .filter(
        (
          item: {
            type: string
            from: string
            to: string
            reason: string
            confidence: number
          } | null,
        ): item is {
          type: string
          from: string
          to: string
          reason: string
          confidence: number
        } => Boolean(item),
      )

    return NextResponse.json({ suggestions: normalized || [] })
  } catch (error) {
    console.error("[ai/agents] error", error)
    return NextResponse.json({ suggestions: [], error: "AI failed" }, { status: 200 })
  }
}
