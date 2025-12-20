"use client"

import Link from "next/link"
import { ArrowLeft, ArrowRight, Users, History, Check } from "lucide-react"

import { LandingNavbar } from "@/components/layout/landing-navbar"
import { Button } from "@/components/ui/button"

export default function TeamsDoc() {
  return (
    <div className="min-h-screen bg-white text-[#0f2c21]">
      <LandingNavbar />
      <main className="space-y-10 px-6 py-16 lg:px-12">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          <div className="flex items-center justify-between">
            <Link href="/docs" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0f7a5c] hover:text-[#0c6148]">
              <ArrowLeft className="h-4 w-4" />
              Back to Docs
            </Link>
            <Button asChild size="sm" className="rounded-full bg-[#0f7a5c] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#0f7a5c]/30 hover:bg-[#0c6148]">
              <Link href="/subscription/upgrade">
                Enable team features
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#dfe9dd] bg-[#f7faf7] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#0f7a5c]">
              Team workflows
            </div>
            <h1 className="text-4xl font-semibold leading-tight">Invite teammates, edit together, and keep change logs.</h1>
            <p className="text-lg text-[#42584a]">
              Pro unlocks unlimited checks, multi-user editing, and change logs for Tamil-first teams.
            </p>
          </div>

          <div className="space-y-6 rounded-[28px] border border-[#dfe9dd] bg-white p-6 shadow-[0_12px_36px_rgba(15,23,42,0.06)]">
            <h2 className="text-xl font-semibold text-[#0f2c21]">Team setup</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                "Invite teammates to your workspace from Subscription settings.",
                "Share drafts; everyone sees tone and transliteration updates in real time.",
                "Use change logs to roll back to prior AI suggestions or edits.",
                "Priority support helps with newsroom or academic workflows.",
              ].map((tip) => (
                <div key={tip} className="flex items-start gap-2 text-[#42584a]">
                  <Check className="mt-1 h-4 w-4 text-[#0f7a5c]" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-[#42584a]">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#dfe9dd] bg-[#f7faf7] px-3 py-1">
              <Users className="h-4 w-4 text-[#0f7a5c]" />
              Collaboration
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#dfe9dd] bg-[#f7faf7] px-3 py-1">
              <History className="h-4 w-4 text-[#0f7a5c]" />
              Change log
            </span>
          </div>
        </div>
      </main>
    </div>
  )
}
