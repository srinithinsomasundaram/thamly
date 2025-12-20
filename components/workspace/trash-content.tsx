"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrashCard } from "@/components/drafts/trash-card"
import { useRouter } from "next/navigation"

interface Draft {
  id: string
  title: string
  status: string
  updated_at: string
  content: string
  deleted_at: string | null
}

interface User {
  id: string
  email?: string
}

interface Profile {
  id: string
  username: string
  full_name: string
  avatar_url: string
}

async function fetchDeletedDrafts(supabase: ReturnType<typeof createClient>, userId: string | null) {
  const { data, error } = await supabase
    .from("drafts")
    .select("id,title,status,updated_at,content,deleted_at")
    .eq("user_id", userId || "")
    .eq("status", "deleted")
    .order("updated_at", { ascending: false })

  if (error) {
    console.error("Failed to load trash drafts", error)
    return []
  }
  return data || []
}

export function TrashPageContent({ embedded = false }: { embedded?: boolean }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient()

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) {
        router.push("/auth/login")
        setLoading(false)
        return
      }

      setUser(authUser)

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single()

      const draftsData = await fetchDeletedDrafts(supabase, authUser.id)

      setProfile(profileData)
      setDrafts(draftsData || [])
      setLoading(false)
    }

    fetchProfile()
  }, [])

  const loadingView = (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="h-10 w-10 rounded-full border-2 border-gray-200 border-t-teal-500 animate-spin" />
    </div>
  )

  if (loading) return loadingView

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Trash</h2>
          <p className="text-slate-700">
            Restore or permanently remove deleted drafts.
          </p>
        </div>
      </div>

      {drafts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {drafts.map((draft) => (
            <TrashCard
              key={draft.id}
              draft={draft}
              onUpdate={() => {
                const fetchDrafts = async () => {
                  const supabase = createClient()
                  const draftsData = await fetchDeletedDrafts(supabase, user?.id || null)
                  setDrafts(draftsData || [])
                }
                fetchDrafts()
              }}
            />
          ))}
        </div>
      ) : (
        <Card className="border-slate-200/70 bg-slate-900">
          <CardHeader>
            <CardTitle className="text-white">Trash is empty</CardTitle>
            <CardDescription className="text-slate-200">Deleted items will appear here with a restore option.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" disabled className="text-white border-slate-500">
              Nothing to restore
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
