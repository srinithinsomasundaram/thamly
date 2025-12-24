"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Zap, ArrowLeft, Sparkles } from "lucide-react"
import Link from "next/link"
import { syncGoogleProfileData } from "@/lib/supabase/google-profile"
import { EditorSearch } from "@/components/search/editor-search"
import { useUsageStatus } from "@/hooks/use-usage-status"

export function EditorNavbar({ saveStatus = "idle" }: { saveStatus?: "idle" | "saving" | "saved" }) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient()

        // Get current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError) {
          console.error("Navbar auth error:", userError)
          router.push("/auth/login")
          return
        }

        if (!user) {
          router.push("/auth/login")
          return
        }

        setUser(user)

        // Get profile
        try {
          const { data: profileData, error: profileError } = await (supabase as any)
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle()

          if (profileError && profileError.code !== 'PGRST116') {
            console.error("Navbar profile error:", profileError)
          }
          setProfile(profileData)
          if (profileData?.avatar_url) {
            setAvatarUrl(profileData.avatar_url)
          }

          // Auto-sync Google profile if needed
          if (user?.identities && !(profileData as any)?.avatar_url) {
            const googleIdentity = user.identities.find((identity: any) => identity.provider === 'google')
            if (googleIdentity) {
              try {
                await syncGoogleProfileData(user.id)
                // Refetch profile after sync
                const { data: updatedProfile } = await (supabase as any)
                  .from("profiles")
                  .select("*")
                  .eq("id", user.id)
                  .maybeSingle()
                setProfile(updatedProfile)
                if (updatedProfile?.avatar_url) {
                  setAvatarUrl(updatedProfile.avatar_url)
                }
              } catch (syncError) {
                console.error("Google profile sync failed:", syncError)
              }
            }
          }
        } catch (profileErr) {
          console.error("Navbar profile fetch error:", profileErr)
          setProfile(null)
        }
      } catch (error) {
        console.error("Navbar unexpected error:", error)
        router.push("/auth/login")
        return
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [router])

  const usageStatus = useUsageStatus()
  const usageDisplay = usageStatus.isUnlimited
    ? "Unlimited"
    : `${usageStatus.usage}/${usageStatus.limit} checks`

  if (isLoading) {
    return (
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="max-w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-muted rounded animate-pulse"></div>
            <div className="w-16 h-4 bg-muted rounded animate-pulse"></div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-4 bg-muted rounded animate-pulse"></div>
            <div className="w-8 h-8 bg-muted rounded-full animate-pulse"></div>
          </div>
        </div>
      </nav>
    )
  }

  useEffect(() => {
    if (!user) return
    const metadataAvatar = (user.user_metadata as any)?.avatar_url || (user.user_metadata as any)?.picture
    if (metadataAvatar && !avatarUrl) {
      setAvatarUrl(metadataAvatar)
    }
    if (metadataAvatar && profile && !profile.avatar_url) {
      const persist = async () => {
        try {
          const supabase = createClient()
          await (supabase as any).from("profiles").update({ avatar_url: metadataAvatar }).eq("id", user.id)
        } catch (err) {
          console.error("Failed to persist navbar avatar", err)
        }
      }
      persist()
    }
  }, [user, profile, avatarUrl])

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
      <div className="max-w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left Section - Back Button + Search */}
        <div className="flex items-center gap-3 flex-1">
          <Button variant="ghost" size="sm" asChild className="p-2">
            <Link href="/drafts">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div className="flex-1 max-w-md">
            <EditorSearch />
          </div>
        </div>

        {/* Right Section - Tokens + User Profile */}
        <div className="flex items-center gap-4">
          {/* Save Status */}
          <div className="flex items-center gap-2 text-sm">
            {saveStatus === "saving" && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                Saving...
              </div>
            )}
            {saveStatus === "saved" && (
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Saved
              </div>
            )}
            {saveStatus === "idle" && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                Not saved
              </div>
            )}
          </div>

          {/* Tokens */}
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">
              {usageDisplay}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            Usage: {usageStatus.isUnlimited ? "Unlimited" : `${usageStatus.usage}/${usageStatus.limit} today`}
          </div>

          {/* Upgrade button */}
          {usageStatus.tier === "free" && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="flex items-center gap-1 rounded-full border-slate-200 text-slate-800 hover:bg-slate-50"
            >
              <Link href="/subscription/upgrade">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Upgrade
              </Link>
            </Button>
          )}

          {/* User Profile */}
          <Link href="/settings" className="flex items-center gap-2">
            <Avatar className="w-8 h-8 border-2 border-border/50">
              <AvatarImage src={avatarUrl || profile?.avatar_url || (user?.user_metadata as any)?.avatar_url || (user?.user_metadata as any)?.picture || ""} alt="Profile" />
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-sm">
                {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </nav>
  )
}
