import { NextResponse } from "next/server"
import { getInstantSuggestions } from "@/lib/tamil-transliterator"

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const text = (body?.text || "").toString().slice(0, 400)

    if (!text) {
      return NextResponse.json({ suggestions: [] })
    }

    const suggestions = getInstantSuggestions(text).slice(0, 8)
    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error("Transliterate API error:", error)
    return NextResponse.json({ suggestions: [] }, { status: 200 })
  }
}
