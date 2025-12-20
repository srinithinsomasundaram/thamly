import Link from "next/link"
import { ArrowLeft, ArrowRight, Sparkles, Check } from "lucide-react"

import { LandingNavbar } from "@/components/layout/landing-navbar"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "How Tanglish Becomes Pure Tamil with AI | Thamly",
  description: "Inside Thamly’s Tamil-first transliteration and grammar pipeline for turning Tanglish into polished Tamil.",
}

export default function ArticleTanglish() {
  return (
    <div className="min-h-screen bg-white text-[#0f2c21]">
      <LandingNavbar />
      <main className="space-y-10 px-6 py-16 lg:px-12">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          <div className="flex items-center justify-between">
            <Link href="/articles" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0f7a5c] hover:text-[#0c6148]">
              <ArrowLeft className="h-4 w-4" />
              Back to Articles
            </Link>
            <Button asChild size="sm" className="rounded-full bg-[#0f7a5c] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#0f7a5c]/30 hover:bg-[#0c6148]">
              <Link href="/auth/sign-up">
                Try Transliteration
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#dfe9dd] bg-[#f7faf7] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#0f7a5c]">
              Transliteration
            </div>
            <h1 className="text-4xl font-semibold leading-tight">How Tanglish becomes pure Tamil with AI.</h1>
            <p className="text-lg text-[#42584a]">
              A look at how Thamly maps English inputs to Tamil outputs while respecting grammar, sandhi, and tone.
            </p>
          </div>

          <div className="space-y-5 rounded-[28px] border border-[#dfe9dd] bg-white p-6 shadow-[0_12px_36px_rgba(15,23,42,0.06)]">
            <h2 className="text-xl font-semibold text-[#0f2c21]">What’s happening under the hood</h2>
            <p className="text-[#42584a]">
              We normalize English phonetics to Tamil script, then run grammar/sandhi passes tuned for Tamil. Tone templates help
              you choose formal, news, academic, or casual outputs without rewriting from scratch.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                "Phonetic mapping trained for Tamil names and place words.",
                "Sandhi fixes applied after transliteration to clean joins.",
                "Tone prompt library for formal, news, academic, and casual styles.",
                "Guardrails to avoid slang carryover when you want pure Tamil.",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm text-[#42584a]">
                  <Check className="mt-1 h-4 w-4 text-[#0f7a5c]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-[#42584a]">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#dfe9dd] bg-[#f7faf7] px-3 py-1">
              <Sparkles className="h-4 w-4 text-[#0f7a5c]" />
              Tamil-first transliteration
            </span>
            <Link href="/docs/transliteration" className="inline-flex items-center gap-2 rounded-full border border-[#dfe9dd] bg-white px-3 py-1 font-semibold text-[#0f2c21] hover:border-[#0f7a5c] hover:text-[#0f7a5c]">
              Transliteration tips
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#dfe9dd] bg-[#f7faf7] px-6 py-10 text-[#0f2c21]">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-2xl font-semibold">Thamly</p>
            <p className="text-sm text-[#42584a]">© 2025 Thamly — Tamil AI Writing Platform</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-[#42584a]">
            {["About", "Pricing", "Articles", "Contact", "Terms", "Privacy"].map((link) => (
              <Link key={link} href={`/${link.toLowerCase()}`} className="hover:text-[#0f7a5c]">
                {link}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
