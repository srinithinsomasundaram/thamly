"use client"

import Link from "next/link"
import { LandingNavbar } from "@/components/layout/landing-navbar"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

const tips = [
  "Type English or Tanglish—AI converts to clean Tamil script.",
  "Avoid phonetic junk: no “ஹெண்” or “ஸப்டி” letter mapping.",
  "Pick tone presets: formal, news, academic, or friendly.",
  "Use transliteration for names and places without losing spelling.",
  "Preview corrections before saving; nothing is auto-applied.",
]

export default function HowToTypeTamilWithoutKeyboard() {
  return (
    <div className="min-h-screen bg-white text-[#0f2c21]">
      <LandingNavbar />
      <main className="space-y-12 px-6 py-16 lg:px-12">
        <section className="mx-auto max-w-5xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#dfe9dd] bg-[#f7faf7] px-4 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-[#0f7a5c]">
            Tamil Typing AI
          </div>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            How to type Tamil without a Tamil keyboard.
          </h1>
          <p className="max-w-3xl text-lg text-[#42584a]">
            Use Thamly as your Tamil typing AI and transliteration tool: type in English, Tanglish, or mix both. The AI
            outputs natural Tamil script without letter-by-letter errors. Choose tone, keep meaning, and stay in control.
          </p>
          <div className="flex gap-3">
            <Button asChild className="bg-[#0f7a5c] text-white hover:bg-[#0c6148]">
              <Link href="/auth/sign-up?redirectTo=/drafts">Start typing</Link>
            </Button>
            <Button variant="outline" asChild className="border-[#dfe9dd] text-[#0f2c21] hover:border-[#0f7a5c]">
              <Link href="/pricing">See plans</Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto grid max-w-5xl gap-6 rounded-[28px] border border-[#dfe9dd] bg-white p-8 shadow-[0_18px_50px_rgba(15,23,42,0.08)] lg:grid-cols-2">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold text-[#0f2c21]">Tips for Tamil transliteration</h2>
            <ul className="space-y-2 text-sm text-[#0f2c21]">
              {tips.map((tip) => (
                <li key={tip} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-[#0f7a5c]" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4 rounded-2xl border border-[#dfe9dd] bg-[#f7faf7] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f7a5c]">Try this</p>
            <p className="text-sm font-semibold text-[#0f2c21]">Type this in English:</p>
            <p className="rounded-xl border border-[#dfe9dd] bg-white px-4 py-3 text-sm text-[#42584a]">
              “please draft a formal tamil email for leave tomorrow”
            </p>
            <p className="text-sm font-semibold text-[#0f2c21]">Thamly returns (Tamil script):</p>
            <p className="rounded-xl border border-[#dfe9dd] bg-white px-4 py-3 text-sm text-[#0f2c21]">
              “நாளை விடுப்பிற்காக ஒரு மரியாதையான தமிழ் மின்னஞ்சலை தயார் செய்யவும்.”
            </p>
            <p className="text-xs text-[#42584a]">Meaning preserved, tone applied, zero keyboard layout changes needed.</p>
          </div>
        </section>
      </main>
    </div>
  )
}
