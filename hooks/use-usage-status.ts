"use client"

import { useMemo } from "react"
import { useUserProfile } from "@/components/providers/user-provider"
import { USAGE_LIMITS } from "@/lib/constants"

export type UsageStatus = {
  usage: number
  limit: number
  remaining: number | typeof Infinity
  percentage: number
  label: string
  tier: string
  isUnlimited: boolean
}

export function useUsageStatus(): UsageStatus {
  const { profile } = useUserProfile()

  return useMemo(() => {
    const today = new Date()
    const resetAt = profile?.usage_reset_at ? new Date(profile.usage_reset_at as any) : null
    const isSameDay =
      resetAt &&
      today.getUTCFullYear() === resetAt.getUTCFullYear() &&
      today.getUTCMonth() === resetAt.getUTCMonth() &&
      today.getUTCDate() === resetAt.getUTCDate()

    const usage = isSameDay ? Math.max(0, profile?.usage_count ?? 0) : 0
    const tier = (profile?.subscription_tier || "free").toString().trim().toLowerCase()
    const trialStart = profile?.trial_started_at ? new Date(profile.trial_started_at as any) : null
    const trialEnd = profile?.trial_ends_at ? new Date(profile.trial_ends_at as any) : null
    const now = new Date()
    const trialActive =
      (profile?.is_trial_active && trialEnd && now <= trialEnd) ||
      (profile?.trial_used && trialStart && trialEnd && now <= trialEnd && tier !== "pro")

    const limit = tier === "free" && !trialActive ? USAGE_LIMITS.free : Infinity
    const remaining = Number.isFinite(limit) ? Math.max(0, limit - usage) : Infinity
    const isUnlimited = !Number.isFinite(limit)
    const percentage = Number.isFinite(limit) && limit > 0 ? Math.min(100, (usage / limit) * 100) : 0
    const label = trialActive
      ? "Trial Pro · Unlimited"
      : isUnlimited
        ? "Unlimited"
        : `${remaining} left`

    return {
      usage,
      limit,
      remaining,
      percentage,
      label,
      tier,
      isUnlimited,
    }
  }, [profile])
}
