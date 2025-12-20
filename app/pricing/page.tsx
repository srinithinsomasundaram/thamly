"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, Check, Shield, Sparkles, Zap, Clock3 } from "lucide-react"

import { LandingNavbar } from "@/components/layout/landing-navbar"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

const tiers = [
  {
    name: "Free",
    price: "₹0",
    period: "per month",
    description: "For individual Tamil writing and first-time users.",
    cta: "Start writing",
    href: "/auth/sign-up",
    features: ["30 checks/day", "Transliteration + grammar", "Tone & rewrite basics", "Save drafts"],
    note: "No card required. Upgrade anytime.",
  },
  {
    name: "Pro",
    price: "₹399",
    period: "per editor / month (after 7-day free)",
    description: "For creators who want unlimited Tamil corrections and faster responses.",
    cta: "Start 7-day trial",
    href: "/subscription",
    features: [
      "Unlimited Tamil AI checks",
      "Tamil-first grammar & spelling",
      "Tanglish to Tamil transliteration",
      "News/Academic/Email tone rewrites",
      "Priority support",
    ],
    highlight: true,
    note: "Trial keeps all 7 days. Billing starts after trial ends.",
  },
]

const highlights = [
  { title: "Tamil-first AI", body: "Transliteration, grammar, sandhi, and tone tuned for Tanglish inputs.", icon: Sparkles },
  { title: "Built-in guardrails", body: "Usage caps keep costs safe; Pro lifts limits for heavy writers.", icon: Shield },
  { title: "Faster rewrites", body: "Pro lane speeds up long-form workflows for solo creators.", icon: Zap },
]

const faqs = [
  {
    q: "Do I need a card to start?",
    a: "No. Free is cardless. The 7-day Pro trial is also cardless—billing starts after trial only if you choose to pay.",
  },
  {
    q: "Can I switch plans later?",
    a: "Yes. Upgrade or downgrade anytime; limits update instantly on your account.",
  },
  {
    q: "How fast do you reply?",
    a: "Free: email support within one business day. Pro: priority responses for language and billing issues.",
  },
]

const upgradeRedirect = "/subscription/upgrade"

