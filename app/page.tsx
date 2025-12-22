"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, Check, ChevronRight, Lock, Sparkles, Star, Zap, Shield, Users, Globe, FileText, BarChart, Mail, Phone, MapPin } from "lucide-react"

import { LandingNavbar } from "@/components/layout/landing-navbar"
import { Button } from "@/components/ui/button"

const stats = [
  { label: "Users write faster", value: "92%" },
  { label: "Reduce grammar mistakes", value: "84%" },
  { label: "Feel confident", value: "71%" },
  { label: "Colleges & media clubs", value: "40+" },
]

const featurePillars = [
  { title: "Grammar & Spelling", detail: "Fix complex Tamil grammar instantly." },
  { title: "Smart Transliteration", detail: "Type English → pick pure Tamil." },
  { title: "Rewrite Modes", detail: "Formal, News, Academic, Casual, Clear tone templates." },
  { title: "AI Assistant", detail: "One suggestion box for tone, clarity, grammar." },
]

const demoSamples = [
  {
    label: "Help request",
    input: "unga help venum bro",
    output: "உங்கள் உதவி தேவைப்படுகிறது.",
  },
  {
    label: "News style",
    input: "chennai metro expansion speed ah nadakudhu",
    output: "சென்னை மெட்ரோ விரிவாக்கப் பணிகள் வேகமாக நடைபெற்று வருகின்றன.",
  },
  {
    label: "Greeting",
    input: "epdi irukeenga?",
    output: "எப்படி இருக்கீங்கள்?",
  },
  {
    label: "Formal ask",
    input: "meeting details share pannunga",
    output: "கூட்டத்தின் விவரங்களைப் பகிர்ந்து கொள்ளவும்.",
  },
]

