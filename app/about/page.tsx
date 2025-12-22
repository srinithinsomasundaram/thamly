"use client"

import Link from "next/link"
import { Sparkles, Shield, Users, PenSquare, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"

const highlights = [
  { icon: <Sparkles className="h-5 w-5 text-emerald-600" />, title: "Tamil-first AI", desc: "Built for Tamil, Tanglish, and bilingual writers with context-aware rewrites." },
  { icon: <PenSquare className="h-5 w-5 text-emerald-600" />, title: "Quality at speed", desc: "Live transliteration, grammar fixes, tone controls, and news-ready rewrites." },
  { icon: <Shield className="h-5 w-5 text-emerald-600" />, title: "Trust & privacy", desc: "Your drafts stay yours. We keep things private and transparent." },
  { icon: <Users className="h-5 w-5 text-emerald-600" />, title: "Built for teams", desc: "From students to newsrooms, shared workflows are coming online steadily." },
]

const stats = [
  { label: "Tamil-first checks served", value: "1M+" },
  { label: "Avg. writing speedup", value: "2.3x" },
  { label: "Customer trust", value: "Privacy-first" },
  { label: "Team size", value: "Lean & focused" },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-[#0f2c21]">
      <div className="relative overflow-hidden border-b border-[#dfe9dd] bg-gradient-to-br from-[#f4fffa] via-white to-[#f2fbf6]">
        <div className="absolute inset-0">
          <div className="absolute -left-32 top-10 h-80 w-80 rounded-full bg-emerald-200/25 blur-3xl" />
          <div className="absolute right-10 bottom-0 h-96 w-96 rounded-full bg-teal-200/20 blur-3xl" />
        </div>
        <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16 lg:flex-row lg:items-center lg:px-10">
          <div className="space-y-6 lg:w-1/2">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#dfe9dd] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#0f7a5c] shadow-sm shadow-[#dfe9dd]">
              <Globe className="h-4 w-4" />
              About Thamly
            </div>
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
              Writing Tamil shouldn’t feel like a hurdle.
              <span className="block bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                We’re building an AI partner that feels native.
              </span>
            </h1>
            <p className="text-lg text-[#42584a]">
              Thamly is a Tamil-first writing platform focused on clarity, correctness, and respect for the language.
              From Tanglish transliteration to newsroom-ready tone, we help you move ideas from draft to publish quickly.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="bg-[#0f7a5c] text-white hover:bg-[#0c6148]">
                <Link href="/editor">Start writing</Link>
              </Button>
              <Button variant="outline" asChild className="border-[#dfe9dd] text-[#0f2c21] hover:bg-[#f1fff8]">
                <Link href="/pricing">View pricing</Link>
              </Button>
            </div>
          </div>
          <div className="lg:w-1/2">
            <div className="grid gap-4 rounded-3xl border border-[#dfe9dd] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)] sm:grid-cols-2">
              {stats.map((item) => (
                <div key={item.label} className="rounded-2xl border border-[#e8f2ea] bg-[#f7faf7] p-4">
                  <p className="text-sm text-[#42584a]">{item.label}</p>
                  <p className="mt-2 text-2xl font-bold text-[#0f2c21]">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-12 px-6 py-16 lg:px-10">
        <div className="grid gap-6 sm:grid-cols-2">
          {highlights.map((item) => (
            <div key={item.title} className="rounded-3xl border border-[#dfe9dd] bg-white p-5 shadow-sm hover:shadow-[0_12px_36px_rgba(15,23,42,0.08)] transition-shadow">
              <div className="flex items-center gap-3">
                {item.icon}
                <h3 className="text-lg font-semibold text-[#0f2c21]">{item.title}</h3>
              </div>
              <p className="mt-2 text-sm text-[#42584a]">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-8 rounded-3xl border border-[#dfe9dd] bg-[#f7faf7] p-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold text-[#0f2c21]">Our promise</h2>
            <p className="text-[#42584a]">
              Thamly is opinionated about Tamil quality, speed, and user trust. We keep drafts private, avoid surprise charges,
              and ship iteratively with real user feedback from students, writers, and news teams.
            </p>
            <ul className="space-y-2 text-sm text-[#0f2c21]">
              <li>• Clear Tamil corrections with transparent reasoning</li>
              <li>• Respect for tone: formal, news, academic, email, or casual</li>
              <li>• Built-in controls for privacy and data retention</li>
              <li>• Fast feedback loops for teams and classrooms</li>
            </ul>
          </div>
          <div className="space-y-3 rounded-2xl border border-[#dfe9dd] bg-white p-5 shadow-inner shadow-[#dfe9dd]/50">
            <h3 className="text-lg font-semibold text-[#0f2c21]">Who we’re for</h3>
            <p className="text-sm text-[#42584a]">
              Newsrooms, students, educators, and anyone writing in Tamil or Tanglish. If you value clear Tamil without
              wrestling with tooling, Thamly is designed for you.
            </p>
            <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-[#0f7a5c]">
              <span className="rounded-full border border-[#dfe9dd] bg-white px-3 py-1">News</span>
              <span className="rounded-full border border-[#dfe9dd] bg-white px-3 py-1">Academia</span>
              <span className="rounded-full border border-[#dfe9dd] bg-white px-3 py-1">Students</span>
              <span className="rounded-full border border-[#dfe9dd] bg-white px-3 py-1">Teams</span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-[#dfe9dd] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-[#0f2c21]">Ready to write in Tamil with less friction?</h3>
              <p className="text-sm text-[#42584a]">Open the editor and see how Thamly handles Tanglish, tone, and news-ready Tamil.</p>
            </div>
            <div className="flex gap-3">
              <Button asChild className="bg-[#0f7a5c] text-white hover:bg-[#0c6148]">
                <Link href="/editor">Open editor</Link>
              </Button>
              <Button variant="outline" asChild className="border-[#dfe9dd] text-[#0f2c21] hover:bg-[#f1fff8]">
                <Link href="/pricing">Compare plans</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
