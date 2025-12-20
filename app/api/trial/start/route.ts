"use server"

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

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

    const metadata = (user.user_metadata as Record<string, any>) || {}
    const email = user.email || metadata.email || `${user.id}@placeholder.thamly`
    const fullName = metadata.full_name || email

    const db = process.env.SUPABASE_SERVICE_ROLE_KEY && supabaseAdmin ? supabaseAdmin : supabase
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { ok: false, error: "Supabase configuration missing (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)" },
        { status: 500 },
      )
    }

    // Fetch existing profile
    const isMissingTrialColumns = (msg: string) => {
      const lower = (msg || "").toLowerCase()
      return (
        lower.includes("trial_started_at") ||
        lower.includes("trial_ends_at") ||
        lower.includes("is_trial_active") ||
        lower.includes("trial_used")
      )
    }

    const { data: profile, error: profileError } = await db
      .from("profiles")
      .select("subscription_tier, trial_started_at, trial_ends_at, is_trial_active, email, full_name")
      .eq("id", user.id)
      .maybeSingle()

    if (profileError) {
      const missingColumns = isMissingTrialColumns(profileError.message || "")
      console.error("Trial start profile fetch error", profileError)
      return NextResponse.json(
        {
          ok: false,
          error: missingColumns
            ? "Profiles table is missing trial columns. Run Supabase migrations (007_add_trial_fields.sql, 009_add_trial_control.sql)."
            : "Unable to read profile",
          detail: profileError.message,
        },
        { status: 500 },
      )
    }

    // Trial already used
    if (profile?.trial_started_at) {
      return NextResponse.json({ ok: false, error: "Trial already activated before" }, { status: 400 })
    }

    const now = new Date()
    const endsAt = new Date(now.getTime() + SEVEN_DAYS_MS)

    // Keep subscription_tier within allowed constraint (free|pro|enterprise); mark trials via flags/dates.
    const nextTier = profile?.subscription_tier === "pro" ? "pro" : "free"

    if (profile) {
      const { error: updateError } = await db
        .from("profiles")
        .update({
          trial_started_at: now.toISOString(),
          trial_ends_at: endsAt.toISOString(),
          is_trial_active: true,
          trial_used: true,
          subscription_tier: nextTier,
          email: profile.email || email,
          full_name: profile.full_name || fullName,
        })
        .eq("id", user.id)

      if (updateError) {
        const missingColumns = isMissingTrialColumns(updateError.message || "")
        console.error("Trial start update error", updateError)

        if (missingColumns) {
          const { error: fallbackUpdateError } = await db
            .from("profiles")
            .update({ subscription_tier: nextTier, email: profile.email || email, full_name: profile.full_name || fullName })
            .eq("id", user.id)
          if (fallbackUpdateError) {
            console.error("Trial fallback profile update failed", fallbackUpdateError)
          }

          const { error: metaError } = await supabase.auth.updateUser({
            data: {
              ...metadata,
              trial_used: true,
              trial_started_at: now.toISOString(),
              trial_ends_at: endsAt.toISOString(),
              is_trial_active: true,
            },
          })
          if (metaError) {
            console.error("Trial fallback metadata update failed", metaError)
          }

          return NextResponse.json({
            ok: true,
            trialStarted: true,
            trialEndsAt: endsAt.toISOString(),
            warning: "Profiles table missing trial columns. Run migrations 007_add_trial_fields.sql and 009_add_trial_control.sql.",
          })
        }

        return NextResponse.json(
          { ok: false, error: "Unable to activate trial", detail: updateError.message },
          { status: 500 },
        )
      }
    } else {
      const { error: insertError } = await db.from("profiles").insert({
        id: user.id,
        email,
        full_name: fullName,
        subscription_tier: "free",
        trial_started_at: now.toISOString(),
        trial_ends_at: endsAt.toISOString(),
        is_trial_active: true,
        trial_used: true,
      })

      if (insertError) {
        const missingColumns = isMissingTrialColumns(insertError.message || "")
        console.error("Trial start insert error", insertError)

        if (missingColumns) {
          const { error: fallbackInsertError } = await db
            .from("profiles")
            .insert({ id: user.id, email, full_name: fullName, subscription_tier: "trial" })
          if (fallbackInsertError) {
            console.error("Trial fallback profile insert failed", fallbackInsertError)
          }

          const { error: metaError } = await supabase.auth.updateUser({
            data: {
              ...metadata,
              trial_used: true,
              trial_started_at: now.toISOString(),
              trial_ends_at: endsAt.toISOString(),
              is_trial_active: true,
            },
          })
          if (metaError) {
            console.error("Trial fallback metadata update failed", metaError)
          }

          return NextResponse.json({
            ok: true,
            trialStarted: true,
            trialEndsAt: endsAt.toISOString(),
            warning: "Profiles table missing trial columns. Run migrations 007_add_trial_fields.sql and 009_add_trial_control.sql.",
          })
        }

        return NextResponse.json(
          { ok: false, error: "Unable to create profile for trial", detail: insertError.message },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({ ok: true, trialStarted: true, trialEndsAt: endsAt.toISOString() })
  } catch (error) {
    console.error("Trial start API error", error)
    return NextResponse.json(
      { ok: false, error: "Unexpected error", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