export default function Home() {
  const [liveInput, setLiveInput] = useState("unga help venum bro")
  const [liveOutput, setLiveOutput] = useState("உங்கள் உதவி தேவைப்படுகிறது.")
  const [demoIndex, setDemoIndex] = useState(0)

  useEffect(() => {
    setLiveInput(demoSamples[demoIndex].input)
    setLiveOutput(demoSamples[demoIndex].output)
  }, [demoIndex])

  useEffect(() => {
    const id = setInterval(() => {
      setDemoIndex((prev) => (prev + 1) % demoSamples.length)
    }, 3200)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="min-h-screen bg-white text-[#0f2c21]">
      <LandingNavbar />

      <main className="space-y-32 pb-20 pt-16">
        {/* Hero Section */}
        <section className="relative px-6 overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-teal-50/30 via-white to-emerald-50/20" />
          <div className="absolute inset-0">
            <div className="absolute top-10 left-10 h-72 w-72 rounded-full bg-gradient-to-tr from-teal-200/30 to-emerald-200/20 blur-3xl" />
            <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-gradient-to-bl from-teal-300/20 to-cyan-200/10 blur-3xl" />
            <div className="absolute top-1/2 left-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-teal-100/20 to-emerald-100/10 blur-3xl" />
          </div>

          <div className="relative z-10 mx-auto max-w-7xl space-y-8 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200/60 bg-teal-50/80 px-4 py-2 text-sm font-medium text-teal-700 backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em]">Presenting Thamly AI</span>
            </div>

            {/* Main headline */}
            <div className="space-y-6">
              <h1 className="text-5xl font-bold leading-tight text-[#0f2c21] sm:text-6xl lg:text-7xl">
                The AI Writing Partner
                <span className="block bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                  Perfect for Tamil
                </span>
              </h1>
              <p className="mx-auto max-w-4xl text-xl text-[#42584a] sm:text-2xl leading-relaxed">
                Transform your Tamil writing with AI-powered grammar correction, intelligent transliteration,
                tone adjustment, and professional rewriting tools. Built for students, professionals, and creators.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Button
                asChild
                className="group relative overflow-hidden rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 px-8 py-4 text-lg font-semibold text-white shadow-2xl shadow-teal-600/25 transition-all hover:shadow-teal-600/40 hover:scale-105"
              >
                <Link href="/auth/sign-up?redirectTo=/drafts">
                  <span className="relative z-10 flex items-center gap-2">
                    Start Writing Free
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              </Button>
              <Button
                variant="outline"
                className="rounded-full border-2 border-teal-200/60 bg-white/80 px-8 py-4 text-lg font-semibold text-teal-700 backdrop-blur-sm transition-all hover:border-teal-300 hover:bg-teal-50"
              >
                <Link href="/pricing">View Pricing Plans</Link>
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="pt-8">
              <div className="flex flex-wrap justify-center gap-8 text-sm text-[#6b7280]">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-teal-600" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-teal-600" />
                  <span>Instant results</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-teal-600" />
                  <span>100% private & secure</span>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* Live Editor Demo */}
        <section className="px-6">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[36px] border border-[#dfe9dd] bg-gradient-to-br from-[#f1fff8] via-white to-[#f7faf7] text-[#0f2c21] shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <div className="absolute inset-0 opacity-70">
              <div className="absolute -left-16 -top-12 h-64 w-64 rounded-full bg-[#0f7a5c]/20 blur-3xl" />
              <div className="absolute right-10 top-6 h-52 w-52 rounded-full bg-[#0f7a5c]/12 blur-3xl" />
              <div className="absolute bottom-0 -right-20 h-80 w-80 rounded-full bg-[#82c7a5]/16 blur-3xl" />
            </div>

            <div className="relative grid gap-10 px-8 py-12 lg:grid-cols-[1.05fr_minmax(360px,0.9fr)] lg:px-12 lg:py-16">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#dfe9dd] bg-white/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#0f7a5c] shadow-sm shadow-[#dfe9dd]">
                  <Sparkles className="h-4 w-4" />
                  <span>Live Editor Demo</span>
                </div>
                <div className="space-y-3">
                  <h2 className="text-3xl font-bold sm:text-4xl">Instant Tamil previews in motion.</h2>
                  <p className="text-lg text-[#42584a]">
                    Watch Tanglish turn into polished Tamil in a safe, preview-only demo.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 text-[12px] uppercase tracking-[0.24em] text-[#0f7a5c]">
                  <span className="rounded-full border border-[#dfe9dd] bg-white/80 px-3 py-1">Preview-only</span>
                  <span className="rounded-full border border-[#dfe9dd] bg-white/80 px-3 py-1">Tamil-first UX</span>
                  <span className="rounded-full border border-[#dfe9dd] bg-white/80 px-3 py-1">No typing needed</span>
                </div>
              </div>

              <div className="space-y-4 rounded-[28px] border border-[#dfe9dd] bg-white/90 p-6 shadow-2xl shadow-[#dfe9dd]/50 backdrop-blur">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#0f7a5c]">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#0f7a5c] shadow-[0_0_0_6px_rgba(15,122,92,0.24)]" />
                    Instant preview
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="rounded-2xl border border-[#dfe9dd] bg-[#f7faf7] p-4 shadow-inner shadow-[#dfe9dd]/50">
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-[#42584a]">
                      <span>Tanglish sample</span>
                      <span className="rounded-full bg-white px-3 py-1 text-[11px] text-[#0f7a5c] shadow-sm shadow-[#dfe9dd]">Live sample</span>
                    </div>
                    <div
                      key={`input-${demoIndex}`}
                      className="mt-3 min-h-[96px] rounded-xl border border-[#dfe9dd] bg-white px-4 py-3 text-base text-[#0f2c21] shadow-inner shadow-[#dfe9dd]/50 transition-all duration-500 ease-out"
                    >
                      <span>{liveInput}</span>
                      <span className="ml-1 inline-block h-4 w-[2px] align-middle bg-[#0f7a5c] opacity-80 animate-pulse" />
                    </div>
                  </div>

                  <div
                    key={`output-${demoIndex}`}
                    className="rounded-2xl border border-[#dfe9dd] bg-white p-4 shadow-inner shadow-[#dfe9dd]/60 transition-all duration-500 ease-out"
                  >
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0f7a5c]">
                      <Check className="h-3.5 w-3.5 text-[#0f7a5c]" />
                      Instant Tamil Preview
                    </div>
                    <p className="mt-2 text-lg font-semibold leading-relaxed text-[#0f2c21]">{liveOutput}</p>
                    <p className="mt-1 text-xs text-[#42584a]">Preview-only corrections—no text stored.</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 text-[12px] text-[#42584a]">
                  <span className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-[#0f7a5c]" />
                    Private, local preview
                  </span>
                  <span className="rounded-full border border-[#dfe9dd] bg-white px-3 py-1 text-[#0f2c21]">Made for Tamil writers</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Showcase */}
        <section className="px-6">
          <div className="mx-auto max-w-7xl space-y-12">
            {/* Section header */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-200/60 bg-teal-50/80 px-4 py-2 text-sm font-medium text-teal-700">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-[0.2em]">Powerful Features</span>
              </div>
              <h2 className="text-4xl font-bold text-[#0f2c21] sm:text-5xl">
                Everything you need to
                <span className="block bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                  Master Tamil Writing
                </span>
              </h2>
              <p className="mx-auto max-w-3xl text-xl text-[#42584a]">
                From grammar correction to tone adjustment, our AI-powered tools help you write better Tamil content faster.
              </p>
            </div>

            {/* Feature cards */}
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: Check,
                  title: "Grammar & Spelling",
                  description: "Advanced AI catches complex Tamil grammar errors, spelling mistakes, and punctuation issues instantly.",
                  gradient: "from-teal-500 to-emerald-500"
                },
                {
                  icon: Globe,
                  title: "Smart Transliteration",
                  description: "Type in English, get perfect Tamil output. Our transliteration understands context and nuances.",
                  gradient: "from-emerald-500 to-teal-500"
                },
                {
                  icon: FileText,
                  title: "Tone Adjustment",
                  description: "Switch between formal, casual, academic, or professional tones with a single click.",
                  gradient: "from-teal-600 to-cyan-500"
                },
                {
                  icon: Zap,
                  title: "Instant Rewrites",
                  description: "Get AI-powered suggestions to improve clarity, flow, and impact of your Tamil content.",
                  gradient: "from-cyan-500 to-teal-600"
                }
              ].map((feature, index) => (
                <div
                  key={feature.title}
                  className="group relative overflow-hidden rounded-3xl border border-teal-100 bg-white p-8 shadow-xl shadow-teal-100/20 transition-all hover:shadow-2xl hover:shadow-teal-200/30"
                >
                  {/* Background decoration */}
                  <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br ${feature.gradient} opacity-10 blur-2xl transition-opacity group-hover:opacity-20`} />

                  {/* Icon */}
                  <div className={`inline-flex rounded-2xl bg-gradient-to-br ${feature.gradient} p-3 text-white shadow-lg`}>
                    <feature.icon className="h-6 w-6" />
                  </div>

                  {/* Content */}
                  <div className="mt-6 space-y-3">
                    <h3 className="text-xl font-bold text-[#0f2c21]">{feature.title}</h3>
                    <p className="text-[#42584a] leading-relaxed">{feature.description}</p>
                  </div>

                  {/* Hover arrow */}
                  <div className="mt-6 flex items-center gap-2 text-teal-600 opacity-0 transition-all group-hover:opacity-100">
                    <span className="text-sm font-semibold">Learn more</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6">
          <div className="mx-auto max-w-6xl space-y-10">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#dfe9dd] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.5em] text-[#0f7a5c] shadow-sm shadow-[#dfe9dd]/60">
                Pricing
              </div>
              <h2 className="text-3xl font-semibold text-[#0f2c21] sm:text-4xl">Two simple plans</h2>
              <p className="text-[#42584a]">Try free, upgrade when you need limitless checks and rewrite modes.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-5 rounded-[30px] border border-[#dfe9dd] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#0f2c21]/70">Free</p>
                    <h3 className="text-2xl font-semibold text-[#0f2c21]">Perfect for everyday writing</h3>
                  </div>
                  <span className="rounded-full border border-[#dfe9dd] bg-[#f7faf7] px-3 py-1 text-[11px] font-semibold text-[#0f7a5c]">
                    ₹0 / mo
                  </span>
                </div>
                <div className="space-y-2 text-sm text-[#42584a]">
                  {["30 checks/day", "Transliteration", "Grammar", "Spelling"].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-[#0f7a5c]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <Button
                  asChild
                  variant="outline"
                  className="w-full rounded-full border-[#dfe9dd] bg-white px-6 py-3 text-sm font-semibold text-[#0f2c21] shadow-sm hover:border-[#0f7a5c] hover:text-[#0f7a5c]"
                >
                  <Link href="/auth/sign-up">Start Free</Link>
                </Button>
              </div>

              <div className="overflow-hidden rounded-[30px] border border-[#0f7a5c] bg-white p-6 text-[#0f2c21] shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#0f7a5c]">Pro</p>
                      <h3 className="text-2xl font-semibold">Best for students & professionals</h3>
                    </div>
                    <span className="rounded-full bg-[#0f7a5c] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white shadow-md shadow-[#0f7a5c]/40">
                      Popular
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-[#42584a]">
                    {["Unlimited checks", "News mode", "Tone rewrite", "Faster responses", "Change log"].map((item) => (
                      <div key={item} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-[#0f7a5c]" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    asChild
                    className="w-full rounded-full bg-[#0f7a5c] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0f7a5c]/50 transition hover:brightness-105"
                  >
                    <Link href="/pricing">Upgrade to Pro</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>


    {/* Final CTA Section */}
        <section className="relative px-6 overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-teal-50/50 via-emerald-50/30 to-white" />
          <div className="absolute inset-0">
            <div className="absolute top-20 right-20 h-64 w-64 rounded-full bg-gradient-to-bl from-teal-300/30 to-emerald-200/20 blur-3xl" />
            <div className="absolute bottom-10 left-10 h-80 w-80 rounded-full bg-gradient-to-tr from-emerald-300/20 to-teal-200/10 blur-3xl" />
          </div>

          <div className="relative z-10 mx-auto max-w-6xl rounded-3xl border border-teal-100 bg-gradient-to-br from-white/90 to-teal-50/80 p-12 shadow-2xl shadow-teal-200/20 backdrop-blur-sm lg:p-16">
            <div className="space-y-8 text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-200/60 bg-teal-50/80 px-4 py-2 text-sm font-medium text-teal-700 backdrop-blur-sm">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-[0.2em]">Ready to Transform Your Writing?</span>
              </div>

              {/* Main content */}
              <div className="space-y-6">
                <h2 className="text-4xl font-bold text-[#0f2c21] sm:text-5xl lg:text-6xl">
                  Start Writing Better
                  <span className="block bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                    Tamil Today
                  </span>
                </h2>
                <p className="mx-auto max-w-3xl text-xl text-[#42584a] leading-relaxed">
                  Join thousands of Tamil writers who are already using AI to create better content,
                  improve their grammar, and save hours of editing time.
                </p>
              </div>

              {/* CTA buttons */}
              <div className="flex flex-wrap justify-center gap-6">
                <Button
                  asChild
                  className="group relative overflow-hidden rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 px-10 py-4 text-lg font-semibold text-white shadow-2xl shadow-teal-600/25 transition-all hover:shadow-teal-600/40 hover:scale-105"
                >
                  <Link href="/auth/sign-up">
                    <span className="relative z-10 flex items-center gap-3">
                      Start Writing Free
                      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full border-2 border-teal-200/60 bg-white/80 px-10 py-4 text-lg font-semibold text-teal-700 backdrop-blur-sm transition-all hover:border-teal-300 hover:bg-teal-50"
                  asChild
                >
                  <Link href="/pricing">View Pricing Plans</Link>
                </Button>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap justify-center gap-8 text-sm text-[#6b7280]">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-teal-600" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-teal-600" />
                  <span>Instant setup</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-teal-600" />
                  <span>Privacy-first</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Support Section */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-6xl text-center space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200/60 bg-teal-50/80 px-4 py-2 text-sm font-medium text-teal-700">
              <Mail className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em]">Get in Touch</span>
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-[#0f2c21] sm:text-4xl">Questions? We're here to help.</h2>
              <p className="mx-auto max-w-2xl text-lg text-[#42584a]">
                Our support team is available to assist you with any questions about Thamly AI.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-[#42584a]">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-teal-600" />
                <a href="mailto:hello@thamly.in" className="hover:text-teal-600 transition-colors">
                  hello@thamly.in
                </a>
              </div>
          
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
