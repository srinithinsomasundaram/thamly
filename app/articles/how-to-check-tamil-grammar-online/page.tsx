"use client"

import Link from "next/link"
import { LandingNavbar } from "@/components/layout/landing-navbar"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

const steps = [
  "Paste your Tamil or Tanglish text into the editor.",
  "Click “Check grammar” to run the Tamil grammar checker.",
  "Review AI suggestions for tense, agreement, and sandhi fixes.",
  "Apply changes sentence-by-sentence; no unwanted rewrites.",
  "Switch tone to formal, academic, or news if needed.",
]

export default function HowToCheckTamilGrammarOnline() {
  return (
    <div className="min-h-screen bg-white text-[#0f2c21]">
      <LandingNavbar />
      <main className="space-y-12 px-6 py-16 lg:px-12">
        <section className="mx-auto max-w-5xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#dfe9dd] bg-[#f7faf7] px-4 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-[#0f7a5c]">
            Tamil Grammar Checker
          </div>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            How to check Tamil grammar online using AI.
          </h1>
          <p className="max-w-3xl text-lg text-[#42584a]">
            Use Thamly as your Tamil grammar checker and AI proofreader: it fixes tense, agreement, and sandhi errors,
            understands Tanglish, and keeps your meaning intact. No phonetic junk, no forced rewrites.
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
            <h2 className="text-2xl font-semibold text-[#0f2c21]">Quick steps</h2>
            <ul className="space-y-2 text-sm text-[#0f2c21]">
              {steps.map((step) => (
                <li key={step} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-[#0f7a5c]" />
                  {step}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4 rounded-2xl border border-[#dfe9dd] bg-[#f7faf7] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f7a5c]">Why AI helps</p>
            <p className="text-sm text-[#42584a]">
              AI spots tense mismatches, plural/singular issues, and sandhi errors that are easy to miss. Thamly corrects
              them while keeping your sentence length and meaning intact. You stay in control—apply only the changes you
              want.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
