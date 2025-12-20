"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { DashboardNavbar } from "./dashboard-navbar"
import { Skeleton } from "@/components/ui/skeleton"
import { useSocket } from "@/components/providers/socket-provider"
import { useSocketEvent } from "@/hooks/use-socket-event"
import { useUserProfile } from "@/components/providers/user-provider"

type DashboardLayoutWrapperProps = {
  children: React.ReactNode
}

export function DashboardLayoutWrapper({ children }: DashboardLayoutWrapperProps) {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { socket } = useSocket()
  const userContext = useUserProfile()

  useSocketEvent(socket, "profile:update", (payload: any) => {
    if (payload?.id && user?.id === payload.id) {
      setProfile((prev: any) => ({ ...(prev || {}), ...payload }))
    }
  })

  useEffect(() => {
    // If the user/profile are already in context, hydrate from there once per tab
    if (userContext.user) {
      setUser(userContext.user)
      setProfile(userContext.profile)
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        const supabase = createClient()

        // Get current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          router.push("/auth/login")
          return
        }

        setUser(user)

        // Get profile
        try {
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single()

          if (profileError && profileError.code !== 'PGRST116') {
            console.error("Profile fetch error:", profileError)
          }
          setProfile(profileData)
        } catch (profileErr) {
          console.error("Profile error:", profileErr)
          setProfile(null)
        }
      } catch (error) {
        console.error("Unexpected error:", error)
        router.push("/auth/login")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router, userContext.user, userContext.profile])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="h-16 border-b border-gray-200 bg-white px-4 sm:px-6 lg:px-8 flex items-center gap-4">
          <Skeleton className="h-4 w-20 bg-gray-200/80" />
          <Skeleton className="h-10 w-full max-w-lg rounded-lg bg-gray-200/80" />
          <div className="flex items-center gap-3 ml-auto">
            <Skeleton className="h-4 w-16 bg-gray-200/80" />
            <Skeleton className="h-2 w-24 rounded-full bg-gray-200/80" />
            <Skeleton className="h-10 w-10 rounded-full bg-gray-200/80" />
          </div>
        </div>
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-1/3 bg-gray-200/80" />
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-24 w-full rounded-lg bg-gray-200/80" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar
        user={user}
        profile={profile}
      />
      <main>{children}</main>
    </div>
  )
}
