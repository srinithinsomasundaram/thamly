"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight, User, ChevronDown } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js"
const MONTHLY_PRICE = 399
const YEARLY_PRICE = 3999

const loadRazorpayScript = () => {
  return new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Razorpay is only available in the browser"))
      return
    }
    if (document.querySelector(`script[src="${RAZORPAY_SCRIPT_URL}"]`)) {
      resolve()
      return
    }

    const script = document.createElement("script")
    script.src = RAZORPAY_SCRIPT_URL
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Failed to load Razorpay SDK"))
    document.body.appendChild(script)
  })
}

const planHighlights = [
  "Unlimited AI checks and longer copies",
  "Priority support",
  "Early access to upcoming Tamil-first features",
]

const featureList = [
  {
    title: "Tamil intelligence",
    detail: "AI corrections, transliteration, and tone controls tailored for Tamil + Thanglish drafts.",
  },
  {
    title: "Simple controls",
    detail: "Secure sign-in and usage limits without team features.",
  },
  {
    title: "Billing transparency",
    detail: "Upgrade on-demand, pause anytime, and export invoices without hunting for paperwork.",
  },
]

export default function SubscriptionUpgradePage() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<{ full_name?: string; email?: string } | null>(null)
  const [isPro, setIsPro] = useState(false)
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")
  const [trialUsed, setTrialUsed] = useState(false)
  const [trialMessage, setTrialMessage] = useState<string | null>(null)
  const [showPreCheckout, setShowPreCheckout] = useState(false)
  const [upgradeNotice, setUpgradeNotice] = useState(false)
  const [billingInfo, setBillingInfo] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: ""
  })
  const [showBillingForm, setShowBillingForm] = useState(false)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const router = useRouter()

  const requiredFieldsComplete = Boolean(
    billingInfo.email &&
    billingInfo.fullName &&
    billingInfo.phone &&
    billingInfo.address &&
    billingInfo.city &&
    billingInfo.state &&
    billingInfo.postalCode &&
    billingInfo.country
  )

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient()
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        setError("Please sign in to start a trial or upgrade.")
        return
      }

      const meta = (user.user_metadata as any) || {}
      let resolvedName = meta?.full_name || user.email || ""
      const resolvedEmail = user.email ?? undefined
      let resolvedTier = ""
      let resolvedTrialUsed = Boolean(meta?.trial_used)

      try {
        const { data: profileRow, error: profileError } = await (supabase as any)
          .from("profiles")
          .select("subscription_tier, full_name, trial_used, trial_started_at")
          .eq("id", user.id)
          .maybeSingle()

        if (profileError) {
          // Handle unmigrated databases gracefully
          if (profileError.code === "42703" || (profileError.message || "").toLowerCase().includes("trial_used")) {
            const { data: fallbackProfile } = await (supabase as any)
              .from("profiles")
              .select("subscription_tier, full_name")
              .eq("id", user.id)
              .maybeSingle()

            if (fallbackProfile) {
              resolvedTier = fallbackProfile.subscription_tier || resolvedTier
              resolvedName = fallbackProfile.full_name || resolvedName
            }
          } else {
            console.error("Upgrade profile load error", profileError)
            setError("Unable to load profile right now.")
          }
        } else if (profileRow) {
          resolvedTier = profileRow.subscription_tier || resolvedTier
          resolvedName = profileRow.full_name || resolvedName
          if (profileRow.trial_used !== null && profileRow.trial_used !== undefined) {
            resolvedTrialUsed = profileRow.trial_used
          }
          if (profileRow.trial_started_at && profileRow.trial_used && !isPro) {
            setUpgradeNotice(true)
          }
        } else {
          await (supabase as any)
            .from("profiles")
            .insert({ id: user.id, subscription_tier: "free", full_name: resolvedName } as any)
        }
      } catch (err) {
        console.error("Upgrade profile load error", err)
        setError("Unable to load profile right now.")
      }

      setProfile({ full_name: resolvedName, email: resolvedEmail })

      const plan = (resolvedTier || meta?.plan || meta?.tier || meta?.subscription || meta?.role || "").toString().toLowerCase()
      const proFlag = Boolean(
        plan === "pro" ||
          plan === "pro_yearly" ||
          meta?.is_pro ||
          meta?.pro ||
          meta?.pro_user,
      )
      const isOnTrialTier = plan === "pro_trial"
      setIsPro(proFlag)
      setTrialUsed(Boolean(resolvedTrialUsed || isOnTrialTier))

      // Auto-populate billing info
      setBillingInfo(prev => ({
        ...prev,
        fullName: resolvedName || "",
        email: resolvedEmail || ""
      }))
    }
    loadProfile()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showProfileDropdown) {
        const target = event.target as Element
        if (!target.closest('.profile-dropdown')) {
          setShowProfileDropdown(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showProfileDropdown])

  const handleUpgrade = async () => {
    setIsProcessing(true)
    setError(null)

    const selectedAmount = (billingCycle === "monthly" ? MONTHLY_PRICE : YEARLY_PRICE) * 100

    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      setError("Please sign in before upgrading.")
      setIsProcessing(false)
      return
    }

    try {
      const orderResponse = await fetch("/api/payment/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: selectedAmount }),
      })

      if (!orderResponse.ok) {
        const errData = await orderResponse.json().catch(() => null)
        throw new Error(errData?.error ?? "Unable to create Razorpay order")
      }

      const orderData = await orderResponse.json()
      await loadRazorpayScript()

      const options: any = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Thamly Pro",
        description: "Unlimited AI checks",
        order_id: orderData.id,
        prefill: {
          email: billingInfo.email || profile?.email || user.email || "",
          name: billingInfo.fullName || profile?.full_name || user.email || "",
          contact: billingInfo.phone
        },
        handler: async (response: any) => {
          await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          })
          window.location.href = "/subscription"
        },
        theme: {
          color: "#0f7a5c",
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start checkout")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      <div className="min-h-screen bg-white text-[#0f2c21]">
        <div className="border-b border-[#dfe9dd] bg-white/90 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => router.push("/subscription")}
              className="text-sm font-semibold text-[#0f7a5c] hover:text-[#0c6148]"
            >
              ← Back to subscription
            </button>

            {profile ? (
              <div className="flex items-center gap-3 text-sm font-semibold text-[#0f2c21]">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f1fff8] text-[#0f7a5c]">
                  <User className="h-4 w-4" />
                </div>
                <span>{profile.full_name || profile.email}</span>
              </div>
            ) : (
              <div className="text-sm text-[#42584a]">
                Already have access?{" "}
                <Link href="/subscription" className="font-semibold text-[#0f7a5c] hover:text-[#0c6148]">
                  Manage your account
                </Link>
              </div>
            )}
          </div>
        </div>

        <main className="space-y-12 px-6 py-12 lg:px-12">
          {isPro && (
            <div className="mx-auto max-w-6xl rounded-2xl border border-[#dfe9dd] bg-[#f1fff8] px-4 py-3 text-sm font-semibold text-[#0f7a5c] shadow-[0_10px_32px_rgba(15,23,42,0.06)]">
              Congratulations — you’re already a Thamly Pro user. Enjoy unlimited checks and shared editing.
            </div>
          )}
          {!isPro && upgradeNotice && !trialUsed && (
            <div className="mx-auto max-w-6xl rounded-2xl border border-[#dfe9dd] bg-[#f7faf7] px-4 py-3 text-sm font-semibold text-[#0f7a5c] shadow-[0_10px_32px_rgba(15,23,42,0.06)]">
              Upgrading your workspace — 7-day Pro trial is live. Explore drafts with Pro speed now.
            </div>
          )}

          <section className="relative overflow-hidden rounded-[32px] border border-[#dfe9dd] bg-white p-10 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <div className="relative space-y-6 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#dfe9dd] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#0f7a5c] shadow-sm shadow-[#dfe9dd]/50">
                Upgrade
              </div>
              <h1 className="text-4xl font-semibold sm:text-5xl">
                {trialUsed ? "Upgrade to Pro" : "Start your 7-day Pro trial."}
              </h1>
              <p className="mx-auto max-w-3xl text-lg text-[#42584a]">
                {trialUsed
                  ? "Tamil-first AI, faster rewrites, and teamwork for teams, students, and newsrooms. Your trial is used—upgrade for just ₹399/mo (₹3999/yr), no surprise auto-renew."
                  : "Tamil-first AI, faster rewrites, and teamwork ready for teams, students, and newsrooms. Trial runs 7 days, then you can upgrade for just ₹399/mo—no surprise auto-renew, and you keep the remaining trial days."}
              </p>
              <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-[#dfe9dd] bg-white px-2 py-1 text-sm font-semibold text-[#0f2c21] shadow-sm">
                <button
                  onClick={() => setBillingCycle("monthly")}
                  className={`rounded-full px-4 py-2 ${billingCycle === "monthly" ? "bg-[#0f7a5c] text-white shadow-md shadow-[#0f7a5c]/40" : "text-[#42584a]"}`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle("yearly")}
                  className={`rounded-full px-4 py-2 ${billingCycle === "yearly" ? "bg-[#0f7a5c] text-white shadow-md shadow-[#0f7a5c]/40" : "text-[#42584a]"}`}
                >
                  Yearly (₹3999 flat)
                </button>
              </div>
              <div className="flex flex-wrap justify-center gap-3 text-sm text-[#42584a]">
                {planHighlights.map((item) => (
                  <span key={item} className="rounded-full border border-[#dfe9dd] bg-white px-3 py-1">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-6xl grid gap-6 md:grid-cols-2">
            <div className="space-y-4 rounded-[28px] border border-[#dfe9dd] bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.06)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#0f7a5c]">Free</p>
                  <h3 className="text-2xl font-semibold text-[#0f2c21]">Stay on Free</h3>
                  <p className="text-sm text-[#42584a]">Great for casual writing and testing.</p>
                </div>
                <span className="rounded-full bg-[#f7faf7] px-3 py-1 text-[11px] font-semibold text-[#0f7a5c]">Current</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-semibold text-[#0f2c21]">₹0</span>
                <span className="text-sm text-[#42584a]">per month</span>
              </div>
              <ul className="space-y-2 text-sm text-[#42584a]">
                <li className="flex items-center gap-2"><span className="text-[#0f7a5c]">✓</span>30 checks/day</li>
                <li className="flex items-center gap-2"><span className="text-[#0f7a5c]">✓</span>Transliteration + grammar</li>
                <li className="flex items-center gap-2"><span className="text-[#0f7a5c]">✓</span>Tone & rewrite basics</li>
              </ul>
              <div className="rounded-2xl border border-[#dfe9dd] bg-[#f7faf7] px-4 py-3 text-sm text-[#42584a]">
                Card-free. Upgrade when you need more headroom.
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[28px] border border-[#0f7a5c] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.1)]">
              <div className="absolute right-4 top-4 rounded-full bg-[#0f7a5c] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white shadow-md shadow-[#0f7a5c]/40">
                Popular
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#0f7a5c]">Pro</p>
                  <h3 className="text-2xl font-semibold text-[#0f2c21]">Unlimited checks + priority AI</h3>
                  <p className="text-sm text-[#42584a]">Ideal for writers who need unlimited Tamil corrections.</p>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-semibold text-[#0f2c21]">
                    ₹{billingCycle === "monthly" ? MONTHLY_PRICE : YEARLY_PRICE}
                  </span>
                  <span className="text-sm text-[#42584a]">
                    per editor / {billingCycle === "monthly" ? "month" : "year"} after 7-day free
                  </span>
                </div>
                <ul className="space-y-2 text-sm text-[#42584a]">
                  <li className="flex items-center gap-2"><span className="text-[#0f7a5c]">✓</span>Unlimited checks</li>
                  <li className="flex items-center gap-2"><span className="text-[#0f7a5c]">✓</span>News & tone modes</li>
                  <li className="flex items-center gap-2"><span className="text-[#0f7a5c]">✓</span>Faster responses</li>
                  <li className="flex items-center gap-2"><span className="text-[#0f7a5c]">✓</span>Priority support</li>
                </ul>
                <button
                  onClick={async () => {
                    if (isPro) return
                    if (trialUsed) {
                      setTrialMessage("Trial already used or running. Upgrade when you’re ready.")
                      setShowBillingForm(true)
                      return
                    }
                    try {
                      const res = await fetch("/api/trial/start", { method: "POST" })
                      const data = await res.json()
                      if (!res.ok) {
                        setTrialMessage(data?.error || "Unable to start trial")
                        return
                      }
                      setTrialUsed(true)
                      setTrialMessage("Trial started. No autopay—enjoy 7 days free and upgrade whenever you want.")
                      setUpgradeNotice(true)
                      setTimeout(() => {
                        router.push("/drafts")
                      }, 600)
                    } catch (err) {
                      setTrialMessage("Unable to start trial right now.")
                    }
                  }}
                  disabled={isPro}
                  className={`w-full rounded-full px-6 py-3 text-sm font-semibold shadow-md ${
                    isPro
                      ? "bg-[#dfe9dd] text-[#42584a] shadow-none cursor-not-allowed"
                      : "bg-[#0f7a5c] text-white shadow-[#0f7a5c]/40 transition hover:bg-[#0c6148]"
                  }`}
                >
                  {isPro ? "You’re already Pro" : trialUsed ? "Upgrade to Pro" : "Start 7-day free"}
                </button>
                {trialMessage && <p className="text-xs text-[#0f7a5c]">{trialMessage}</p>}
                <p className="text-xs text-[#42584a]">Cancel anytime.</p>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-6xl rounded-[24px] border border-[#dfe9dd] bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.06)]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f7a5c]">Compare</p>
              <h3 className="text-xl font-semibold text-[#0f2c21]">Free vs Pro</h3>
            </div>
            <div className="mt-4 divide-y divide-[#dfe9dd] text-sm">
              {[
                { label: "AI Checks", free: "30/day", pro: "Unlimited" },
                { label: "Tamil intelligence", free: "Core grammar + transliteration", pro: "Advanced sandhi + tone modes" },
                { label: "Support", free: "Email within 1 business day", pro: "Priority responses" },
              ].map((row) => (
                <div key={row.label} className="grid grid-cols-[1.1fr_1fr_1fr] items-center gap-3 py-3">
                  <span className="font-semibold text-[#0f2c21]">{row.label}</span>
                  <span className="text-[#42584a]">{row.free}</span>
                  <span className="font-semibold text-[#0f7a5c]">{row.pro}</span>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>

      {showPreCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f2c21]/10 px-4 py-6 backdrop-blur">
          <div className="w-full max-w-lg space-y-5 rounded-3xl border border-[#dfe9dd] bg-white p-6 shadow-2xl shadow-[#0f7a5c]/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[#42584a]">Thamly Pro</p>
                <h3 className="text-2xl font-semibold text-[#0f2c21]">Secure checkout</h3>
              </div>
              <button
                onClick={() => setShowPreCheckout(false)}
                className="text-xs font-semibold uppercase tracking-[0.3em] text-[#42584a] hover:text-[#0c6148]"
              >
                Cancel
              </button>
            </div>
            <div className="rounded-2xl border border-[#dfe9dd] bg-[#f7faf7] p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold uppercase tracking-[0.3em] text-[#42584a]">Plan</div>
                <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f7a5c]">Razorpay</div>
              </div>
              <p className="mt-3 text-4xl font-bold text-[#0f2c21]">
                {(!trialUsed && !isPro) ? "₹0 today" : `₹${billingCycle === "monthly" ? MONTHLY_PRICE : YEARLY_PRICE}`}
              </p>
              <p className="text-sm text-[#42584a]">
                {billingCycle === "monthly" ? "Monthly Pro plan" : "Yearly Pro plan"} · Unlimited AI checks
                <br />
                {!trialUsed && !isPro
                  ? "7-day free · No card needed now"
                  : "Charge applies for this cycle"}
              </p>
              <div className="mt-4 space-y-2 text-sm text-[#42584a]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>
                    {(!trialUsed && !isPro) ? "₹ 0 (trial)" : `₹ ${billingCycle === "monthly" ? MONTHLY_PRICE : YEARLY_PRICE}`}
                  </span>
                </div>
                <div className="flex justify-between font-semibold text-[#0f2c21]">
                  <span>Total</span>
                  <span>
                    {(!trialUsed && !isPro) ? "₹ 0" : `₹ ${billingCycle === "monthly" ? MONTHLY_PRICE : YEARLY_PRICE}`}
                  </span>
                </div>
              </div>
            </div>
                <div className="rounded-2xl border border-[#dfe9dd] bg-[#f7faf7] p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-[#42584a]">Payment</p>
                  <div className="mt-4 flex items-center gap-3 text-sm font-semibold text-[#0f2c21]">
                    <div className="rounded-full bg-[#0f7a5c]/15 px-3 py-1 text-[#0f7a5c]">
                      {(!trialUsed && !isPro)
                    ? `Start 7-day free`
                    : `Pay ₹${billingCycle === "monthly" ? MONTHLY_PRICE : YEARLY_PRICE}`}
                </div>
                <span className="text-[#42584a]">{(!trialUsed && !isPro) ? "No autopay; decide later" : "Secure via Razorpay"}</span>
              </div>
              <div className="mt-4 flex items-center gap-3 text-xs text-[#42584a]">
                <span className="flex h-2 w-2 rounded-full bg-[#0f7a5c]" />
                <span>{(!trialUsed && !isPro) ? "Step 2 of 3 · Confirm trial" : "Step 2 of 3 · Pay"}</span>
              </div>
            </div>
            <button
              onClick={handleUpgrade}
              disabled={isProcessing}
              className="w-full rounded-full bg-[#0f7a5c] px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#0c6148] disabled:opacity-70"
            >
              {isProcessing
                ? "Preparing checkout..."
                : (!trialUsed && !isPro ? "Start 7-day free" : "Continue to Razorpay")}
            </button>
          </div>
        </div>
      )}

      {showBillingForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f2c21]/10 px-4 py-6 backdrop-blur">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-[#dfe9dd] bg-white shadow-2xl shadow-[#0f7a5c]/30">
            <div className="flex items-center justify-between border-b border-[#dfe9dd] px-6 py-4">
              <h3 className="text-lg font-semibold text-[#0f2c21]">Complete your purchase</h3>
              <button onClick={() => setShowBillingForm(false)} className="text-[#42584a] hover:text-[#0c6148]">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-6 py-4 space-y-5">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#42584a]">Thamly Pro</span>
                  <span className="text-lg font-semibold text-[#0f2c21]">
                    ₹{billingCycle === "monthly" ? MONTHLY_PRICE : YEARLY_PRICE}
                  </span>
                </div>
                <p className="text-sm text-[#42584a]">
                  {billingCycle === "monthly" ? "Billed monthly" : "Billed yearly"} • Cancel anytime
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#0f2c21]">Email</label>
                  <input
                    type="email"
                    value={billingInfo.email}
                    onChange={(e) => setBillingInfo(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-[#dfe9dd] bg-white px-3 py-2 text-sm text-[#0f2c21] shadow-inner shadow-[#dfe9dd]/40 focus:border-[#0f7a5c] focus:outline-none"
                    placeholder="you@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#0f2c21]">Full name</label>
                  <input
                    type="text"
                    value={billingInfo.fullName}
                    onChange={(e) => setBillingInfo(prev => ({ ...prev, fullName: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-[#dfe9dd] bg-white px-3 py-2 text-sm text-[#0f2c21] shadow-inner shadow-[#dfe9dd]/40 focus:border-[#0f7a5c] focus:outline-none"
                    placeholder="Arun Kumar"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#0f2c21]">Phone number</label>
                  <input
                    type="tel"
                    value={billingInfo.phone}
                    onChange={(e) => setBillingInfo(prev => ({ ...prev, phone: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-[#dfe9dd] bg-white px-3 py-2 text-sm text-[#0f2c21] shadow-inner shadow-[#dfe9dd]/40 focus:border-[#0f7a5c] focus:outline-none"
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-[#0f2c21]">Billing address</h4>
                <input
                  type="text"
                  value={billingInfo.address}
                  onChange={(e) => setBillingInfo(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full rounded-xl border border-[#dfe9dd] bg-white px-3 py-2 text-sm text-[#0f2c21] shadow-inner shadow-[#dfe9dd]/40 focus:border-[#0f7a5c] focus:outline-none"
                  placeholder="Street address"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={billingInfo.city}
                    onChange={(e) => setBillingInfo(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full rounded-xl border border-[#dfe9dd] bg-white px-3 py-2 text-sm text-[#0f2c21] shadow-inner shadow-[#dfe9dd]/40 focus:border-[#0f7a5c] focus:outline-none"
                    placeholder="City"
                  />
                  <input
                    type="text"
                    value={billingInfo.state}
                    onChange={(e) => setBillingInfo(prev => ({ ...prev, state: e.target.value }))}
                    className="w-full rounded-xl border border-[#dfe9dd] bg-white px-3 py-2 text-sm text-[#0f2c21] shadow-inner shadow-[#dfe9dd]/40 focus:border-[#0f7a5c] focus:outline-none"
                    placeholder="State"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={billingInfo.postalCode}
                    onChange={(e) => setBillingInfo(prev => ({ ...prev, postalCode: e.target.value }))}
                    className="w-full rounded-xl border border-[#dfe9dd] bg-white px-3 py-2 text-sm text-[#0f2c21] shadow-inner shadow-[#dfe9dd]/40 focus:border-[#0f7a5c] focus:outline-none"
                    placeholder="Postal code"
                  />
                  <select
                    value={billingInfo.country}
                    onChange={(e) => setBillingInfo(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full rounded-xl border border-[#dfe9dd] bg-white px-3 py-2 text-sm text-[#0f2c21] shadow-inner shadow-[#dfe9dd]/40 focus:border-[#0f7a5c] focus:outline-none"
                  >
                    <option value="">Country</option>
                    <option value="IN">India</option>
                    <option value="US">United States</option>
                    <option value="UK">United Kingdom</option>
                    <option value="CA">Canada</option>
                    <option value="AU">Australia</option>
                    <option value="SG">Singapore</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-[#dfe9dd] bg-[#f7faf7] px-6 py-4">
              <button
                onClick={() => {
                  if (!requiredFieldsComplete) return
                  setShowBillingForm(false)
                  setShowPreCheckout(true)
                }}
                disabled={!requiredFieldsComplete}
                className="w-full rounded-full bg-[#0f7a5c] px-4 py-3 text-sm font-semibold text-white shadow-md shadow-[#0f7a5c]/30 transition hover:bg-[#0c6148] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Continue to payment
              </button>
              {!requiredFieldsComplete && (
                <p className="mt-2 text-center text-xs text-[#c2410c]">
                  Please complete all fields above to continue.
                </p>
              )}
              <p className="mt-1 text-center text-xs text-[#42584a]">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        </div>
      )}

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
    </>
  )
}
