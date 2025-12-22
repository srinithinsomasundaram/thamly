"use client"

import Link from "next/link"
import { Mail, Phone, MapPin, ArrowRight, Check, Clock } from "lucide-react"
import { useState } from "react"

import { LandingNavbar } from "@/components/layout/landing-navbar"
import { Button } from "@/components/ui/button"

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "sent">("idle")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    const payload = {
      fullName: formData.get("fullName") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      topic: formData.get("topic") as string,
      message: formData.get("message") as string,
    }

    fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body?.error || "Failed to send message.")
        }
        setStatus("sent")
      })
      .catch((err: Error) => {
        setError(err.message)
        setStatus("idle")
      })
      .finally(() => setSubmitting(false))
  }

  return (
    <div className="min-h-screen bg-white text-[#0f2c21]">
      <LandingNavbar />
      <main className="space-y-12 px-6 py-16 lg:px-12">
        <section className="mx-auto max-w-6xl space-y-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#dfe9dd] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.5em] text-[#0f7a5c] shadow-sm shadow-[#dfe9dd]/60">
            Contact
          </div>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">Talk to the Thamly team.</h1>
          <p className="mx-auto max-w-3xl text-lg text-[#42584a]">
            Ask us anything about Tamil-first writing, pricing, or onboarding. We respond within one business day.
          </p>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.2fr_0.9fr]">
          <div className="space-y-4 rounded-[28px] border border-[#dfe9dd] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#0f7a5c]">Contact Form</p>
                <h2 className="text-2xl font-semibold">Share your details</h2>
              </div>
              {status === "sent" && (
                <span className="inline-flex items-center gap-2 rounded-full bg-[#f1fff8] px-3 py-1 text-xs font-semibold text-[#0f7a5c]">
                  <Check className="h-4 w-4" />
                  Sent
                </span>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1 text-sm font-semibold text-[#0f2c21]">
                  Full name
                  <input
                    required
                    name="fullName"
                    type="text"
                    placeholder="Arun Kumar"
                    className="mt-1 w-full rounded-xl border border-[#dfe9dd] bg-white px-4 py-3 text-sm text-[#0f2c21] shadow-inner shadow-[#dfe9dd]/40 focus:border-[#0f7a5c] focus:outline-none"
                  />
                </label>
                <label className="space-y-1 text-sm font-semibold text-[#0f2c21]">
                  Email
                  <input
                    required
                    name="email"
                    type="email"
                    placeholder="you@domain.com"
                    className="mt-1 w-full rounded-xl border border-[#dfe9dd] bg-white px-4 py-3 text-sm text-[#0f2c21] shadow-inner shadow-[#dfe9dd]/40 focus:border-[#0f7a5c] focus:outline-none"
                  />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1 text-sm font-semibold text-[#0f2c21]">
                  Mobile number
                  <input
                    required
                    name="phone"
                    type="tel"
                    placeholder="+91 XXXXX XXXXX"
                    className="mt-1 w-full rounded-xl border border-[#dfe9dd] bg-white px-4 py-3 text-sm text-[#0f2c21] shadow-inner shadow-[#dfe9dd]/40 focus:border-[#0f7a5c] focus:outline-none"
                  />
                </label>
                <label className="space-y-1 text-sm font-semibold text-[#0f2c21]">
                  Topic
                  <select
                    name="topic"
                    className="mt-1 w-full rounded-xl border border-[#dfe9dd] bg-white px-4 py-3 text-sm text-[#0f2c21] shadow-inner shadow-[#dfe9dd]/40 focus:border-[#0f7a5c] focus:outline-none"
                  >
                    <option>Product question</option>
                    <option>Pricing & billing</option>
                    <option>Onboarding help</option>
                    <option>Feedback</option>
                  </select>
                </label>
              </div>
              <label className="space-y-1 text-sm font-semibold text-[#0f2c21]">
                Your message
                <textarea
                  required
                  name="message"
                  rows={4}
                  placeholder="Tell us what you need help with..."
                  className="mt-1 w-full rounded-xl border border-[#dfe9dd] bg-white px-4 py-3 text-sm text-[#0f2c21] shadow-inner shadow-[#dfe9dd]/40 focus:border-[#0f7a5c] focus:outline-none"
                />
              </label>
              <Button
                type="submit"
                className="w-full rounded-full bg-[#0f7a5c] px-6 py-3 text-sm font-semibold text-white shadow-md shadow-[#0f7a5c]/30 transition hover:bg-[#0c6148] disabled:opacity-60"
                disabled={submitting}
              >
                {submitting ? "Sending..." : "Send message"}
              </Button>
              {error && <p className="text-center text-xs text-red-600">{error}</p>}
              {status === "sent" ? (
                <p className="text-center text-xs text-[#0f7a5c]">Message sent. We respond within 1 business day.</p>
              ) : (
                <p className="text-center text-xs text-[#42584a]">We respond within 1 business day.</p>
              )}
            </form>
          </div>

          <div className="space-y-4 rounded-[28px] border border-[#dfe9dd] bg-[#f7faf7] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <div className="flex items-center gap-3">
              <Mail className="h-6 w-6 text-[#0f7a5c]" />
              <h3 className="text-lg font-semibold text-[#0f2c21]">Reach us directly</h3>
            </div>
            <div className="space-y-3 text-sm text-[#42584a]">
              <div className="flex items-center gap-3 rounded-2xl border border-[#dfe9dd] bg-white px-4 py-3">
                <Mail className="h-4 w-4 text-[#0f7a5c]" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f7a5c]">Team inbox</p>
                  <a href="mailto:hello@thamly.in" className="font-semibold text-[#0f2c21] hover:text-black">
                    hello@thamly.in
                  </a>
                </div>
              </div>
            </div>

            <div className="rounded-[20px] border border-[#dfe9dd] bg-white px-4 py-3 text-sm text-[#42584a] shadow-inner shadow-[#dfe9dd]/50">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#0f7a5c]">
                <Clock className="h-4 w-4" />
                Response times
              </div>
              <p className="mt-2">We reply within one business day. For urgent issues, include your workspace ID.</p>
             
            </div>

            <div className="rounded-[20px] border border-[#dfe9dd] bg-white px-4 py-3 text-sm text-[#42584a] shadow-inner shadow-[#dfe9dd]/50">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#0f7a5c]">
                <ArrowRight className="h-4 w-4" />
                Need docs?
              </div>
              <p className="mt-2">Check guides, terms, and policy if you want instant answers.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/docs" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0f7a5c] hover:text-black">
                  View docs <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/terms" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0f7a5c] hover:text-black">
                  Terms <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/privacy" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0f7a5c] hover:text-black">
                  Policy <ArrowRight className="h-4 w-4" />
                </Link>
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
