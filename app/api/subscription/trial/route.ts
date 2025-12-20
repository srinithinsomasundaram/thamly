"use server"

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ ok: false, error: "Supabase env vars missing" }, { status: 500 })
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 })
    }

    const metadata = (user.user_metadata as Record<string, any>) || {}

    let trialUsed = Boolean(metadata.trial_used)
    let trialColumnMissing = false
    let subscriptionTier = ""
    const email = user.email || metadata.email || `${user.id}@placeholder.thamly`
    let fullName = metadata.full_name || email || ""

    // Check global trial history by email to prevent reuse after account deletion
    if (email) {
      const { data: historyRow } = await supabase
        .from("trial_history")
        .select("id")
        .eq("email", email)
        .maybeSingle()
      if (historyRow) {
        return NextResponse.json({ ok: false, error: "Trial already used" }, { status: 400 })
      }
    }

    const { data: profileRow, error: profileError } = await supabase
      .from("profiles")
      .select("id, trial_used, trial_started_at, subscription_tier, full_name, email")
      .eq("id", user.id)
      .maybeSingle()

    if (profileError) {
      // If the trial columns have not been migrated yet, fall back to metadata-based tracking
      if (
        profileError.code === "42703" ||
        profileError.code === "PGRST204" ||
        (profileError.message || "").toLowerCase().includes("trial_used")
      ) {
        trialColumnMissing = true
      } else {
        console.error("Trial profile fetch error", profileError)
        return NextResponse.json(
          { ok: false, error: "Unable to read profile", detail: profileError.message },
          { status: 500 },
        )
      }
    }

    if (profileRow) {
      subscriptionTier = profileRow.subscription_tier || ""
      fullName = profileRow.full_name || fullName
      if (!profileRow.email && email) {
        await supabase.from("profiles").update({ email }).eq("id", user.id)
      }
      if (profileRow.trial_used !== null && profileRow.trial_used !== undefined) {
        trialUsed = profileRow.trial_used
      }
    } else if (!profileError) {
      const trialStartedAt = new Date().toISOString()
      const { error: insertProfileError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          subscription_tier: "free",
          full_name: fullName,
          email,
          trial_used: true,
          trial_started_at: trialStartedAt,
        })
      if (insertProfileError) {
        console.error("Trial profile insert error", insertProfileError)
        return NextResponse.json(
          { ok: false, error: "Unable to create profile", detail: insertProfileError.message },
          { status: 500 },
        )
      }
    } else if (trialColumnMissing) {
      return NextResponse.json(
        { ok: false, error: "Profiles table missing trial columns. Run migrations." },
        { status: 500 },
      )
    }

    if (trialUsed) {
      return NextResponse.json({ ok: false, error: "Trial already used" }, { status: 400 })
    }

    const trialStartedAt = new Date().toISOString()

    if (!trialColumnMissing) {
      const { error: updateProfileError } = await supabase
        .from("profiles")
        .update({
          trial_used: true,
          trial_started_at: trialStartedAt,
          subscription_tier: subscriptionTier || "free",
          full_name: fullName,
          email,
        })
        .eq("id", user.id)

      if (updateProfileError) {
        console.error("Trial profile update error", updateProfileError)
        return NextResponse.json(
          { ok: false, error: "Unable to save trial to profile", detail: updateProfileError.message },
          { status: 500 },
        )
      }
    } else {
      const { error: fallbackUpdateError } = await supabase
        .from("profiles")
        .update({
          subscription_tier: subscriptionTier || "free",
          full_name: fullName,
          email,
        })
        .eq("id", user.id)

      if (fallbackUpdateError) {
        console.error("Trial fallback profile update error", fallbackUpdateError)
        return NextResponse.json(
          { ok: false, error: "Unable to save trial to profile", detail: fallbackUpdateError.message },
          { status: 500 },
        )
      }
    }

    const { error: updateUserError } = await supabase.auth.updateUser({
      data: { ...metadata, trial_used: true, trial_started_at: trialStartedAt },
    })

    if (updateUserError) {
      console.error("Trial metadata update error", updateUserError)
      return NextResponse.json(
        { ok: false, error: "Unable to save trial state", detail: updateUserError.message },
        { status: 500 },
      )
    }

    // Record in trial history to prevent reuse even if account is deleted
    if (email) {
      await supabase.from("trial_history").upsert({ email, user_id: user.id, started_at: trialStartedAt })
    }

    return NextResponse.json({ ok: true, trialStarted: true })
  } catch (error) {
    console.error("Trial API error", error)
    return NextResponse.json(
      { ok: false, error: "Unexpected error", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
