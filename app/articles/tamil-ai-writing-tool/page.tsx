"use client"

import Link from "next/link"
import { LandingNavbar } from "@/components/layout/landing-navbar"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

const bullets = [
  "Tamil grammar checker: tense, agreement, sandhi fixes in seconds.",
  "Tamil spelling checker that understands context—not just dictionary matches.",
  "Tanglish to Tamil transliteration without phonetic junk (no “ஹெண்”, “ஸப்டி”).",
  "English to Tamil AI typing with formal, academic, or news tone.",
  "Sentence correction that preserves meaning; no unwanted rewrites.",
]

export default function TamilAIWritingToolPage() {
  return (
    <div className="min-h-screen bg-white text-[#0f2c21]">
      <LandingNavbar />
      <main className="space-y-12 px-6 py-16 lg:px-12">
        <section className="mx-auto max-w-5xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#dfe9dd] bg-[#f7faf7] px-4 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-[#0f7a5c]">
            Tamil AI Writing Tool
          </div>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            Tamil grammar checker, spelling fixer, and transliteration in one AI editor.
          </h1>
          <p className="max-w-3xl text-lg text-[#42584a]">
            Thamly is a Tamil-first AI writing assistant that combines grammar correction, Tamil spelling checks,
            Tanglish-to-Tamil transliteration, and tone control. Use it for homework, emails, blog posts, and professional copy—without keyword stuffing or awkward translations.
          </p>
          <div className="flex flex-wrap gap-3 text-sm text-[#0f2c21]">
            {bullets.map((item) => (
              <span key={item} className="inline-flex items-start gap-2 rounded-full border border-[#dfe9dd] bg-white px-3 py-2">
                <Check className="mt-0.5 h-4 w-4 text-[#0f7a5c]" />
                {item}
              </span>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <Button asChild className="bg-[#0f7a5c] text-white hover:bg-[#0c6148]">
              <Link href="/auth/sign-up?redirectTo=/drafts">Start free</Link>
            </Button>
            <Button variant="outline" asChild className="border-[#dfe9dd] text-[#0f2c21] hover:border-[#0f7a5c]">
              <Link href="/pricing">View pricing</Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto grid max-w-5xl gap-8 rounded-[28px] border border-[#dfe9dd] bg-white p-8 shadow-[0_18px_50px_rgba(15,23,42,0.08)] lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0f2c21]">How Thamly improves Tamil writing</h2>
            <p className="text-sm text-[#42584a]">
              Type in English, Tamil, or Tanglish. Thamly detects the mix, fixes grammar and spelling, and converts phonetics into clean Tamil script. You can choose tone presets—formal, news, academic, or friendly—without losing meaning.
            </p>
            <ul className="space-y-2 text-sm text-[#0f2c21]">
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-[#0f7a5c]" />
                Online Tamil grammar correction with AI reasoning.
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-[#0f7a5c]" />
                Tamil spelling checker that respects context and tone.
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-[#0f7a5c]" />
                Tanglish transliteration that avoids letter-by-letter mistakes.
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-[#0f7a5c]" />
                AI Tamil typing that stays private; drafts remain yours.
              </li>
            </ul>
          </div>
          <div className="space-y-3 rounded-2xl border border-[#dfe9dd] bg-[#f7faf7] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f7a5c]">Try this</p>
            <p className="text-sm font-semibold text-[#0f2c21]">Paste a Tanglish sentence:</p>
            <p className="rounded-xl border border-[#dfe9dd] bg-white px-4 py-3 text-sm text-[#42584a]">
              “unga support venum for tamil project, make it formal”
            </p>
            <p className="text-sm font-semibold text-[#0f2c21]">Thamly returns:</p>
            <p className="rounded-xl border border-[#dfe9dd] bg-white px-4 py-3 text-sm text-[#0f2c21]">
              “எனக்கு உங்கள் உதவி தேவை. தயவு செய்து இந்தத் திட்டத்தைப் பற்றி விளக்கவும்.”
            </p>
            <p className="text-xs text-[#42584a]">Meaning preserved, grammar fixed, formal tone applied.</p>
          </div>
        </section>
      </main>
    </div>
  )
}
