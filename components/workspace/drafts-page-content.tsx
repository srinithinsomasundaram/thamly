"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ThumbsDown, ThumbsUp, MessageCircle, Sparkles } from "lucide-react"
import { AppShell } from "@/components/layout/app-shell"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { NewDraftButton } from "@/components/drafts/new-draft-button"
import { DraftCard } from "@/components/drafts/draft-card"

interface Draft {
  id: string
  title: string
  status: string
  updated_at: string
  content: string
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

export function DraftPageContent({ embedded = false }: { embedded?: boolean }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient()

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) {
        router.push("/auth/login")
        return
      }

      setUser(authUser)

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single()

      const { data: draftsData = [] } = await supabase
        .from("drafts")
        .select("id,title,status,updated_at,content")
        .eq("user_id", authUser.id)
        .neq("status", "deleted")
        .order("updated_at", { ascending: false })

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

  if (loading) {
    return embedded ? (
      loadingView
    ) : (
      <AppShell user={null} profile={null}>
        {loadingView}
      </AppShell>
    )
  }

  const lastUpdated = drafts[0]?.updated_at ? new Date(drafts[0].updated_at).toLocaleString() : "—"

  const content = (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Drafts</h2>
          <p className="text-slate-700">Tamil drafts, rewrites, and in-progress pieces.</p>
        </div>
        <div className="flex items-center space-x-2">
          <NewDraftButton />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-slate-200/80 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.06)]">
          <CardContent className="p-4 space-y-1">
            <CardTitle className="text-base text-slate-900">Total drafts</CardTitle>
            <p className="text-3xl font-semibold text-slate-900">{drafts.length || 0}</p>
            <p className="text-xs text-slate-600">Last updated: {lastUpdated}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200/80 bg-gradient-to-r from-[#f1fff8] via-white to-white shadow-[0_12px_36px_rgba(15,23,42,0.06)]">
          <CardContent className="p-4 space-y-2">
            <CardTitle className="text-base text-slate-900">Quick start</CardTitle>
            <div className="flex flex-wrap gap-2 text-xs">
              {["News rewrite", "Formal email", "Academic tone", "Social caption"].map((chip) => (
                <span key={chip} className="rounded-full bg-white border border-[#dfe9dd] px-3 py-1 text-[#0f2c21]">
                  {chip}
                </span>
              ))}
            </div>
            <p className="text-xs text-slate-600">Pick a prompt, then start typing in English/Tanglish.</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200/80 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.06)]">
          <CardContent className="p-4 space-y-2">
            <CardTitle className="text-base text-slate-900">Tips</CardTitle>
            <ul className="space-y-1 text-xs text-slate-700 list-disc list-inside">
              <li>Use News mode for neutral, factual style.</li>
              <li>Try “tone: formal” for letters and applications.</li>
              <li>Highlights update as you accept AI suggestions.</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {drafts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {drafts.map((draft) => (
            <DraftCard
              key={draft.id}
              draft={draft}
              onUpdate={() => {
                const fetchDrafts = async () => {
                  const supabase = createClient()
                  const { data: draftsData = [] } = await supabase
                    .from("drafts")
                    .select("id,title,status,updated_at,content")
                    .eq("user_id", user?.id || "")
                    .neq("status", "deleted")
                    .order("updated_at", { ascending: false })
                  setDrafts(draftsData || [])
                }
                fetchDrafts()
              }}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No drafts yet</CardTitle>
            <CardDescription>You haven&apos;t created any drafts yet. Start by creating your first draft.</CardDescription>
          </CardHeader>
          <CardContent>
            <NewDraftButton />
          </CardContent>
        </Card>
      )}
    </div>
  )

  return embedded ? (
    content
  ) : (
    <AppShell user={user} profile={profile}>
      {content}
    </AppShell>
  )
}
