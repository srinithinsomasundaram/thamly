"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, BookOpen, LifeBuoy, Mail, MessageCircle, Shield, Sparkles, ThumbsDown, ThumbsUp, Calendar } from "lucide-react"

import { LandingNavbar } from "@/components/layout/landing-navbar"
import { Button } from "@/components/ui/button"

const faqs = [
  {
    q: "How do I start?",
    a: "Create a free account, open the editor, and type in Tanglish or Tamil. We auto-correct grammar, sandhi, and tone.",
  },
  {
    q: "Is my text saved?",
    a: "Drafts save to your workspace. The live preview blocks are preview-only—no text stored there.",
  },
  {
    q: "How do I upgrade?",
    a: "From Pricing or Subscription pages, choose Pro. If signed in, we take you to /subscription/upgrade directly.",
  },
  {
    q: "Does it work for teams?",
    a: "Yes—Pro supports multi-user editing and higher limits. Contact us to unlock newsroom workflows.",
  },
]

export default function HelpPage() {
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null)

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
              Help
            </div>
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">We’re here to help you write better Tamil.</h1>
            <p className="mx-auto max-w-3xl text-lg text-[#42584a]">
              Docs, FAQs, and quick links to support. If you’re stuck, message us and we’ll reply within one business day.
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
                <Link href="/contact">
                  Contact us
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {[
            {
              title: "Guides",
              body: "Docs and examples for transliteration, tone, and newsroom workflows.",
              icon: BookOpen,
              href: "/docs",
              cta: "View docs",
            },
            {
              title: "Contact support",
              body: "Email or call us—share your workspace ID for faster help.",
              icon: Mail,
              href: "/contact",
              cta: "Contact",
            },
            {
              title: "Status & trust",
              body: "Privacy-first, no training on your drafts. Sandboxed previews by default.",
              icon: Shield,
              href: "/privacy",
              cta: "View privacy",
            },
          ].map((item) => (
            <div key={item.title} className="space-y-3 rounded-[20px] border border-[#dfe9dd] bg-white p-6 shadow-[0_12px_36px_rgba(15,23,42,0.06)]">
              <div className="inline-flex items-center justify-center rounded-2xl bg-[#0f7a5c]/10 p-3 text-[#0f7a5c]">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-[#0f2c21]">{item.title}</h3>
              <p className="text-sm text-[#42584a]">{item.body}</p>
              <Link href={item.href} className="inline-flex items-center gap-2 text-sm font-semibold text-[#0f7a5c] hover:text-[#0c6148]">
                {item.cta} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </section>

        <section className="mx-auto max-w-6xl space-y-6 rounded-[28px] border border-[#dfe9dd] bg-[#f7faf7] p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="space-y-2 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#0f7a5c]">FAQ</p>
            <h2 className="text-3xl font-semibold text-[#0f2c21]">Common questions</h2>
            <p className="text-[#42584a]">Short answers to keep you moving.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {faqs.map((item) => (
              <div key={item.q} className="space-y-2 rounded-[18px] border border-[#dfe9dd] bg-white p-4 text-left">
                <p className="text-base font-semibold text-[#0f2c21]">{item.q}</p>
                <p className="text-sm text-[#42584a]">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 md:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4 rounded-[24px] border border-[#dfe9dd] bg-white p-6 shadow-[0_12px_36px_rgba(15,23,42,0.06)]">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#0f7a5c]">
              <Sparkles className="h-4 w-4" />
              <span>Was this helpful?</span>
            </div>
            <p className="text-lg font-semibold text-[#0f2c21]">Tell us so we can respond faster.</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setFeedback("up")}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  feedback === "up"
                    ? "border-[#0f7a5c] bg-[#0f7a5c] text-white shadow-md shadow-[#0f7a5c]/40"
                    : "border-[#dfe9dd] bg-white text-[#0f2c21] hover:border-[#0f7a5c] hover:text-[#0f7a5c]"
                }`}
              >
                <ThumbsUp className="h-4 w-4" />
                Helpful
              </button>
              <button
                onClick={() => setFeedback("down")}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  feedback === "down"
                    ? "border-[#0f7a5c] bg-[#0f7a5c] text-white shadow-md shadow-[#0f7a5c]/40"
                    : "border-[#dfe9dd] bg-white text-[#0f2c21] hover:border-[#0f7a5c] hover:text-[#0f7a5c]"
                }`}
              >
                <ThumbsDown className="h-4 w-4" />
                Not yet
              </button>
            </div>
            {feedback && (
              <p className="text-sm text-[#42584a]">
                Thanks for letting us know. We’ll use this to improve our responses.
              </p>
            )}
          </div>

          <div className="space-y-3 rounded-[24px] border border-[#dfe9dd] bg-white p-6 shadow-[0_12px_36px_rgba(15,23,42,0.06)]">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#0f7a5c]">
              <LifeBuoy className="h-4 w-4" />
              <span>Quick actions</span>
            </div>
            <div className="space-y-2 text-sm text-[#42584a]">
              <Link href="mailto:support@thamly.app" className="flex items-center gap-2 rounded-xl border border-[#dfe9dd] bg-[#f7faf7] px-4 py-3 font-semibold text-[#0f2c21] hover:border-[#0f7a5c] hover:text-[#0f7a5c]">
                <MessageCircle className="h-4 w-4 text-[#0f7a5c]" />
                Email support — 1 business day
              </Link>
              <Link href="mailto:support@thamly.app?subject=Feature%20request" className="flex items-center gap-2 rounded-xl border border-[#dfe9dd] bg-[#f7faf7] px-4 py-3 font-semibold text-[#0f2c21] hover:border-[#0f7a5c] hover:text-[#0f7a5c]">
                <Sparkles className="h-4 w-4 text-[#0f7a5c]" />
                Request a feature
              </Link>
              <Link href="/contact" className="flex items-center gap-2 rounded-xl border border-[#dfe9dd] bg-[#f7faf7] px-4 py-3 font-semibold text-[#0f2c21] hover:border-[#0f7a5c] hover:text-[#0f7a5c]">
                <Calendar className="h-4 w-4 text-[#0f7a5c]" />
                Book a 15-min onboarding
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl rounded-[28px] border border-[#dfe9dd] bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#dfe9dd] bg-[#f7faf7] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#0f7a5c]">
              Need more?
            </div>
            <h3 className="text-2xl font-semibold text-[#0f2c21]">Chat with us.</h3>
            <p className="text-sm text-[#42584a]">
              We typically respond within one business day. Include your workspace ID for priority routing.
            </p>
            <div className="flex flex-wrap justify-center gap-3 text-sm text-[#42584a]">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#dfe9dd] bg-[#f7faf7] px-3 py-1">
                <MessageCircle className="h-4 w-4 text-[#0f7a5c]" />
                support@thamly.app
              </span>
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
