"use client"

import Link from "next/link"
import { ArrowLeft, Shield } from "lucide-react"

import { LandingNavbar } from "@/components/layout/landing-navbar"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white text-[#0f2c21]">
      <LandingNavbar />
      <main className="space-y-12 px-6 py-16 lg:px-12">
        <div className="mx-auto max-w-5xl space-y-3">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0f7a5c] hover:text-[#0c6148]">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div className="space-y-2">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#dfe9dd] bg-[#f7faf7] px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#0f7a5c]">
              Privacy
            </p>
            <h1 className="text-4xl font-semibold leading-tight">Privacy Policy</h1>
            <p className="text-lg text-[#42584a]">
              Updated: Jan 2025. How Thamly handles your data and drafts.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-5xl space-y-6 rounded-[28px] border border-[#dfe9dd] bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.08)]">
          <Section title="1. Data we collect">
            Account info (email, name), workspace metadata, and usage metrics. Draft content stays in your workspace.
          </Section>
          <Section title="2. Draft storage">
            Drafts are stored in our managed cloud database. We do not train on your drafts. Preview-only fields are not stored.
          </Section>
          <Section title="3. Third-party services">
            We use a managed database for auth/storage and Razorpay for billing. Email is sent via your configured SMTP provider.
          </Section>
          <Section title="4. Security">
            Access is restricted to your account. Use strong passwords and sign out on shared devices.
          </Section>
          <Section title="5. Cookies">
            We use essential cookies for authentication and session management.
          </Section>
          <Section title="6. Your rights">
            Request export or deletion of your data by emailing <Link href="mailto:hello@thamly.com" className="text-[#0f7a5c] hover:text-[#0c6148]">hello@thamly.com</Link>.
          </Section>
          <Section title="7. Updates">
            We may update this policy. Continued use after updates means acceptance.
          </Section>
          <Section title="8. Contact">
            Questions? Email <Link href="mailto:hello@thamly.com" className="text-[#0f7a5c] hover:text-[#0c6148]">hello@thamly.com</Link>.
          </Section>
        </div>
      </main>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 text-sm text-[#42584a]">
      <h3 className="text-base font-semibold text-[#0f2c21]">{title}</h3>
      <p>{children}</p>
    </div>
  )
}
