"use server"

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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

    // Activate Pro immediately
    const updates = {
      subscription_tier: "pro",
      subscription_status: "active",
      is_trial_active: false,
      trial_ends_at: null,
      subscription_updated_at: new Date().toISOString(),
    }

    const { error: profileError } = await supabase.from("profiles").update(updates).eq("id", user.id)
    if (profileError) {
      console.error("Activate-now profile update failed", profileError)
      return NextResponse.json({ ok: false, error: "Unable to activate Pro now" }, { status: 500 })
    }

    // Convert any scheduled invoices to paid with today's date
    const { data: scheduledInvoices, error: invoiceFetchError } = await supabase
      .from("invoices")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "scheduled")

    if (!invoiceFetchError && scheduledInvoices?.length) {
      const today = new Date().toISOString()
      await supabase
        .from("invoices")
        .update({ status: "paid", invoice_date: today })
        .eq("user_id", user.id)
        .eq("status", "scheduled")
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Activate-now API error", error)
    return NextResponse.json(
      { ok: false, error: "Unexpected error", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
