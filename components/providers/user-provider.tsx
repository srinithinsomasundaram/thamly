"use client"

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

type UserProviderValue = {
  user: any | null
  profile: any | null
  loading: boolean
  refresh: () => Promise<void>
}

const UserContext = createContext<UserProviderValue>({
  user: null,
  profile: null,
  loading: true,
  refresh: async () => {},
})

export function UserProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), [])
  const [user, setUser] = useState<any | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error || !user) {
        setUser(null)
        setProfile(null)
        return
      }

      setUser(user)

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle()

      if (profileError) {
        console.error("[UserProvider] failed to fetch profile", profileError)
      }

      setProfile(profileData || null)
    } catch (err) {
      console.error("[UserProvider] failed to load user/profile", err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    load()
    const { data } = supabase.auth.onAuthStateChange(() => {
      load().catch(() => {})
    })
    return () => {
      data?.subscription.unsubscribe()
    }
  }, [supabase, load])

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      refresh: load,
    }),
    [user, profile, loading, load],
  )

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUserProfile() {
  return useContext(UserContext)
}
