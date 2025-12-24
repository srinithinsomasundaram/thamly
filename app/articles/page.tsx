"use client"

import Link from "next/link"
import { ArrowRight, BookOpen, Clock } from "lucide-react"

import { LandingNavbar } from "@/components/layout/landing-navbar"
import { Button } from "@/components/ui/button"

const articles = [
  {
    title: "How Tanglish Becomes Pure Tamil with AI",
    summary: "A behind-the-scenes look at transliteration, grammar checks, and tone control built for Tamil writers.",
    readTime: "5 min read",
    href: "/articles/how-tanglish-becomes-pure-tamil",
  },
  {
    title: "Writing for Newsrooms: Speed + Accuracy",
    summary: "Tips for reporters to keep Tamil copy sharp while filing on deadline.",
    readTime: "4 min read",
    href: "/articles/writing-for-newsrooms",
  },
  {
    title: "Academic Writing in Tamil: A Style Guide",
    summary: "Templates and rewrite modes that keep citations, tone, and clarity consistent.",
    readTime: "6 min read",
    href: "/articles/academic-writing-tamil",
  },
  {
    title: "Tamil AI Writing Tool: Grammar, Spelling, and Transliteration",
    summary: "How to use Thamly’s Tamil grammar checker, spelling fixes, and Tanglish-to-Tamil transliteration for clean copy.",
    readTime: "5 min read",
    href: "/articles/tamil-ai-writing-tool",
  },
  {
    title: "Tamil News Writing AI: Headlines, Tone, and Clarity",
    summary: "A newsroom-ready checklist for Tamil journalists: neutral tone, tight headlines, and sentence-by-sentence edits.",
    readTime: "5 min read",
    href: "/articles/tamil-news-writing-ai",
  },
  {
    title: "How to Check Tamil Grammar Online Using AI",
    summary: "Step-by-step guide to using a Tamil grammar checker and AI proofreader for clean, error-free Tamil writing.",
    readTime: "5 min read",
    href: "/articles/how-to-check-tamil-grammar-online",
  },
  {
    title: "How to Type Tamil Without a Tamil Keyboard",
    summary: "Use Tamil typing AI and transliteration to write Tamil anywhere—no keyboard layouts needed.",
    readTime: "4 min read",
    href: "/articles/how-to-type-tamil-without-keyboard",
  },
  {
    title: "Tamil Voice to Text: Dictate in Tamil with AI",
    summary: "Use Tamil voice-to-text AI to transcribe speech into clean Tamil, fix grammar, and apply news or formal tone.",
    readTime: "4 min read",
    href: "/articles/tamil-voice-to-text-ai",
  },
]

export default function ArticlesPage() {
  return (
    <div className="min-h-screen bg-white text-[#0f2c21]">
      <LandingNavbar />
      <main className="space-y-12 px-6 py-16 lg:px-12">
        <section className="mx-auto max-w-6xl space-y-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#dfe9dd] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.5em] text-[#0f7a5c] shadow-sm shadow-[#dfe9dd]/60">
            Articles
          </div>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">Learn faster. Write better Tamil.</h1>
          <p className="mx-auto max-w-3xl text-lg text-[#42584a]">
            Short reads on transliteration, newsroom workflows, academic tone, and everything we’re learning from Tamil writers.
          </p>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {articles.map((article) => (
            <div
              key={article.title}
              className="flex h-full flex-col justify-between rounded-[28px] border border-[#dfe9dd] bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#0f7a5c]">
                  <BookOpen className="h-4 w-4" />
                  <span>{article.readTime}</span>
                </div>
                <h3 className="text-xl font-semibold text-[#0f2c21]">{article.title}</h3>
                <p className="text-sm text-[#42584a]">{article.summary}</p>
              </div>
              <Link
                href={article.href}
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#0f7a5c] hover:text-[#0a5a45]"
              >
                Read article <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </section>

        <section className="mx-auto flex max-w-6xl flex-col items-center gap-4 rounded-[32px] border border-[#dfe9dd] bg-[#f7faf7] p-8 text-center shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#dfe9dd] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#0f7a5c] shadow-sm shadow-[#dfe9dd]/60">
            Stay in the loop
          </div>
          <h2 className="text-2xl font-semibold">Get new Tamil writing guides in your inbox.</h2>
          <p className="max-w-2xl text-sm text-[#42584a]">
            We’ll share practical tips, templates, and product updates—no spam, just value for Tamil-first creators.
          </p>
          <Button
            asChild
            className="rounded-full bg-[#0f7a5c] px-6 py-3 text-sm font-semibold text-white shadow-md shadow-[#0f7a5c]/30 hover:bg-[#0c6148]"
          >
            <Link href="/auth/sign-up">Start Writing Free</Link>
          </Button>
          <div className="flex items-center gap-2 text-xs text-[#42584a]">
            <Clock className="h-4 w-4 text-[#0f7a5c]" />
            <span>Monthly digest — unsubscribe anytime</span>
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
