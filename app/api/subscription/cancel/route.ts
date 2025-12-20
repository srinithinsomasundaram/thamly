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

    const updates = {
      subscription_tier: "free",
      subscription_status: "cancelled",
      is_trial_active: false,
      trial_ends_at: null,
      subscription_updated_at: new Date().toISOString(),
    }

    const { error: profileError } = await supabase.from("profiles").update(updates).eq("id", user.id)
    if (profileError) {
      console.error("Cancel subscription failed", profileError)
      return NextResponse.json(
        { ok: false, error: "Unable to cancel subscription", detail: profileError.message },
        { status: 500 },
      )
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
