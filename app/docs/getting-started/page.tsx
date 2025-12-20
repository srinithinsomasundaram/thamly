"use client"

import Link from "next/link"
import { ArrowLeft, ArrowRight, Sparkles, Check } from "lucide-react"

import { LandingNavbar } from "@/components/layout/landing-navbar"
import { Button } from "@/components/ui/button"

export default function GettingStartedDoc() {
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
                Start Writing
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#dfe9dd] bg-[#f7faf7] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#0f7a5c]">
              Getting started
            </div>
            <h1 className="text-4xl font-semibold leading-tight">Create your first Tamil draft in minutes.</h1>
            <p className="text-lg text-[#42584a]">
              Sign up, open the editor, and type in Tanglish or Tamil. Thamly auto-transliterates and corrects grammar, sandhi, and tone.
            </p>
          </div>

          <div className="space-y-6 rounded-[28px] border border-[#dfe9dd] bg-white p-6 shadow-[0_12px_36px_rgba(15,23,42,0.06)]">
            <h2 className="text-xl font-semibold text-[#0f2c21]">Steps</h2>
            <ol className="space-y-3 text-[#42584a]">
              {[
                "Sign up with email or Google.",
                "Open Drafts and click “New Draft.”",
                "Type in English (Tanglish) or Tamil. We show instant Tamil suggestions.",
                "Use tone modes (formal, news, academic) to refine output.",
                "Save drafts, copy, or continue editing with change logs.",
              ].map((step) => (
                <li key={step} className="flex items-start gap-2">
                  <Check className="mt-1 h-4 w-4 text-[#0f7a5c]" />
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-[#42584a]">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#dfe9dd] bg-[#f7faf7] px-3 py-1">
              <Sparkles className="h-4 w-4 text-[#0f7a5c]" />
              Tamil-first transliteration
            </span>
            <Link href="/contact" className="inline-flex items-center gap-2 rounded-full border border-[#dfe9dd] bg-white px-3 py-1 font-semibold text-[#0f2c21] hover:border-[#0f7a5c] hover:text-[#0f7a5c]">
              Talk to us
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
