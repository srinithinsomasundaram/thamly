"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { useUserProfile } from "@/components/providers/user-provider"
import { getSocket } from "@/lib/realtime/socket-client"

type Profile = {
  subscription_tier: string
  full_name?: string
  avatar_url?: string
  trial_used?: boolean
  trial_started_at?: string
  trial_ends_at?: string
  is_trial_active?: boolean
}

export function SubscriptionPageContent({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter()
  const { refresh: refreshUserProfile } = useUserProfile()
  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<
    Array<{ id: string; amount: number; status: string; date: string; download_url?: string; currency?: string }>
  >([])
  const [payments, setPayments] = useState<
    Array<{ id: string; amount: number; status: string; date: string; currency?: string; method?: string; plan?: string; order_id?: string; invoice_url?: string }>
  >([])
  const [hasScheduledPro, setHasScheduledPro] = useState(false)
  const [invoiceMessage, setInvoiceMessage] = useState<string | null>(null)
  const [trialNotice, setTrialNotice] = useState<string | null>(null)
  const [trialExpiryHandled, setTrialExpiryHandled] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [cancelMessage, setCancelMessage] = useState<string | null>(null)
  const [activateLoading, setActivateLoading] = useState(false)
  const [activateMessage, setActivateMessage] = useState<string | null>(null)

  const refreshBillingData = useCallback(async () => {
    try {
      const billingRes = await fetch("/api/subscription/billing", { cache: "no-store" })
      const billingJson = await billingRes.json().catch(() => ({}))
      if (!billingRes.ok || !billingJson?.ok) {
        setInvoiceMessage(billingJson?.error || "No billing yet.")
        setInvoices([])
        setPayments([])
        setHasScheduledPro(false)
      } else {
        const rows = (billingJson.invoices as any[]) || []
        const paymentRows = (billingJson.payments as any[]) || []

        setInvoices(
          rows.map((inv: any) => ({
            id: inv.id,
            amount: inv.amount,
            status: (inv.status || "").toUpperCase(),
            date: inv.invoice_date,
            download_url: inv.download_url || undefined,
            currency: inv.currency || "INR",
          })),
        )

        setPayments(
          paymentRows.map((pay: any) => ({
            id: pay.id,
            amount: pay.amount,
            status: (pay.status || "").toUpperCase(),
            date: pay.paid_at || pay.created_at || "",
            currency: pay.currency || "INR",
            method: pay.payment_method,
            plan: pay.plan_name,
            order_id: pay.razorpay_order_id,
            invoice_url: pay.invoice_url,
          })),
        )

        if (!rows.length && !paymentRows.length) {
          setInvoiceMessage("No billing yet.")
        } else {
          setInvoiceMessage(null)
        }
        const scheduled = rows.some((inv: any) => (inv.status || "").toLowerCase() === "scheduled")
        const paid = rows.some((inv: any) => (inv.status || "").toLowerCase() === "paid")
        setHasScheduledPro(scheduled || paid || paymentRows.length > 0)
      }
    } catch (err) {
      console.error("Billing refresh failed", err)
      setInvoiceMessage("No billing yet.")
      setInvoices([])
      setPayments([])
      setHasScheduledPro(false)
    }
  }, [])

  const loadingView = (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="h-10 w-10 rounded-full border-2 border-gray-200 border-t-teal-500 animate-spin" />
    </div>
  )

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }
      setUser(user)
      setUserId(user.id)

      const { data, error } = await supabase
        .from("profiles")
        .select("subscription_tier, full_name, avatar_url, trial_used, trial_started_at, is_trial_active, trial_ends_at")
        .eq("id", user.id)
        .single()

      if (error && error.code === "PGRST116") {
        const { error: insertErr } = await (supabase as any)
          .from("profiles")
          .insert({ id: user.id, subscription_tier: "free", trial_used: false, full_name: user.email } as any)
        if (insertErr) {
          console.error("Failed to init profile", insertErr)
          setLoading(false)
          return
        }
        setProfile({
          subscription_tier: "free",
          full_name: user.email,
          avatar_url: null as any,
          trial_used: false,
          trial_started_at: null as any,
          is_trial_active: false,
          trial_ends_at: null as any,
        })
      } else {
        const profileData = data as any
        setProfile({
          subscription_tier: profileData?.subscription_tier || "free",
          full_name: profileData?.full_name,
          avatar_url: profileData?.avatar_url,
          trial_used: profileData?.trial_used,
          trial_started_at: profileData?.trial_started_at,
          is_trial_active: profileData?.is_trial_active,
          trial_ends_at: profileData?.trial_ends_at,
        })
      }

      await refreshBillingData()

      setLoading(false)
    }
    load().catch((err) => {
      console.error("Failed to load profile", err)
      setLoading(false)
    })
  }, [router, refreshBillingData])

  useEffect(() => {
    if (!profile || !userId || trialExpiryHandled) return

    const handleTrialStatus = async () => {
      const endsAt = (profile as any)?.trial_ends_at
      const isActive = (profile as any)?.is_trial_active
      const tier = profile.subscription_tier

      if (!endsAt) return
      const endDate = new Date(endsAt)
      const now = new Date()
      const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

      if (isActive && now > endDate && tier !== "pro") {
        try {
          const supabase = createClient()
          await (supabase as any).from("profiles").update({ is_trial_active: false, subscription_tier: "free" }).eq("id", userId)
          setProfile((prev) => ({
            ...(prev || { subscription_tier: "free" }),
            subscription_tier: "free",
            is_trial_active: false,
          }))
          setTrialNotice("Your 7-day trial ended. You're back on Free—upgrade to keep Pro features.")
          setTrialExpiryHandled(true)
        } catch (err) {
          console.error("Failed to end trial", err)
        }
      } else if (daysLeft <= 1 && isActive && tier !== "pro") {
        setTrialNotice(
          `Trial ends soon. ${daysLeft <= 1 ? "Last day" : `${daysLeft} days left`} — add payment to stay on Pro.`,
        )
      }
    }

    handleTrialStatus().catch((err) => console.error("Trial status check failed", err))
  }, [profile, userId, trialExpiryHandled])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleUpdate = () => {
      refreshUserProfile().catch(() => {})
      refreshBillingData().catch(() => {})
    }

    if (!socket.connected) socket.connect()
    socket.on("subscription:update", handleUpdate)
    socket.on("payment:completed", handleUpdate)
    socket.on("invoice:updated", handleUpdate)

    return () => {
      socket.off("subscription:update", handleUpdate)
      socket.off("payment:completed", handleUpdate)
      socket.off("invoice:updated", handleUpdate)
    }
  }, [refreshBillingData, refreshUserProfile])

  const handleCancelPro = async () => {
    setCancelLoading(true)
    setCancelMessage(null)
    try {
      const res = await fetch("/api/subscription/cancel", { method: "POST" })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Unable to cancel subscription")
      }
      setCancelMessage("Pro cancelled. You are now on Free.")
      await refreshUserProfile()
      setProfile((prev) => (prev ? { ...prev, subscription_tier: "free", is_trial_active: false } : prev))
    } catch (err) {
      setCancelMessage(err instanceof Error ? err.message : "Unable to cancel subscription")
    } finally {
      setCancelLoading(false)
    }
  }

  const handleActivateNow = async () => {
    setActivateLoading(true)
    setActivateMessage(null)
    try {
      const res = await fetch("/api/subscription/activate-now", { method: "POST" })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Unable to activate now")
      }
      setActivateMessage("Pro activated now.")
      await refreshUserProfile()
      setProfile((prev) => (prev ? { ...prev, subscription_tier: "pro", is_trial_active: false } : prev))
    } catch (err) {
      setActivateMessage(err instanceof Error ? err.message : "Unable to activate now")
    } finally {
      setActivateLoading(false)
    }
  }

  const memoized = useMemo(() => {
    if (loading) {
      return {
        trialStart: null,
        trialEnd: null,
        trialActive: false,
        trialDaysLeft: null,
        tier: "free",
        isPro: false,
        planLabel: "Free",
        trialEligible: false,
        nextBillingDate: null,
        nextProBilling: null,
        scheduledProStart: null,
        scheduledProEnd: null,
        latestPaidInvoice: null as any,
      }
    }

    const trialStart = profile && (profile as any)?.trial_started_at ? new Date((profile as any).trial_started_at) : null
    const trialEnd = profile && (profile as any)?.trial_ends_at ? new Date((profile as any).trial_ends_at) : null
    const tierLower = (profile?.subscription_tier || "free").toString().toLowerCase()
    const now = new Date()
    const trialActive = Boolean(
      profile &&
        (((profile as any)?.is_trial_active && trialEnd && now <= trialEnd) ||
          ((profile as any)?.trial_used && trialStart && trialEnd && now <= trialEnd && tierLower !== "pro")),
    )
    const trialDaysLeft =
      trialActive && trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : null

    const tier = profile?.subscription_tier || "free"
    const isPro = tier === "pro" || trialActive
    const planLabel = trialActive ? "Trial Pro" : tier.charAt(0).toUpperCase() + tier.slice(1)
    const trialEligible = !trialActive && (profile as any)?.trial_used === false
    const latestInvoice = invoices[0]
    const latestPaidInvoice = invoices.find((inv) => inv.status?.toLowerCase() === "paid") || null
    const scheduledInvoice = invoices.find((inv) => inv.status?.toLowerCase() === "scheduled") || null

    const nextBillingDate = trialActive && trialEnd ? trialEnd.toLocaleDateString() : null
    let nextProBilling: Date | null = null
    if (trialActive && trialEnd) {
      nextProBilling = trialEnd
    } else if (isPro && latestInvoice?.date) {
      const d = new Date(latestInvoice.date)
      if (!Number.isNaN(d.getTime())) {
        const next = new Date(d)
        next.setDate(next.getDate() + 30)
        nextProBilling = next
      }
    }

    let scheduledProStart: Date | null = null
    let scheduledProEnd: Date | null = null
    if (scheduledInvoice?.date) {
      const start = new Date(scheduledInvoice.date)
      if (!Number.isNaN(start.getTime())) {
        scheduledProStart = start
        const end = new Date(start)
        end.setDate(end.getDate() + 30)
        scheduledProEnd = end
      }
    }

    return {
      trialStart,
      trialEnd,
      trialActive,
      trialDaysLeft,
      tier,
      isPro,
      planLabel,
      trialEligible,
      nextBillingDate,
      nextProBilling,
      scheduledProStart,
      scheduledProEnd,
      latestPaidInvoice,
    }
  }, [loading, profile, invoices])

  if (loading) {
    return loadingView
  }

  const {
    trialStart,
    trialEnd,
    trialActive,
    trialDaysLeft,
    tier,
    isPro,
    planLabel,
    trialEligible,
    nextBillingDate,
    nextProBilling,
    scheduledProStart,
    scheduledProEnd,
    latestPaidInvoice,
  } = memoized

  return (
    <div className="w-full max-w-4xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Subscription</h1>
        <p className="text-slate-700">Current plan, trial status, and billing history.</p>
        {trialActive && (
          <Badge className="w-fit bg-[#0f7a5c] text-white hover:bg-[#0c6148]">
            Pro trial — {trialDaysLeft === 0 ? "ends today" : `${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left`}
          </Badge>
        )}
        {trialEligible && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#dfe9dd] bg-[#f7faf7] px-3 py-2 text-sm text-[#0f2c21]">
            <span className="font-semibold text-[#0f7a5c]">Free trial available</span>
            <span className="text-xs text-[#42584a]">Start 7-day Pro trial — no card required.</span>
            <Button asChild size="sm" className="ml-auto bg-[#0f7a5c] text-white hover:bg-[#0c6148]">
              <Link href="/subscription/upgrade">Start trial</Link>
            </Button>
          </div>
        )}
        {trialNotice && (
          <div className="rounded-xl border border-[#dfe9dd] bg-[#f7faf7] px-4 py-3 text-sm text-[#0f2c21]">
            {trialNotice}
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border border-[#dfe9dd] bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg text-[#0f2c21]">Current plan</CardTitle>
              <CardDescription className="text-[#42584a]">
                {trialActive
                  ? `Pro trial active${trialDaysLeft !== null ? ` • ${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left` : ""}`
                  : isPro
                    ? "Pro plan active"
                    : "Free plan"}
              </CardDescription>
            </div>
            <Badge className="bg-[#0f7a5c] text-white">
              {trialActive ? "Trial" : planLabel}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-2xl font-semibold text-[#0f2c21]">
              {trialActive ? "₹0 (trial)" : isPro ? "₹1/mo" : "₹0"}
            </div>
            {trialStart && trialEnd && (
              <p className="text-sm text-[#42584a]">
                Trial: {trialStart.toLocaleDateString()} to {trialEnd.toLocaleDateString()}
              </p>
            )}
            {trialActive && nextBillingDate && (
              <p className="text-sm text-[#42584a]">
                Pro features unlocked. Next billing after trial: {nextBillingDate}
              </p>
            )}
            {trialActive && scheduledProStart && scheduledProEnd && (
              <p className="text-sm text-[#0f7a5c] font-semibold">
                Payment captured — Pro activates {scheduledProStart.toLocaleDateString()} to {scheduledProEnd.toLocaleDateString()}
              </p>
            )}
            {!trialActive && nextProBilling && (
              <p className="text-sm text-[#42584a]">
                Next billing: {nextProBilling.toLocaleDateString()}
              </p>
            )}
            {latestPaidInvoice && (
              <p className="text-sm text-[#42584a]">
                Last payment on {new Date(latestPaidInvoice.date).toLocaleDateString()}.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border border-[#dfe9dd] bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-[#0f2c21]">Actions</CardTitle>
          <CardDescription className="text-[#42584a]">Manage your plan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!isPro && (
              <Button asChild className="w-full bg-[#0f7a5c] text-white hover:bg-[#0c6148]">
                <Link href="/subscription/upgrade">Start/Upgrade to Pro</Link>
              </Button>
            )}
            {trialActive && hasScheduledPro && (
              <Button
                className="w-full bg-[#0f7a5c] text-white hover:bg-[#0c6148]"
                onClick={() => handleActivateNow()}
                disabled={activateLoading}
              >
                {activateLoading ? "Activating..." : "Activate Pro now"}
              </Button>
            )}
            {isPro && (
              <Button
                className="w-full bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                variant="outline"
                disabled={cancelLoading}
                onClick={() => handleCancelPro()}
              >
                {cancelLoading ? "Cancelling..." : "Cancel Pro"}
              </Button>
            )}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button
                asChild
                variant="outline"
                className="w-full border-[#0f7a5c] text-[#0f7a5c] hover:bg-[#eef6f0]"
              >
                <Link href="/pricing">View plans</Link>
              </Button>
              <Button
                variant="ghost"
                className="w-full text-[#0f7a5c] hover:bg-[#eef6f0]"
                onClick={() => refreshUserProfile().catch(() => {})}
              >
                Refresh status
              </Button>
            </div>
            {cancelMessage && (
              <div className="text-xs text-[#0f2c21] rounded-md border border-[#dfe9dd] bg-[#f7faf7] px-3 py-2">
                {cancelMessage}
              </div>
            )}
            {activateMessage && (
              <div className="text-xs text-[#0f2c21] rounded-md border border-[#dfe9dd] bg-[#f7faf7] px-3 py-2">
                {activateMessage}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#dfe9dd] bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-[#0f2c21]">Billing history</CardTitle>
          <CardDescription className="text-[#42584a]">Invoices and payments for your records.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-[#42584a]">
          {invoiceMessage && invoices.length === 0 && payments.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#dfe9dd] bg-white px-4 py-3 text-sm text-[#42584a]">
              {invoiceMessage}
            </div>
          )}

          {invoices.map((inv) => {
            let downloadHref = inv.download_url
            if (typeof window !== "undefined") {
              const fallback = `${window.location.origin}/api/invoices/${inv.id}`
              downloadHref = downloadHref ? downloadHref.replace(/^https?:\/\/[^/]+/, window.location.origin) : fallback
            }

            const formattedDate = (() => {
              const parsed = new Date(inv.date)
              return Number.isNaN(parsed.getTime()) ? inv.date : parsed.toLocaleDateString()
            })()

            return (
              <div
                key={`inv-${inv.id}`}
                className="flex flex-col gap-3 rounded-xl border border-[#dfe9dd] bg-white px-4 py-3 sm:grid sm:grid-cols-[1.2fr_auto_auto] sm:items-center sm:gap-4"
              >
                <div className="space-y-1">
                  <span className="text-xs text-[#42584a]">{formattedDate}</span>
                  <span className="text-sm font-semibold text-[#0f2c21]">Pro plan</span>
                </div>

                <span className="text-sm font-semibold text-[#0f2c21] sm:text-right">
                  {inv.currency || "INR"} {inv.amount / 100}
                </span>

                <div className="flex flex-wrap items-center gap-2 text-xs sm:justify-end">
                  <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold text-[#42584a]">
                    {(inv.status || "").toUpperCase()}
                  </span>
                  {downloadHref ? (
                    <Button asChild size="sm" variant="outline" className="h-7 px-3 border-[#dfe9dd] text-[#0f2c21]">
                      <a href={downloadHref} download>
                        Download
                      </a>
                    </Button>
                  ) : (
                    <Link
                      href="mailto:hello@thamly.com?subject=Invoice%20copy%20request"
                      className="text-xs font-semibold text-[#0f7a5c] hover:text-[#0c6148]"
                    >
                      Request copy
                    </Link>
                  )}
                </div>
              </div>
            )
          })}

          {payments.map((pay) => {
            const formattedDate = (() => {
              const parsed = pay.date ? new Date(pay.date) : null
              return parsed && !Number.isNaN(parsed.getTime()) ? parsed.toLocaleDateString() : pay.date || "—"
            })()

            return (
              <div
                key={`pay-${pay.id}`}
                className="flex flex-col gap-3 rounded-xl border border-[#dfe9dd] bg-white px-4 py-3 sm:grid sm:grid-cols-[1.2fr_auto_auto] sm:items-center sm:gap-4"
              >
                <div className="space-y-1">
                  <span className="text-xs text-[#42584a]">{formattedDate}</span>
                  <span className="text-sm font-semibold text-[#0f2c21]">
                    {pay.plan || "Pro payment"}
                  </span>
                  {pay.method && (
                    <span className="text-xs text-[#42584a] uppercase tracking-wide">
                      {pay.method}
                    </span>
                  )}
                </div>

                <span className="text-sm font-semibold text-[#0f2c21] sm:text-right">
                  {pay.currency || "INR"} {pay.amount / 100}
                </span>

                <div className="flex flex-wrap items-center gap-2 text-xs sm:justify-end">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                      pay.status === "COMPLETED" || pay.status === "PAID"
                        ? "text-emerald-700 border-emerald-200 bg-emerald-50"
                        : "text-[#42584a] border-[#dfe9dd]"
                    }`}
                  >
                    {pay.status}
                  </span>
                  {pay.order_id && <span className="text-[#42584a]">Order: {pay.order_id}</span>}
                  {pay.invoice_url && (
                    <Button asChild size="sm" variant="outline" className="h-7 px-3 border-[#dfe9dd] text-[#0f2c21]">
                      <a href={pay.invoice_url} download>
                        Download
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
