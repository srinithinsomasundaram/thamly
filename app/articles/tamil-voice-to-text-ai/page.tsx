"use client"

import Link from "next/link"
import { LandingNavbar } from "@/components/layout/landing-navbar"
import { Button } from "@/components/ui/button"
import { Check, Mic } from "lucide-react"

const bullets = [
  "Speak in Tamil, Tanglish, or English—AI outputs clean Tamil text.",
  "Automatic grammar + spelling correction for transcribed text.",
  "Tone presets: formal, academic, news; no unwanted rewrites.",
  "Noise-aware: short pauses are handled; punctuation suggestions included.",
  "Private: transcriptions stay in your workspace.",
]

export default function TamilVoiceToTextAIPage() {
  return (
    <div className="min-h-screen bg-white text-[#0f2c21]">
      <LandingNavbar />
      <main className="space-y-12 px-6 py-16 lg:px-12">
        <section className="mx-auto max-w-5xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#dfe9dd] bg-[#f7faf7] px-4 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-[#0f7a5c]">
            <Mic className="h-4 w-4" />
            <span>Voice to Text</span>
          </div>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            Tamil voice to text with AI: dictate, transcribe, and clean up instantly.
          </h1>
          <p className="max-w-3xl text-lg text-[#42584a]">
            Use Thamly as your Tamil voice-to-text AI: dictate in Tamil, Tanglish, or English; get clean Tamil text with
            grammar fixes and tone control. Perfect for reporters, students, and creators who need hands-free writing.
          </p>
          <div className="flex gap-3">
            <Button asChild className="bg-[#0f7a5c] text-white hover:bg-[#0c6148]">
              <Link href="/auth/sign-up?redirectTo=/drafts">Start free</Link>
            </Button>
            <Button variant="outline" asChild className="border-[#dfe9dd] text-[#0f2c21] hover:border-[#0f7a5c]">
              <Link href="/pricing">View pricing</Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto grid max-w-5xl gap-6 rounded-[28px] border border-[#dfe9dd] bg-white p-8 shadow-[0_18px_50px_rgba(15,23,42,0.08)] lg:grid-cols-2">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold text-[#0f2c21]">How to use Tamil voice-to-text in Thamly</h2>
            <ul className="space-y-2 text-sm text-[#0f2c21]">
              {bullets.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-[#0f7a5c]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4 rounded-2xl border border-[#dfe9dd] bg-[#f7faf7] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f7a5c]">Try this</p>
            <p className="text-sm font-semibold text-[#0f2c21]">Dictate this in English or Tanglish:</p>
            <p className="rounded-xl border border-[#dfe9dd] bg-white px-4 py-3 text-sm text-[#42584a]">
              “Draft a Tamil news update about heavy rain in Chennai; keep it formal.”
            </p>
            <p className="text-sm font-semibold text-[#0f2c21]">Thamly returns (Tamil script):</p>
            <p className="rounded-xl border border-[#dfe9dd] bg-white px-4 py-3 text-sm text-[#0f2c21]">
              “சென்னையில் பெய்து வரும் கனமழை குறித்த தமிழ் செய்திக்குறிப்பை இணைக்கவும், அதை முறையானதாக வைத்திருக்கவும்.”
            </p>
            <p className="text-xs text-[#42584a]">Neutral/news tone applied; grammar and spelling cleaned automatically.</p>
          </div>
        </section>
      </main>
    </div>
  )
}