export default function PricingPage() {
  const [isAuthed, setIsAuthed] = useState(false)
  const [isProUser, setIsProUser] = useState(false)
  const [checkedStatus, setCheckedStatus] = useState(false)
  const [hasPaidOrScheduled, setHasPaidOrScheduled] = useState(false)
  const [trialActive, setTrialActive] = useState(false)
  const [trialUsed, setTrialUsed] = useState(false)

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const authed = Boolean(user)
      setIsAuthed(authed)

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("subscription_tier,is_trial_active,trial_ends_at,trial_used")
          .eq("id", user.id)
          .maybeSingle()

        const tier = (profile?.subscription_tier || "").toString().toLowerCase()
        const trialFlag =
          Boolean(
            profile?.is_trial_active &&
              profile?.trial_ends_at &&
              new Date(profile.trial_ends_at as any) >= new Date(),
          )
        setTrialActive(trialFlag)
        setTrialUsed(Boolean(profile?.trial_used))
        // Treat only paid Pro as Pro; trials should still see the plans page.
        setIsProUser(tier === "pro")

        // Check billing to see if a paid or scheduled invoice exists
        try {
          const billingRes = await fetch("/api/subscription/billing", { cache: "no-store" })
          const billingJson = await billingRes.json().catch(() => ({}))
          if (billingRes.ok && billingJson?.ok) {
            const invoices: any[] = billingJson.invoices || []
            const payments: any[] = billingJson.payments || []
            const hasPaid = invoices.some((inv) => ["paid", "scheduled"].includes((inv.status || "").toLowerCase()))
            const hasPayment = payments.some((pay) => (pay.status || "").toLowerCase() === "completed" || (pay.status || "").toLowerCase() === "paid")
            setHasPaidOrScheduled(hasPaid || hasPayment)
          } else {
            setHasPaidOrScheduled(false)
          }
        } catch {
          setHasPaidOrScheduled(false)
        }
      } else {
        setIsProUser(false)
        setHasPaidOrScheduled(false)
        setTrialActive(false)
        setTrialUsed(false)
      }
      setCheckedStatus(true)
    }
    checkUser()
  }, [])

  if ((isProUser || hasPaidOrScheduled) && checkedStatus) {
    return (
      <div className="min-h-screen bg-white text-[#0f2c21]">
        <LandingNavbar />
        <main className="flex items-center justify-center px-6 py-16">
          <div className="w-full max-w-3xl space-y-6 rounded-3xl border border-[#dfe9dd] bg-gradient-to-br from-[#f1fff8] to-[#e7f3ec] p-8 text-center shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#0f7a5c]/30 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-[#0f7a5c] shadow-sm">
              Pro Member
            </div>
            <h1 className="text-3xl font-semibold sm:text-4xl">You already have Pro active or scheduled.</h1>
            <p className="text-lg text-[#42584a]">
              Unlimited checks, faster responses, and priority support are on your account. Continue writing or manage billing.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                asChild
                className="rounded-full bg-[#0f7a5c] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0f7a5c]/40 hover:bg-[#0c6148]"
              >
                <Link href="/drafts">Go to drafts</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-full border-[#dfe9dd] bg-white px-6 py-3 text-sm font-semibold text-[#0f2c21] shadow-sm hover:border-[#0f7a5c] hover:text-[#0f7a5c]"
              >
                <Link href="/subscription">Manage subscription</Link>
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-[#0f2c21]">
      <LandingNavbar />

      <main className="space-y-16 pb-16">
        <section className="relative overflow-hidden px-6 pt-16">
          <div className="absolute inset-0 bg-gradient-to-br from-[#f1fff8] via-white to-[#f7faf7]" />
          <div className="absolute inset-x-0 top-8 mx-auto h-40 max-w-4xl rounded-full bg-[#0f7a5c]/10 blur-3xl" />
          <div className="relative mx-auto max-w-6xl space-y-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#dfe9dd] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.5em] text-[#0f7a5c] shadow-sm shadow-[#dfe9dd]/60">
              Pricing
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">Plans built for Tamil-first writing.</h1>
              <p className="mx-auto max-w-3xl text-lg text-[#42584a]">
                Start free with cardless checks. Upgrade to Pro for unlimited usage and faster rewrites.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                asChild
                className="rounded-full bg-[#0f7a5c] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0f7a5c]/40 hover:bg-[#0c6148]"
              >
                <Link
                  href={
                    isAuthed
                      ? upgradeRedirect
                      : `/auth/sign-up?redirectTo=${encodeURIComponent(upgradeRedirect)}`
                  }
                >
                  Start free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-full border-[#dfe9dd] bg-white px-6 py-3 text-sm font-semibold text-[#0f2c21] shadow-sm hover:border-[#0f7a5c] hover:text-[#0f7a5c]"
              >
                <Link href="#plans">
                  Compare plans
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="flex flex-wrap justify-center gap-3 text-sm text-[#42584a]">
              <div className="flex items-center gap-2 rounded-full border border-[#dfe9dd] bg-white px-3 py-1">
                <Shield className="h-4 w-4 text-[#0f7a5c]" />
                No card required
              </div>
              <div className="flex items-center gap-2 rounded-full border border-[#dfe9dd] bg-white px-3 py-1">
                <Clock3 className="h-4 w-4 text-[#0f7a5c]" />
                Quick setup
              </div>
              <div className="flex items-center gap-2 rounded-full border border-[#dfe9dd] bg-white px-3 py-1">
                <Sparkles className="h-4 w-4 text-[#0f7a5c]" />
                Tamil-first AI
              </div>
            </div>
          </div>
        </section>

        <section id="plans" className="px-6">
          <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative overflow-hidden rounded-[28px] border p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] ${
                  tier.highlight
                    ? "border-[#0f7a5c] bg-gradient-to-br from-[#f1fff8] to-[#e7f3ec]"
                    : "border-[#dfe9dd] bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#0f7a5c]">{tier.name}</p>
                    <h3 className="text-2xl font-semibold text-[#0f2c21]">{tier.description}</h3>
                  </div>
                  {tier.highlight && (
                    <span className="rounded-full bg-[#0f7a5c] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white shadow-md shadow-[#0f7a5c]/30">
                      Popular
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-4xl font-semibold text-[#0f2c21]">{tier.price}</span>
                  <span className="text-sm text-[#42584a]">{tier.period}</span>
                </div>
                {tier.name === "Pro" && (
                  <p className="text-sm font-semibold text-[#0f2c21]">
                    {isProUser ? "You're already on Pro. Enjoy unlimited features." : "₹399/mo after trial. No surprise auto-renew."}
                  </p>
                )}

                <div className="mt-6 space-y-3 text-sm text-[#42584a]">
                  {tier.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-[#0f7a5c]" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  asChild
                  className={`mt-6 w-full rounded-full px-6 py-3 text-sm font-semibold shadow-md ${
                    tier.highlight
                      ? "bg-[#0f7a5c] text-white shadow-[#0f7a5c]/40 hover:bg-[#0c6148]"
                      : "bg-white text-[#0f2c21] shadow-[#dfe9dd] hover:border-[#0f7a5c] hover:text-[#0f7a5c]"
                  }`}
                  variant={tier.highlight ? "default" : "outline"}
                  disabled={tier.name === "Pro" && isProUser}
                >
                  <Link
                    href={
                      tier.name === "Pro" && isProUser
                        ? "/drafts"
                        : isAuthed
                          ? upgradeRedirect
                          : tier.name === "Pro"
                            ? `/auth/login?redirectTo=${encodeURIComponent(upgradeRedirect)}`
                            : `/auth/sign-up?redirectTo=${encodeURIComponent(upgradeRedirect)}`
                    }
                  >
                    {tier.name === "Pro"
                      ? isProUser
                        ? "You're Pro"
                        : isAuthed && (hasPaidOrScheduled || trialActive || trialUsed)
                          ? "Upgrade to Pro"
                          : tier.cta
                      : tier.cta}
                  </Link>
                </Button>

                <p className="mt-3 text-xs text-[#42584a]">
                  {tier.name === "Pro" && isProUser ? "Pro benefits are already active on your account." : tier.note}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="px-6">
          <div className="mx-auto max-w-6xl space-y-8 rounded-[28px] border border-[#dfe9dd] bg-[#f7faf7] p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <div className="space-y-2 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#0f7a5c]">Why writers pick Pro</p>
              <h3 className="text-3xl font-semibold text-[#0f2c21]">Stronger limits, faster rewrites, trusted guardrails.</h3>
              <p className="text-[#42584a]">Built for reporters, students, and creators who ship Tamil content every week.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {highlights.map((item) => (
                <div key={item.title} className="space-y-3 rounded-[20px] border border-[#dfe9dd] bg-white p-6 shadow-[0_12px_36px_rgba(15,23,42,0.06)]">
                  <div className="inline-flex items-center justify-center rounded-2xl bg-[#0f7a5c]/10 p-3 text-[#0f7a5c]">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h4 className="text-lg font-semibold text-[#0f2c21]">{item.title}</h4>
                  <p className="text-sm text-[#42584a]">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6">
          <div className="mx-auto max-w-6xl space-y-6 rounded-[28px] border border-[#dfe9dd] bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col gap-2 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#0f7a5c]">FAQ</p>
              <h3 className="text-3xl font-semibold text-[#0f2c21]">Common questions</h3>
              <p className="text-[#42584a]">Everything you need to know before you choose a plan.</p>
            </div>
            <div className="space-y-4">
              {faqs.map((item) => (
                <div key={item.q} className="space-y-2 rounded-[18px] border border-[#dfe9dd] bg-[#f7faf7] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-base font-semibold text-[#0f2c21]">{item.q}</p>
                  </div>
                  <p className="text-sm text-[#42584a]">{item.a}</p>
                </div>
              ))}
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
