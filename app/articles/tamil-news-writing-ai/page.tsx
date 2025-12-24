"use client"

import Link from "next/link"
import { LandingNavbar } from "@/components/layout/landing-navbar"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

const checklist = [
  "Tamil news writing tool with neutral, factual tone.",
  "Headline suggestions that stay short and precise.",
  "Sentence-by-sentence edits; no unwanted rewrites.",
  "News grammar checker for passive/neutral phrasing.",
  "English stays English until you choose to translate.",
]

export default function TamilNewsWritingAIPage() {
  return (
    <div className="min-h-screen bg-white text-[#0f2c21]">
      <LandingNavbar />
      <main className="space-y-12 px-6 py-16 lg:px-12">
        <section className="mx-auto max-w-5xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#dfe9dd] bg-[#f7faf7] px-4 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-[#0f7a5c]">
            Tamil News Writing AI
          </div>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            Tamil news editor AI for headlines, tone, and clean copy.
          </h1>
          <p className="max-w-3xl text-lg text-[#42584a]">
            Thamly’s News Mode is built for Tamil journalists: it keeps sentences tight, tone neutral, and headlines crisp.
            It corrects grammar without summarizing your story, and only translates when you ask it to.
          </p>
          <div className="flex flex-wrap gap-3 text-sm text-[#0f2c21]">
            {checklist.map((item) => (
              <span key={item} className="inline-flex items-start gap-2 rounded-full border border-[#dfe9dd] bg-white px-3 py-2">
                <Check className="mt-0.5 h-4 w-4 text-[#0f7a5c]" />
                {item}
              </span>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <Button asChild className="bg-[#0f7a5c] text-white hover:bg-[#0c6148]">
              <Link href="/auth/sign-up?redirectTo=/drafts">Try News Mode</Link>
            </Button>
            <Button variant="outline" asChild className="border-[#dfe9dd] text-[#0f2c21] hover:border-[#0f7a5c]">
              <Link href="/pricing">See plans</Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto grid max-w-5xl gap-8 rounded-[28px] border border-[#dfe9dd] bg-white p-8 shadow-[0_18px_50px_rgba(15,23,42,0.08)] lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-[#0f2c21]">Newsroom checklist inside Thamly</h2>
            <p className="text-sm text-[#42584a]">
              Use Thamly as your Tamil news writing tool: apply neutral phrasing, keep quotes intact, and avoid
              conversational endings. Headlines stay short; body copy is corrected sentence by sentence—no summaries or deletions.
            </p>
            <ul className="space-y-2 text-sm text-[#0f2c21]">
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-[#0f7a5c]" />
                News Tamil grammar checker for passive voice and clarity.
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-[#0f7a5c]" />
                AI headline suggestions that stay factual and crisp.
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-[#0f7a5c]" />
                Tamil editorial AI tool that respects your structure—no rewrites.
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-[#0f7a5c]" />
                English or Tanglish? It only translates when you choose.
              </li>
            </ul>
          </div>
          <div className="space-y-3 rounded-2xl border border-[#dfe9dd] bg-[#f7faf7] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f7a5c]">Try this</p>
            <p className="text-sm font-semibold text-[#0f2c21]">Paste a news lead:</p>
            <p className="rounded-xl border border-[#dfe9dd] bg-white px-4 py-3 text-sm text-[#42584a]">
              “today cm visited chennai metro site, meeting reporters later”
            </p>
            <p className="text-sm font-semibold text-[#0f2c21]">Thamly returns (neutral Tamil):</p>
            <p className="rounded-xl border border-[#dfe9dd] bg-white px-4 py-3 text-sm text-[#0f2c21]">
              “முதல்வர் இன்று சென்னை மெட்ரோ பணியிடத்தைப் பார்வையிட்டார்; பின்னர் செய்தியாளர்களை சந்தித்தார்.”
            </p>
            <p className="text-xs text-[#42584a]">No summary, no extra adjectives—just clean, reportable Tamil.</p>
          </div>
        </section>
      </main>
    </div>
  )
}
