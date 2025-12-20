import Link from "next/link"
import { ArrowLeft, ArrowRight, Clock, Check } from "lucide-react"

import { LandingNavbar } from "@/components/layout/landing-navbar"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Writing for Newsrooms: Speed + Accuracy | Thamly",
  description: "Tips for Tamil reporters to file fast with accurate transliteration, sandhi, and tone.",
}

export default function NewsroomsArticle() {
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
              <Link href="/subscription/upgrade">
                Speed up filing
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#dfe9dd] bg-[#f7faf7] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#0f7a5c]">
              Newsrooms
            </div>
            <h1 className="text-4xl font-semibold leading-tight">Writing for newsrooms: speed + accuracy.</h1>
            <p className="text-lg text-[#42584a]">
              File faster with transliteration, grammar, and tone modes tuned for Tamil reporters.
            </p>
          </div>

          <div className="space-y-5 rounded-[28px] border border-[#dfe9dd] bg-white p-6 shadow-[0_12px_36px_rgba(15,23,42,0.06)]">
            <h2 className="text-xl font-semibold text-[#0f2c21]">Workflow for fast filing</h2>
            <div className="space-y-3 text-[#42584a]">
              <p className="flex items-center gap-2 text-sm font-semibold text-[#0f2c21]">
                <Clock className="h-4 w-4 text-[#0f7a5c]" />
                Under deadline? Use these steps:
              </p>
              <ul className="space-y-2 text-sm">
                {[
                  "Draft in English quickly, keep nouns proper in Tamil.",
                  "Apply news tone to get formal output instantly.",
                  "Run rewrite to tighten intros and leads.",
                  "Use change logs to revert if AI suggestions over-edit.",
                ].map((tip) => (
                  <li key={tip} className="flex items-start gap-2">
                    <Check className="mt-1 h-4 w-4 text-[#0f7a5c]" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
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
