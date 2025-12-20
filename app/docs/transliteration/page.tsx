"use client"

import Link from "next/link"
import { ArrowLeft, ArrowRight, Type, Wand2, Check } from "lucide-react"

import { LandingNavbar } from "@/components/layout/landing-navbar"
import { Button } from "@/components/ui/button"

export default function TransliterationDoc() {
  return (
    <div className="min-h-screen bg-white text-[#0f2c21]">
      <LandingNavbar />
      <main className="space-y-10 px-6 py-16 lg:px-12">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          <div className="flex items-center justify-between">
            <Link href="/docs" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0f7a5c] hover:text-[#0c6148]">
              <ArrowLeft className="h-4 w-4" />
              Back to Docs
            </Link>
            <Button asChild size="sm" className="rounded-full bg-[#0f7a5c] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#0f7a5c]/30 hover:bg-[#0c6148]">
              <Link href="/auth/sign-up">
                Try transliteration
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#dfe9dd] bg-[#f7faf7] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#0f7a5c]">
              Transliteration tips
            </div>
            <h1 className="text-4xl font-semibold leading-tight">Type in English, choose pure Tamil output.</h1>
            <p className="text-lg text-[#42584a]">
              Write in Tanglish, and Thamly returns tone-aware Tamil with grammar and sandhi fixes.
            </p>
          </div>

          <div className="space-y-6 rounded-[28px] border border-[#dfe9dd] bg-white p-6 shadow-[0_12px_36px_rgba(15,23,42,0.06)]">
            <h2 className="text-xl font-semibold text-[#0f2c21]">Best practices</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                "Keep sentences short when drafting in English; refine tone afterward.",
                "Use news/academic tone modes to get formal Tamil instantly.",
                "Include key nouns in Tamil if you want them preserved in output.",
                "Lean on rewrite to polish style after transliteration.",
              ].map((tip) => (
                <div key={tip} className="flex items-start gap-2 text-[#42584a]">
                  <Check className="mt-1 h-4 w-4 text-[#0f7a5c]" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-[#42584a]">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#dfe9dd] bg-[#f7faf7] px-3 py-1">
              <Type className="h-4 w-4 text-[#0f7a5c]" />
              Tanglish in, Tamil out
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#dfe9dd] bg-[#f7faf7] px-3 py-1">
              <Wand2 className="h-4 w-4 text-[#0f7a5c]" />
              Tone-aware outputs
            </span>
          </div>
        </div>
      </main>
    </div>
  )
}
