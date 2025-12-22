"use server"

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000

export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 })
    }

    const { data: lastPayment } = await supabase
      .from("payments")
      .select("id, status, paid_at, created_at")
      .eq("user_id", user.id)
      .order("paid_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    const paidAtRaw = lastPayment?.paid_at || lastPayment?.created_at
    if (paidAtRaw) {
      const paidAt = new Date(paidAtRaw as any)
      const now = new Date()
      const msSincePayment = now.getTime() - paidAt.getTime()
      if (msSincePayment > THREE_DAYS_MS) {
        return NextResponse.json(
          { ok: false, error: "Cancellations are only allowed within 3 days of purchase. Please contact support for help." },
          { status: 400 },
        )
      }
    }

    const todayIso = new Date().toISOString().slice(0, 10)

    const updates = {
      subscription_tier: "free",
      subscription_status: "cancelled",
      is_trial_active: false,
      trial_ends_at: null,
      subscription_updated_at: new Date().toISOString(),
      usage_count: 0,
      usage_reset_at: todayIso,
    }

    const { error: profileError } = await supabase.from("profiles").update(updates).eq("id", user.id)
    if (profileError) {
      console.error("Cancel subscription failed", profileError)
      return NextResponse.json(
        { ok: false, error: "Unable to cancel subscription", detail: profileError.message },
        { status: 500 },
      )
    }

    if (lastPayment?.id) {
      const { error: refundFlagError } = await supabase
        .from("payments")
        .update({ status: "refund_requested" })
        .eq("id", lastPayment.id)
      if (refundFlagError) {
        console.error("Cancel subscription refund flag failed", refundFlagError)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Cancel subscription API error", error)
    return NextResponse.json(
      { ok: false, error: "Unexpected error", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
