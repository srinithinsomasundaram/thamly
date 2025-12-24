import { NextResponse } from "next/server"
import { buildUnifiedPrompt } from "../../../lib/ai/prompts"
import { enhanceForNewsTone } from "../../../lib/ai/news-enhancer"
import { callGeminiWithFallback } from "@/lib/gemini"
import { SAFE_TAMIL_REASON, sanitizeReason } from "@/lib/ai/output"
import { getInstantSuggestions } from "@/lib/tamil-transliterator"

const isPureTamil = (text: string) => /^[\u0B80-\u0BFF\s.,?!]+$/.test(text || "")
const isInvalidOutput = (text: string) =>
  /(ஹெண்|யொஉர்|ஸப்டி|ணே\s|wஹெண்|birthday\?|see this|suggestion|இதை சிறப்பாக மாற்றுகிறேன்|இந்த வாசகம்)/i.test(
    text || "",
  )

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

const buildPerplexityPrompt = (input: string) =>
  `You are a professional Tamil language expert.

TASK:
- Understand the meaning of the text.
- Generate correct, natural written Tamil.
- DO NOT transliterate sounds.
- DO NOT map letters.
- Convert English or Tanglish fully into proper Tamil.
- Fix grammar, spelling, and sentence structure.
- Preserve original meaning exactly.
- Use formal Tamil.

RULES:
- Output ONLY pure Tamil script.
- Do NOT include English words.
- Do NOT include explanations.
- Do NOT include quotes or markdown.
- Tanglish must be converted by meaning, not by sound.

Return ONLY valid JSON:
{
  "best": "Correct Tamil sentence",
  "reason": "Short Tamil reason"
}

Text:
"${input}"`

async function callPerplexityForTamil(input: string) {
  if (!process.env.PERPLEXITY_API_KEY) return null
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 4000)
  try {
    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.PERPLEXITY_MODEL || "sonar-small-chat",
        messages: [
          { role: "system", content: "You are a Tamil language expert." },
          { role: "user", content: buildPerplexityPrompt(input) },
        ],
        temperature: 0.1,
        max_tokens: 120,
      }),
      signal: controller.signal,
    })
    const data = await res.json().catch(() => ({}))
    const text = data?.choices?.[0]?.message?.content || ""
    return parseAiJson(text)
  } catch (err) {
    console.error("Perplexity error:", err)
    return null
  } finally {
    clearTimeout(timer)
  }
}

function shouldUsePerplexity(parsed: any, input: string) {
  if (!parsed) return true
  if (!parsed.best) return true
  if (!isPureTamil(parsed.best)) return true
  if (parsed.best.trim() === input.trim() && /[A-Za-z]/.test(input)) return true
  // Reject obvious phonetic garbage
  if (parsed.best && /(ஹெண்|யொஉர்|ஸப்டி|ணே\s|wஹெண்|birthday\?)/i.test(parsed.best)) return true
  return false
}

function detectReason(input: string, corrected: string) {
  if (/^[a-z\s]+$/i.test(input)) return "தமிழ் ஒலிப்பெயர்ப்பு திருத்தப்பட்டது"
  if (/[A-Za-z]/.test(input)) return "ஆங்கில பகுதி சரியான தமிழாக மாற்றப்பட்டது"
  if (input !== corrected) return "இலக்கண திருத்தம் செய்யப்பட்டது"
  return "மாற்றம் தேவையில்லை"
}

function buildGrammarResult(input: string, parsed: any) {
  const candidate = parsed?.best && typeof parsed.best === "string" ? parsed.best.trim() : ""
  const corrected = candidate && isPureTamil(candidate) && !isInvalidOutput(candidate) ? candidate : input

  const reason =
    parsed?.reason && typeof parsed.reason === "string" && isPureTamil(parsed.reason)
      ? sanitizeReason(parsed.reason.trim())
      : detectReason(input, corrected)

  return {
    type: "grammar",
    original: input,
    corrected,
    reason,
  }
}

export async function POST(req: Request) {
  try {
    const { text, tone = "formal", mode = "standard" } = await req.json()

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ success: false, error: "Text is required" }, { status: 400 })
    }

    // Demo fallback when no key
    if (!process.env.GEMINI_API_KEY) {
      const result = buildGrammarResult(text, null)
      return NextResponse.json({ success: true, result })
    }

    const prompt = buildUnifiedPrompt(text, tone, mode)
    const { data, model } = await callGeminiWithFallback(prompt, process.env.GEMINI_API_KEY, {
      temperature: 0.1,
      topP: 0.8,
      maxOutputTokens: 128,
    })
    console.log("[comprehensive-check] model used:", model)

    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
    const parsedGemini = parseAiJson(rawText)
    let finalParsed = parsedGemini

    if (shouldUsePerplexity(parsedGemini, text)) {
      const parsedPerplexity = await callPerplexityForTamil(text)
      if (parsedPerplexity?.best && isPureTamil(parsedPerplexity.best)) {
        finalParsed = parsedPerplexity
      }
    }

    const transliterateFallback = (value: string) => {
      const words = value.split(/\s+/).filter(Boolean)
      const mapped = words.map((w) => {
        if (!/^[a-zA-Z]+$/.test(w)) return w
        const sug = getInstantSuggestions(w)[0]
        return sug?.tamil || w
      })
      return mapped.join(" ")
    }

    const phraseMap: Record<string, string> = {
      "when is your birthday": "உங்கள் பிறந்தநாள் எப்போது",
      "ok": "சரி",
      "models": "மாதிரிகள்",
      "model": "மாடல்",
      "done": "முடிந்தது",
      "clearly": "தெளிவாக",
      "build": "உருவாக்கு",
    }

    const englishFallback = (value: string) => {
      let out = value
      const lower = value.toLowerCase()
      Object.entries(phraseMap).forEach(([key, val]) => {
        if (lower.includes(key)) {
          out = out.replace(new RegExp(key, "ig"), val)
        }
      })
      return out
    }

    if (mode === "news") {
      if (finalParsed?.headline || finalParsed?.news) {
        const enhancedNews = finalParsed.news ? enhanceForNewsTone(finalParsed.news) : ""
        const newsReason =
          finalParsed?.reason && isPureTamil(finalParsed.reason) ? sanitizeReason(finalParsed.reason) : SAFE_TAMIL_REASON
        return NextResponse.json({
          success: true,
          result: {
            type: "news",
            headline: finalParsed.headline || "",
            news: enhancedNews,
            caption: finalParsed.caption || "",
            keywords: finalParsed.keywords || [],
            original: text,
            reason: newsReason,
          },
        })
      }
      // fall through to grammar style if news parse fails
    }

    let result = buildGrammarResult(text, finalParsed)

    // Deterministic fallback: if nothing changed and input has ASCII, apply simple map/transliteration
    const hasAscii = /[A-Za-z]/.test(text)
    const isPureAscii = /^[A-Za-z\s.,?!]+$/.test(text)
    if (result.corrected === text && hasAscii) {
      let fallback = text
      if (isPureAscii) {
        fallback = transliterateFallback(text)
      } else {
        fallback = englishFallback(text)
      }
      if (fallback && fallback !== text) {
        const reason = detectReason(text, fallback)
        result = { type: "grammar", original: text, corrected: fallback, reason }
      }
    }

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error("Comprehensive check error:", error)
    return NextResponse.json({ success: false, error: "Failed to analyze text" }, { status: 500 })
  }
}
