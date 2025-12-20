"use client"

import Link from "next/link"
import { ArrowRight, MessageCircle } from "lucide-react"

import { LandingNavbar } from "@/components/layout/landing-navbar"
import { Button } from "@/components/ui/button"

export default function SupportPage() {
  const supportChannels = [
    {
      title: "Ask product questions",
      description: "support@thamly.app · Chat with our crew for product demos and onboarding help.",
      action: "Email support",
      href: "mailto:support@thamly.app",
    },
    {
      title: "Billing or upgrade help",
      description: "support@thamly.com · Fast responses for plans, invoices, and Pro upgrades.",
      action: "Contact billing",
      href: "mailto:support@thamly.com",
    },
    {
      title: "Need urgent help?",
      description: "Message our team anytime with workspace ID and we’ll route to on-call engineers.",
      action: "Message support",
      href: "mailto:support@thamly.app",
    },
  ]

  return (
    <div className="min-h-screen bg-white text-[#0f2c21]">
      <LandingNavbar />
      <main className="space-y-12 px-6 py-16 lg:px-12">
        <section className="mx-auto max-w-6xl space-y-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.6em] text-[#0f2c21]/60">Support</p>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            Here to help you write Tamil better, faster, and safer.
          </h1>
          <p className="mx-auto max-w-3xl text-lg text-[#42584a]">
            Our support team partners with creators, journalists, students, and teams to keep Thamly running smoothly.
            Email us, share your workspace ID, or book a walkthrough any time.
          </p>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {supportChannels.map((channel) => (
            <div key={channel.title} className="space-y-4 rounded-[28px] border border-[#dfe9dd] bg-[#f7fbf7] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-6 w-6 text-[#0f2c21]" />
                <h3 className="text-lg font-semibold text-[#0f2c21]">{channel.title}</h3>
              </div>
              <p className="text-sm text-[#42584a]">{channel.description}</p>
              <Link
                href={channel.href}
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#0f2c21] hover:text-[#0f2c21]/80"
              >
                {channel.action} <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ))}
        </section>

        <section className="mx-auto max-w-6xl rounded-[32px] border border-[#dfe9dd] bg-white p-8 text-left shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <h2 className="text-2xl font-semibold text-[#0f2c21]">Need Documentation?</h2>
          <p className="mt-3 text-sm text-[#42584a]">
            Check our docs for onboarding guides, API examples, and admin controls. Prefer a live walkthrough? Schedule a
            session via our help desk and we’ll respond within one business day.
          </p>
          <div className="mt-6">
            <Button
              asChild
              variant="outline"
              className="rounded-full border border-[#dfe9dd] px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#0f2c21]"
            >
              <Link href="/docs">View docs</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  )
}
