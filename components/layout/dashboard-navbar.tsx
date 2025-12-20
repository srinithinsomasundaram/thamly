"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { fetchGoogleProfileImage, syncGoogleProfileData } from "@/lib/supabase/google-profile"
import { DynamicSearch } from "@/components/search/dynamic-search"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Sparkles, Shield, Headset } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useUsageStatus } from "@/hooks/use-usage-status"
import { useSocket } from "@/components/providers/socket-provider"

interface DashboardNavbarProps {
  user?: any
  profile?: any
  hideWorkspace?: boolean
  hideSearch?: boolean
  hideHelp?: boolean
  backButton?: {
    href?: string
    text?: string
  }
  title?: string
  onTitleChange?: (title: string) => void
  saving?: boolean
  lastSaved?: Date | null
}

export function DashboardNavbar({
  user,
  profile,
  hideWorkspace = false,
  hideSearch = false,
  hideHelp = false,
  backButton,
  title,
  onTitleChange,
  saving,
  lastSaved,
}: DashboardNavbarProps) {
  const router = useRouter()
  const { socket } = useSocket()
  const googleIdentity = user?.identities?.find((identity: any) => identity.provider === "google")
  const googleIdentityData = googleIdentity?.identity_data as any
  const googleAvatarFromIdentity = googleIdentityData?.picture || googleIdentityData?.avatar_url || (user?.user_metadata as any)?.picture
  const googleNameFromIdentity = googleIdentityData?.name
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url || googleAvatarFromIdentity || user?.user_metadata?.avatar_url || null)
  const [displayName, setDisplayName] = useState<string>(profile?.full_name || googleNameFromIdentity || user?.user_metadata?.full_name || user?.email || "User")
  const metadataAvatar = (user?.user_metadata as any)?.avatar_url || (user?.user_metadata as any)?.picture
  const metadataName = (user?.user_metadata as any)?.full_name

  useEffect(() => {
    // Auto-sync Google profile data on component mount
    const autoSyncGoogleProfile = async () => {
      if (!user?.identities) return

      const googleIdentity = user.identities.find((identity: any) => identity.provider === "google")
      if (!googleIdentity) return

      const googleData = googleIdentity.identity_data as any
      const identityAvatar = googleData?.picture || googleData?.avatar_url || (user?.user_metadata as any)?.picture
      const identityName = googleData?.name

      if (identityAvatar) {
        setAvatarUrl((current) => current || identityAvatar)
      }
      if (identityName) {
        setDisplayName((current) => {
          if (current && current !== "User" && current !== user?.email) return current
          return identityName
        })
      }

      if (profile?.avatar_url || avatarUrl) {
        if (!profile?.avatar_url) {
          try {
            await syncGoogleProfileData(user.id)
          } catch (error) {
            console.error("Auto-sync Google profile failed:", error)
          }
        }
        return
      }

      try {
        const googleAvatarUrl = await fetchGoogleProfileImage(user.id)
        if (googleAvatarUrl) {
          setAvatarUrl((current) => current || googleAvatarUrl)
        }
      } catch (error) {
        console.error("Auto-sync Google profile failed:", error)
      }
    }

    autoSyncGoogleProfile()
  }, [user, profile, avatarUrl])

  useEffect(() => {
    const googleData = (user?.identities?.find((identity: any) => identity.provider === "google")?.identity_data || {}) as any
    const derivedAvatar = profile?.avatar_url || googleData?.picture || googleData?.avatar_url || (user?.user_metadata as any)?.picture || user?.user_metadata?.avatar_url
    const derivedName = profile?.full_name || googleData?.name || user?.user_metadata?.full_name || user?.email

    if (derivedAvatar && derivedAvatar !== avatarUrl) {
      setAvatarUrl(derivedAvatar)
    }
    if (derivedName && derivedName !== displayName) {
      setDisplayName(derivedName)
    }
    if (socket && user?.id) {
      socket.emit("profile:ready", { userId: user.id, avatar: derivedAvatar, name: derivedName })
    }
  }, [profile, user, avatarUrl, displayName, socket])

  useEffect(() => {
    // Fallback to auth metadata even when no Google identity is present
    if (metadataAvatar && metadataAvatar !== avatarUrl) {
      setAvatarUrl(metadataAvatar)
    }
    if (metadataName && metadataName !== displayName) {
      setDisplayName(metadataName)
    }
    const persistAvatar = async () => {
      if (!user?.id || !metadataAvatar) return
      if (profile?.avatar_url) return
      try {
        const supabase = createClient()
        await (supabase as any)
          .from("profiles")
          .update({ avatar_url: metadataAvatar, full_name: profile?.full_name || metadataName || user.email })
          .eq("id", user.id)
      } catch (err) {
        console.error("Failed to persist avatar to profile", err)
      }
    }
    persistAvatar()
  }, [metadataAvatar, metadataName, avatarUrl, displayName, profile?.avatar_url, user?.id])

  useEffect(() => {
    if (!socket || !user?.id) return
    socket.emit("shell:ready", { userId: user.id })
  }, [socket, user?.id])

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id || avatarUrl) return

      try {
        const supabase = createClient()
        const { data } = await (supabase as any).from("profiles").select("full_name, avatar_url").eq("id", user.id).maybeSingle()
        if (data) {
          if (data.avatar_url && data.avatar_url !== avatarUrl) {
            setAvatarUrl(data.avatar_url)
          }
          if (data.full_name && data.full_name !== displayName) {
            setDisplayName(data.full_name)
          }
        }
      } catch (err) {
        console.error("Failed to fetch profile for navbar", err)
      }
    }
    fetchProfile()
  }, [user?.id, avatarUrl])

  const usageStatus = useUsageStatus()
  const currentUsage = usageStatus.usage
  const isProfileLoading = !user || !profile
  const trialStart = profile?.trial_started_at ? new Date(profile.trial_started_at as any) : null
  const trialEnd = profile?.trial_ends_at ? new Date(profile.trial_ends_at as any) : null
  const now = new Date()
  const trialActive =
    (profile?.is_trial_active && trialEnd && now <= trialEnd) ||
    (profile?.trial_used && trialStart && trialEnd && now <= trialEnd && profile?.subscription_tier !== "pro")
  const isFreeTier = (profile?.subscription_tier || "free") === "free" && !trialActive

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } finally {
      router.push("/auth/login")
    }
  }

  return (
    <nav className="border-b border-gray-200 bg-white/95 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center gap-4">
          {/* Back Button */}
          {backButton?.href && (
            <div className="shrink-0">
              <Button variant="ghost" asChild className="gap-2 text-gray-700 hover:text-gray-900 h-9 px-3">
                <Link href={backButton.href}>
                  ← {backButton.text || "Back"}
                </Link>
              </Button>
            </div>
          )}

          {/* Title Field */}
          {title !== undefined && (
            <div className="shrink-0 flex-1 max-w-md">
              {onTitleChange ? (
                <input
                  type="text"
                  value={title}
                  onChange={(e) => onTitleChange(e.target.value)}
                  placeholder="Untitled Draft"
                  className="text-xl font-bold text-gray-900 bg-transparent border-none outline-none w-full focus:ring-0 focus:outline-none"
                />
              ) : (
                <div className="text-xl font-bold text-gray-900 truncate">
                  {title || "Untitled Draft"}
                </div>
              )}
            </div>
          )}

          {/* Workspace Label */}
          {!hideWorkspace && !title && (
            <div className="shrink-0">
              {isProfileLoading ? (
                <Skeleton className="h-4 w-20 bg-gray-200/80" />
              ) : (
                <div className="text-sm font-medium text-gray-600">Workspace</div>
              )}
            </div>
          )}

          {/* Search */}
          {!hideSearch && (
            <div className="flex-1 max-w-lg w-full">
              {isProfileLoading ? (
                <Skeleton className="h-10 w-full rounded-lg bg-gray-200/80" />
              ) : (
                <DynamicSearch
                  type="all"
                  placeholder="Search drafts, settings, billing..."
                  className="w-full"
                />
              )}
            </div>
          )}

          <div className="flex items-center gap-4 ml-auto">
            {/* Help */}
            {!hideHelp && (
              <>
                {isProfileLoading ? (
                  <Skeleton className="h-9 w-16 hidden md:block bg-gray-200/80" />
                ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden md:inline-flex gap-2 text-gray-600 hover:text-gray-900"
                  asChild
                >
                  <Link href="/help">
                    <Headset className="w-4 h-4" />
                    Help
                  </Link>
                </Button>
                )}
              </>
            )}

            {/* Usage */}
            <div className="hidden lg:flex items-center gap-3">
              {isProfileLoading ? (
                <Skeleton className="h-4 w-24 bg-gray-200/80" />
              ) : (
                <span className="text-[11px] font-semibold text-slate-800">
                  Usage: {usageStatus.isUnlimited ? "Unlimited" : `${currentUsage} checks`}
                </span>
              )}
            </div>

            {/* Upgrade Button for Free Users */}
            {!isProfileLoading && isFreeTier && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 bg-white text-slate-900 border-slate-200 hover:bg-slate-50 hover:shadow-[0_10px_30px_rgba(255,193,7,0.35)]"
                asChild
              >
                <Link href="/subscription/upgrade">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Upgrade
                </Link>
              </Button>
            )}
            {!isProfileLoading && !isFreeTier && (
              <span className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                {trialActive ? "TRIAL PRO" : "PRO"}
              </span>
            )}

            {/* Profile */}
            {(saving || lastSaved) && (
              <div className={`text-xs whitespace-nowrap ${saving ? "text-gray-500" : "text-green-600"}`}>
                {saving ? "Saving..." : `Saved ${lastSaved?.toLocaleTimeString()}`}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
