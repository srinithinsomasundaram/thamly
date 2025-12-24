"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Newspaper, PlayCircle, Search, Mic } from "lucide-react"
import { AppShell } from "@/components/layout/app-shell"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { NewDraftButton } from "@/components/drafts/new-draft-button"
import { DraftCard } from "@/components/drafts/draft-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

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
  const [search, setSearch] = useState("")
  const [isCreatingNews, setIsCreatingNews] = useState(false)
  const [trialBanner, setTrialBanner] = useState<string | null>(null)
  const [activeAnnouncement, setActiveAnnouncement] = useState<{
    key: string
    title: string
    body: string
    bullets?: string[]
    ctaLabel?: string
    ctaUrl?: string
  } | null>(null)
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

      // Trial banner logic
      if (profileData) {
        const now = new Date()
        const trialEnd = profileData?.trial_ends_at ? new Date(profileData.trial_ends_at as any) : null
        const trialActive = Boolean(profileData?.is_trial_active && trialEnd && trialEnd >= now)
        const trialEligible = !trialActive && profileData?.trial_used === false
        if (trialActive && trialEnd) {
          const daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
          setTrialBanner(`Pro trial active — ${daysLeft === 0 ? "ends today" : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`}`)
        } else if (trialEligible) {
          setTrialBanner("Free 7-day Pro trial available — no card required.")
        }
      }

      setProfile(profileData)
      setDrafts(draftsData || [])
      setLoading(false)
    }

    fetchProfile()
  }, [])

  useEffect(() => {
    const loadAnnouncements = async (uid: string | null | undefined) => {
      if (!uid) return
      const supabase = createClient()
      const { data: seen = [] } = await supabase
        .from("user_announcements")
        .select("key")
        .eq("user_id", uid)
      const seenKeys = new Set((seen || []).map((r: any) => r.key))

      const announcements = [
        {
          key: "whatsnew_voice_2025_02",
          title: "New: Voice to Text",
          body: "Speak in English or Tamil — Thamly types it instantly. Edit, rewrite, or convert it using AI.",
          bullets: ["🆓 Free: 30 seconds per voice", "💎 Pro: Up to 5 minutes per voice"],
          ctaLabel: "Try Voice Typing",
        },
      ]

      const next = announcements.find((a) => !seenKeys.has(a.key))
      if (next) setActiveAnnouncement(next)
    }

    loadAnnouncements(user?.id)
  }, [user?.id])

  const markAnnouncementSeen = async (key: string) => {
    if (!user?.id) return
    const supabase = createClient()
    await supabase.from("user_announcements").upsert({ user_id: user.id, key, seen_at: new Date().toISOString() })
  }

  const refreshDrafts = async (userId: string | undefined | null) => {
    if (!userId) return
    const supabase = createClient()
    const { data: draftsData = [] } = await supabase
      .from("drafts")
      .select("id,title,status,updated_at,content")
      .eq("user_id", userId)
      .neq("status", "deleted")
      .order("updated_at", { ascending: false })
    setDrafts(draftsData || [])
  }

  const handleResumeLast = () => {
    const last = drafts[0]
    if (last?.id) {
      router.push(`/editor?id=${last.id}`)
    }
  }

  const handleNewsDraft = async () => {
    if (isCreatingNews) return
    try {
      setIsCreatingNews(true)
      const res = await fetch("/api/news/draft", { method: "POST", headers: { "Content-Type": "application/json" } })
      if (!res.ok) throw new Error("create failed")
      const data = await res.json()
      const draftId = data?.id as string
      if (draftId) {
        refreshDrafts(user?.id || null)
        router.push(`/editor?id=${draftId}&new=1`)
        // Mark welcome announcement as seen when user creates a news draft from here
        await markAnnouncementSeen("welcome_v1")
      }
    } catch (err) {
      console.error("news draft create failed", err)
    } finally {
      setIsCreatingNews(false)
    }
  }

  const loadingView = (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="h-10 w-10 rounded-full border-2 border-gray-200 border-t-teal-500 animate-spin" />
    </div>
  )

  const lastUpdated = drafts[0]?.updated_at ? new Date(drafts[0].updated_at).toLocaleString() : "—"
  const filteredDrafts = useMemo(() => {
    const term = search.toLowerCase()
    if (!term) return drafts
    return drafts.filter(
      (d) =>
        d.title.toLowerCase().includes(term) ||
        (d.content || "").toLowerCase().includes(term) ||
        (d.status || "").toLowerCase().includes(term),
    )
  }, [drafts, search])

  const totalWords = drafts.reduce((sum, d) => sum + (d.content ? d.content.split(/\s+/).filter(Boolean).length : 0), 0)
  const avgWords = drafts.length ? Math.round(totalWords / drafts.length) : 0

  if (loading) {
    return embedded ? (
      loadingView
    ) : (
      <AppShell user={null} profile={null}>
        {loadingView}
      </AppShell>
    )
  }

  const content = (
    <div className="flex-1 space-y-6 p-8 pt-6">
          {activeAnnouncement && (
            <div className="relative overflow-hidden rounded-2xl border border-[#c7f0d8] bg-gradient-to-br from-white via-[#f7fff9] to-[#e6f7ee] p-4 shadow-[0_10px_40px_rgba(15,122,92,0.08)]">
              <div className="absolute -left-10 top-2 h-24 w-24 rounded-full bg-emerald-100 blur-3xl" aria-hidden="true" />
              <div className="absolute -right-16 -bottom-10 h-32 w-32 rounded-full bg-emerald-50 blur-3xl" aria-hidden="true" />
              <div className="relative flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-600/10 px-3 py-1 text-xs font-semibold text-emerald-800">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <Mic className="h-3 w-3 text-emerald-700" />
                    New · Voice to Text
                  </div>
                  <p className="text-base font-semibold text-[#0b2d23]">{activeAnnouncement.title}</p>
                  <p className="text-sm text-[#2f4f40]">{activeAnnouncement.body}</p>
                </div>
                <div className="flex items-center gap-2 self-start">
                  {activeAnnouncement.ctaLabel && (
                    <Button
                      size="sm"
                      className="bg-[#0f7a5c] text-white hover:bg-[#0c6148] shadow-sm"
                      onClick={() => {
                    if (activeAnnouncement.ctaUrl) {
                      router.push(activeAnnouncement.ctaUrl)
                    } else {
                      handleResumeLast()
                    }
                    markAnnouncementSeen(activeAnnouncement.key)
                    setActiveAnnouncement(null)
                  }}
                >
                  {activeAnnouncement.ctaLabel}
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="text-slate-600 hover:text-slate-900"
                onClick={() => {
                  markAnnouncementSeen(activeAnnouncement.key)
                  setActiveAnnouncement(null)
                }}
                aria-label="Dismiss"
              >
                ×
              </Button>
            </div>
          </div>
        </div>
      )}

      {trialBanner && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#dfe9dd] bg-[#f7faf7] px-4 py-3 shadow-sm">
          <div className="text-sm text-[#0f2c21] font-semibold">{trialBanner}</div>
          <div className="flex items-center gap-2">
            {trialBanner.toLowerCase().includes("trial available") && (
              <Button asChild size="sm" className="bg-[#0f7a5c] text-white hover:bg-[#0c6148]">
                <a href="/subscription/upgrade">Start trial</a>
              </Button>
            )}
            <Button size="sm" variant="ghost" className="text-slate-600 hover:text-slate-900" onClick={() => setTrialBanner(null)}>
              Dismiss
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Drafts</h2>
          <p className="text-slate-700">Tamil drafts, rewrites, and in-progress pieces.</p>
        </div>
        <div className="flex items-center space-x-2">
          <NewDraftButton />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-slate-200/80 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.06)]">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-slate-900">Your drafts</CardTitle>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700 border border-emerald-100">
                Active
              </span>
            </div>
            <div className="flex items-end gap-3">
              <p className="text-4xl font-semibold text-slate-900 leading-tight">{drafts.length || 0}</p>
              <div className="text-xs text-slate-600">Last edit: {lastUpdated}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/80 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.06)]">
          <CardContent className="p-4 space-y-3">
            <CardTitle className="text-base text-slate-900">Average length</CardTitle>
            <p className="text-4xl font-semibold text-slate-900 leading-tight">{avgWords} words</p>
            <div className="text-xs text-slate-600">Typical size across your drafts</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/80 bg-gradient-to-r from-[#f0fdf4] via-white to-white shadow-[0_12px_36px_rgba(15,23,42,0.06)]">
          <CardContent className="p-4 space-y-3">
            <CardTitle className="text-base text-slate-900">Jump back in</CardTitle>
            <div className="flex flex-wrap gap-2 text-sm">
              <Button size="sm" variant="outline" className="gap-2" onClick={handleResumeLast} disabled={!drafts.length}>
                <PlayCircle className="h-4 w-4" /> Resume last
              </Button>
              <Button size="sm" variant="outline" className="gap-2" onClick={handleNewsDraft} disabled={isCreatingNews}>
                <Newspaper className="h-4 w-4" /> {isCreatingNews ? "Creating…" : "News draft"}
              </Button>
            </div>
            <div className="text-xs text-slate-600">Continue where you left off or start a newsroom draft.</div>
          </CardContent>
        </Card>
      </div>

      {filteredDrafts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredDrafts.map((draft) => (
            <DraftCard
              key={draft.id}
              draft={draft}
              onUpdate={() => {
        refreshDrafts(user?.id || null)
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
