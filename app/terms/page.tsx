"use client"

import Link from "next/link"
import { ArrowLeft, Shield } from "lucide-react"

import { LandingNavbar } from "@/components/layout/landing-navbar"

export default function TermsPage() {
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
              Terms
            </p>
            <h1 className="text-4xl font-semibold leading-tight">Terms of Service</h1>
            <p className="text-lg text-[#42584a]">
              Updated: Jan 2025. By using Thamly you agree to these terms.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-5xl space-y-6 rounded-[28px] border border-[#dfe9dd] bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.08)]">
          <Section title="1. Acceptance of terms">
            By accessing or using Thamly, you agree to these Terms of Service and our Privacy Policy.
          </Section>
          <Section title="2. Use of service">
            You may not misuse Thamly, attempt to breach security, or violate applicable laws. We may suspend accounts for abuse.
          </Section>
          <Section title="3. Accounts and security">
            You are responsible for keeping your credentials secure. Notify us of any unauthorized access.
          </Section>
          <Section title="4. Content and privacy">
            Drafts remain yours. We do not train on your drafts. Review our Privacy Policy for data handling.
          </Section>
          <Section title="5. Payments">
            Pro plans are billed per seat. Fees are non-refundable except where required by law.
          </Section>
          <Section title="6. Termination">
            We may suspend or terminate accounts for violations. You may cancel at any time.
          </Section>
          <Section title="7. Changes">
            We may update these terms. Continued use after updates means acceptance.
          </Section>
          <Section title="8. Contact">
            Email us at <Link href="mailto:hello@thamly.in" className="text-[#0f7a5c] hover:text-[#0c6148]">hello@thamly.in</Link> for questions.
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
