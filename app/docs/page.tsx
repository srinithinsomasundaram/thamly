"use client"

import Link from "next/link"
import { ArrowRight, BookOpen, FileText, ListChecks, Sparkles } from "lucide-react"

import { LandingNavbar } from "@/components/layout/landing-navbar"
import { Button } from "@/components/ui/button"

const guides = [
  {
    title: "Getting started",
    description: "Sign up, create a draft, and see Tanglish → Tamil in seconds.",
    href: "/docs/getting-started",
    icon: Sparkles,
  },
  {
    title: "Transliteration tips",
    description: "Type in English, choose pure Tamil outputs with tone-aware prompts.",
    href: "/docs/transliteration",
    icon: FileText,
  },
]

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-white text-[#0f2c21]">
      <LandingNavbar />
      <main className="space-y-12 px-6 py-16 lg:px-12">
        <section className="relative overflow-hidden rounded-[32px] border border-[#dfe9dd] bg-gradient-to-br from-[#f1fff8] via-white to-[#f7faf7] p-10 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="absolute inset-0">
            <div className="absolute -left-16 -top-12 h-64 w-64 rounded-full bg-[#0f7a5c]/12 blur-3xl" />
            <div className="absolute right-10 top-6 h-52 w-52 rounded-full bg-[#0f7a5c]/10 blur-3xl" />
          </div>
          <div className="relative space-y-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#dfe9dd] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-[#0f7a5c] shadow-sm shadow-[#dfe9dd]/60">
              Docs
            </div>
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">Thamly docs & guides.</h1>
            <p className="mx-auto max-w-3xl text-lg text-[#42584a]">
              Learn how to write Tamil faster with transliteration, tone, and rewrite modes. Built for students, reporters, and teams.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                asChild
                className="rounded-full bg-[#0f7a5c] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0f7a5c]/40 hover:bg-[#0c6148]"
              >
                <Link href="/auth/sign-up">
                  Start Writing Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-full border-[#dfe9dd] bg-white px-6 py-3 text-sm font-semibold text-[#0f2c21] shadow-sm hover:border-[#0f7a5c] hover:text-[#0f7a5c]"
              >
                <Link href="/help">
                  Visit Help
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl space-y-6">
          <div className="space-y-2 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#0f7a5c]">Guides</p>
            <h2 className="text-3xl font-semibold text-[#0f2c21]">Pick a starting point</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {guides.map((guide) => (
              <Link
                key={guide.title}
                href={guide.href}
                className="group space-y-3 rounded-[20px] border border-[#dfe9dd] bg-white p-6 shadow-[0_12px_36px_rgba(15,23,42,0.06)] transition hover:border-[#0f7a5c]"
              >
                <div className="inline-flex items-center justify-center rounded-2xl bg-[#0f7a5c]/10 p-3 text-[#0f7a5c]">
                  <guide.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-[#0f2c21]">{guide.title}</h3>
                <p className="text-sm text-[#42584a]">{guide.description}</p>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#0f7a5c] group-hover:text-[#0c6148]">
                  Read guide <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl rounded-[28px] border border-[#dfe9dd] bg-[#f7faf7] p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-3 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#dfe9dd] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#0f7a5c] shadow-sm">
              Coming soon
            </div>
            <h3 className="text-2xl font-semibold text-[#0f2c21]">API & integrations</h3>
            <p className="text-sm text-[#42584a]">
              We’re shipping REST snippets and SDK samples for auth + Razorpay flows. Tell us what you need next.
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-xs font-semibold uppercase tracking-[0.2em]">
              <Link href="/contact" className="rounded-full border border-[#dfe9dd] bg-white px-3 py-1.5 text-[#0f2c21] hover:border-[#0f7a5c] hover:text-[#0f7a5c]">
                Request an integration
              </Link>
              <Link href="/help" className="rounded-full border border-[#dfe9dd] bg-white px-3 py-1.5 text-[#0f2c21] hover:border-[#0f7a5c] hover:text-[#0f7a5c]">
                Ask a question
              </Link>
            </div>
          </div>
        </section>
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
