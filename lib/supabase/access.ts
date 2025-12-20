import { supabaseAdmin } from "@/lib/supabase/admin"

type AccessResult = {
  allowed: boolean
  reason?: string
}

// Centralized access check for premium/trial features
export async function checkThamlyAccess(userId: string): Promise<AccessResult> {
  if (!supabaseAdmin) {
    return { allowed: false, reason: "admin_unavailable" }
  }

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("subscription_tier, is_trial_active, trial_ends_at")
    .eq("id", userId)
    .maybeSingle()

  if (error || !profile) {
    return { allowed: false, reason: "profile_missing" }
  }

  const tier = (profile.subscription_tier || "free").toLowerCase()
  const isPro = tier === "pro"
  const isTrial = Boolean(profile.is_trial_active)
  const now = new Date()
  const endsAt = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null

  if (isTrial && endsAt && now > endsAt) {
    // Expired trial: downgrade and block access
    await supabaseAdmin
      .from("profiles")
      .update({ is_trial_active: false, subscription_tier: "free" })
      .eq("id", userId)
    return { allowed: false, reason: "trial_expired" }
  }

  if (isPro || isTrial) {
    return { allowed: true }
  }

  return { allowed: false, reason: "upgrade_required" }
}
