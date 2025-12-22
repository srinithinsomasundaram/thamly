import { type NextRequest, NextResponse } from "next/server"
import { callGeminiWithFallback } from "@/lib/gemini"

const TAMIL_CHAR_REGEX = /[\u0B80-\u0BFF]/

function extractJsonArray(text: string) {
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) return null
  try {
    const parsed = JSON.parse(match[0])
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function filterTamilSuggestions(raw: any[]): string[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const result: string[] = []
  for (const item of raw) {
    const val = typeof item === "string" ? item.trim() : ""
    if (!val) continue
    if (!TAMIL_CHAR_REGEX.test(val)) continue
    if (seen.has(val)) continue
    seen.add(val)
    result.push(val)
    if (result.length >= 4) break
  }
  return result
}

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

    const prompt = `You are a Tamil transliteration engine for live typing suggestions.
Given an English/Thanglish input, return the 4 most probable single-word Tamil matches (Tamil script only).

Rules:
- Output ONLY a JSON array of up to 4 strings, no markdown or prose.
- Each item must be Tamil script; no English, no Roman letters.
- Prefer the most common everyday spelling; match the phonetics closely.
- Keep each suggestion to 1-2 words max (no sentences).

Examples:
Input: vanakkam -> ["வணக்கம்","வணக்கம்","வாழ்த்துகள்","நன்றிகள்"]
Input: sapadu -> ["சாப்பாடு","சோறு","உணவு","புசணம்"]
Input: irukeengala -> ["இருக்கீங்களா","இருக்கிறீர்களா","சிறப்பா இருக்கீங்களா","நலமா இருக்கீங்களா"]
Input: chennai metro -> ["சென்னை மெட்ரோ","சென்னை மெட்ரோ ரயில்","சென்னை ரெயில்","சென்னை நகர மெட்ரோ"]

Input word: ${word}`

    const { data, model } = await callGeminiWithFallback(prompt, apiKey, {
      temperature: 0.35,
      maxOutputTokens: 512,
    })
    console.log("[type-suggestions] model used:", model)
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || ""

    try {
      const parsed = extractJsonArray(responseText)
      const suggestions = filterTamilSuggestions(parsed || [])
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
