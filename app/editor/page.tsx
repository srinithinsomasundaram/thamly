"use client"

import { useEffect, useMemo, useState, Suspense, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Undo2, Sparkles } from "lucide-react"
import type { RealtimeChannel } from "@supabase/supabase-js"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AIAssistantPanel } from "@/components/ai-assistant-panel"
import type { AISuggestion } from "@/components/ai-suggestion-card"
import { RichTextEditor } from "@/components/rich-text-editor"

interface Draft {
  id: string
  title: string
  content: string
  mode?: "standard" | "news" | "blog" | "academic" | "email"
  status?: string
  deleted_at?: string | null
}

type CollaborationStatus = "none" | "pending" | "accepted" | "ended"

interface CollaborationState {
  status: CollaborationStatus
  email?: string
  ownerId?: string
}

const COLLAB_ENABLED = false
const MODE_STORAGE_KEY = "thamly_draft_modes"
const MODE_SUPPORTED_FLAG_KEY = "thamly_mode_supported"

const readStoredMode = (draftId: string | null) => {
  try {
    if (typeof window === "undefined") return "standard"
    const raw = localStorage.getItem(MODE_STORAGE_KEY)
    if (!raw) return "standard"
    const parsed = JSON.parse(raw)
    const stored = parsed?.[draftId || ""] as Draft["mode"] | undefined
    return stored || "standard"
  } catch (err) {
    console.error("Failed to read stored mode", err)
    return "standard"
  }
}

const readModeSupportedFlag = () => process.env.NEXT_PUBLIC_ENABLE_DRAFT_MODE === "true"

const persistModeSupportedFlag = (_value: boolean) => {
  // no-op until server column is available
}

const persistStoredMode = (draftId: string | null, mode: Draft["mode"]) => {
  try {
    if (typeof window === "undefined") return
    const raw = localStorage.getItem(MODE_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    parsed[draftId || ""] = mode
    localStorage.setItem(MODE_STORAGE_KEY, JSON.stringify(parsed))
  } catch (err) {
    console.error("Failed to persist mode", err)
  }
}

const isModeError = (error: any) => {
  const message = (error?.message || "").toLowerCase()
  return message.includes("mode") && message.includes("column")
}

const deriveAvatar = (user: any, profile?: any) => {
  const identities = (user?.identities as any[]) || []
  const googleIdentity = identities.find((identity) => identity.provider === "google")
  const googleData = (googleIdentity?.identity_data as any) || {}
  const metadata = (user?.user_metadata as any) || {}
  return (
    profile?.avatar_url ||
    googleData.picture ||
    googleData.avatar_url ||
    metadata.avatar_url ||
    metadata.picture ||
    ""
  )
}

function EditorContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialDraftId = searchParams.get("id")
  const isNewSession = useMemo(() => {
    if (!searchParams) return false
    const flag = searchParams.get("new")
    return searchParams.has("new") || flag === "1" || flag === "true"
  }, [searchParams])

  const [loading, setLoading] = useState(true)
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(initialDraftId)
  const [title, setTitle] = useState("Untitled Draft")
  const [content, setContent] = useState("")
  const [mode, setMode] = useState<Draft["mode"]>("standard")
  const [modeSupported, setModeSupported] = useState<boolean>(readModeSupportedFlag)
  const [selectedText, setSelectedText] = useState("")
  const [selectedTextVersion, setSelectedTextVersion] = useState(0)
  const [acceptedCount, setAcceptedCount] = useState(0)
  const [userName, setUserName] = useState<string>("")
  const [userEmail, setUserEmail] = useState<string>("")
  const [userId, setUserId] = useState<string>("")
  const [ownerEmail, setOwnerEmail] = useState<string>("")
  const [avatarUrl, setAvatarUrl] = useState<string>("")
  const [subscriptionTier, setSubscriptionTier] = useState<string>("free")
  const [userMetadata, setUserMetadata] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [collaboration, setCollaboration] = useState<CollaborationState>({ status: "none" })
  const [collabBannerMessage, setCollabBannerMessage] = useState("")
  const [realtimeActive, setRealtimeActive] = useState(false)
  const [viewOnlyMessage, setViewOnlyMessage] = useState("")
  const [showWelcomeGuide, setShowWelcomeGuide] = useState<boolean>(false)
  const [wordMilestoneHit, setWordMilestoneHit] = useState(false)
  const [lastModeToasted, setLastModeToasted] = useState<string>("")
  const assistantRef = useRef<HTMLDivElement | null>(null)
  const [userDefaultTone, setUserDefaultTone] = useState<"formal" | "casual" | "informal" | "neutral">("formal")
  const [showTonePrompt, setShowTonePrompt] = useState(false)
  const [userCreatedAt, setUserCreatedAt] = useState<Date | null>(null)
  const [trialBanner, setTrialBanner] = useState<string | null>(null)
  const [streakDays, setStreakDays] = useState<number>(0)
  const [streakReward, setStreakReward] = useState<string | null>(null)
  const [isNewsSwitching, setIsNewsSwitching] = useState(false)
  const [newsSwitchStep, setNewsSwitchStep] = useState("Initializing Newsroom Draft…")
  const { toast } = useToast()
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const realtimeBroadcastRef = useRef<NodeJS.Timeout | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const applyingRemoteRef = useRef(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [saving, setSaving] = useState(false)
  const defaultUsage = { translation: 0, grammar: 0, spelling: 0, improvement: 0, total: 0 }
  const [usageCounts, setUsageCounts] = useState(defaultUsage)
  const isFreeTier = subscriptionTier === "free"
  const nearLimit = isFreeTier && usageCounts.total >= 20
  useEffect(() => {
    setCurrentDraftId(initialDraftId)
  }, [initialDraftId])

  useEffect(() => {
    setShowWelcomeGuide(isNewSession)
  }, [isNewSession])

  const PREFERENCES_KEY = "thamly_preferences"
  const STREAK_KEY = "thamly_streak"

  const readPreferences = () => {
    if (typeof window === "undefined") return {}
    try {
      const raw = localStorage.getItem(PREFERENCES_KEY)
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  }

  const writePreferences = (prefs: Record<string, any>) => {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs))
    } catch {
      // ignore
    }
  }

const readStreak = (): { lastDate?: string; days?: number } => {
    if (typeof window === "undefined") return {}
    try {
      const raw = localStorage.getItem(STREAK_KEY)
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  }

  const writeStreak = (data: { lastDate: string; days: number }) => {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(STREAK_KEY, JSON.stringify(data))
    } catch {
      // ignore
    }
  }

const refreshCollaboration = useCallback(async (draftId: string) => {
    if (!COLLAB_ENABLED) {
      setCollaboration({ status: "none" })
      setCollabBannerMessage("")
      setViewOnlyMessage("")
      return
    }
    try {
      const supabase = createClient()
      const { data: authData } = await supabase.auth.getUser()
      const sessionUser = authData?.user
      if (!sessionUser) return

      const { data: rows, error } = await supabase
        .from("draft_collaborators")
        .select("id,status,collaborator_email,owner_id")
        .eq("draft_id", draftId)
        .order("created_at", { ascending: false })
        .limit(1)

      if (error) {
        if ((error as any)?.message) {
          console.warn("Failed to load collaboration state", (error as any)?.message)
        }
        setCollaboration({ status: "none" })
        setCollabBannerMessage("")
        setViewOnlyMessage("")
        return
      }

      const invite = rows?.[0]
      if (!invite) {
        setCollaboration({ status: "none" })
        setCollabBannerMessage("")
        setViewOnlyMessage("")
        return
      }

      const status = ((invite as any).status || "pending") as CollaborationStatus
      const collaboratorEmail = (invite as any).collaborator_email as string
      const ownerId = (invite as any).owner_id as string

      setCollaboration({ status, email: collaboratorEmail, ownerId })

      if (status === "accepted") {
        const partner = sessionUser.id === ownerId ? collaboratorEmail : ownerEmail || "draft owner"
        setCollabBannerMessage(`Collaboration active with: ${partner}`)
        setViewOnlyMessage("")
      } else if (status === "pending") {
        setCollabBannerMessage(`Invite pending for ${collaboratorEmail}`)
        setViewOnlyMessage("")
      } else if (status === "ended" && sessionUser.id !== ownerId) {
        setCollabBannerMessage("")
        setViewOnlyMessage("Collaboration ended by owner. You can no longer edit.")
      } else if (status === "ended") {
        setCollabBannerMessage("")
        setViewOnlyMessage("")
      }
    } catch (err) {
      console.error("Failed to refresh collaboration", err)
    }
  }, [ownerEmail])

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const res = await fetch("/api/ai/usage")
        if (!res.ok) return
        const data = await res.json()
        if (data?.counts) {
          setUsageCounts(data.counts)
        }
      } catch (err) {
        console.error("Failed to fetch usage counts", err)
      }
    }
    fetchUsage()
  }, [])

  useEffect(() => {
    const fetchDraft = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login?redirectTo=/editor/new")
        return
      }

      setUserId(user.id)
      setUserMetadata(user.user_metadata || {})
      setUserCreatedAt(user.created_at ? new Date(user.created_at) : null)

      const defaultContent = "Start typing here...\n\nTry a sentence like -> epdi irukeenga"

      if (!currentDraftId) {
        if (isNewSession) {
          const { data: draftRow, error: draftError } = await (supabase as any)
            .from("drafts")
            .insert({
              user_id: user.id,
              title: "Welcome to Thamly",
              content: defaultContent,
              status: "draft",
            })
            .select()
            .single()

          if (draftError) {
            console.error("Failed to create welcome draft", draftError)
            setLoading(false)
            return
          }

          setCurrentDraftId(draftRow?.id || null)
          setTitle(draftRow?.title || "Welcome to Thamly")
          setContent(draftRow?.content || defaultContent)
          setIsOwner(true)
          setUserEmail(user.email || "")
          setUserName((draftRow as any)?.full_name || user.email || "User")
          setAvatarUrl(deriveAvatar(user))

      const { data: profileRow } = await (supabase as any)
        .from("profiles")
        .select("full_name, avatar_url, subscription_tier, trial_started_at, trial_ends_at, is_trial_active, trial_used")
        .eq("id", user.id)
        .maybeSingle()

      const tier = (profileRow?.subscription_tier || "free").toString().toLowerCase()
      const trialStart = profileRow?.trial_started_at ? new Date(profileRow.trial_started_at as any) : null
      const trialEnd = profileRow?.trial_ends_at ? new Date(profileRow.trial_ends_at as any) : null
      const now = new Date()
      const trialActive =
        (profileRow as any)?.is_trial_active === true && trialEnd && now <= trialEnd
          ? true
          : Boolean((profileRow as any)?.trial_used && trialStart && trialEnd && now <= trialEnd && tier !== "pro")
      setSubscriptionTier(trialActive ? "trial-pro" : tier)
      setAvatarUrl(deriveAvatar(user, profileRow))
      setLoading(false)
      return
        }

        setLoading(false)
        return
      }

      const fetchDraftWithMode = async (withMode: boolean) => {
        const fields = withMode
          ? "id,title,content,user_id,status,mode"
          : "id,title,content,user_id,status"
        const { data, error } = await (supabase as any)
          .from("drafts")
          .select(fields)
          .eq("id", currentDraftId)
          .maybeSingle()
        return { data: data as (Draft & { user_id: string }) | null, error }
      }

      let data: (Draft & { user_id: string }) | null = null
      let error: any

      if (modeSupported) {
        const result = await fetchDraftWithMode(true)
        data = result.data
        error = result.error

        if (error && isModeError(error)) {
          setModeSupported(false)
          persistModeSupportedFlag(false)
          const fallback = await fetchDraftWithMode(false)
          data = fallback.data
          error = fallback.error
        }
      } else {
        const result = await fetchDraftWithMode(false)
        data = result.data
        error = result.error
      }

      if (error || !data) {
        toast({
          title: "Unable to open draft",
          description: "You don't have access to this draft.",
          variant: "destructive",
        })
        setLoading(false)
        router.push("/drafts")
        return
      }

      setIsOwner(data.user_id === user.id)
      if (data.user_id === user.id) {
        setOwnerEmail(user.email || "")
      } else {
        const { data: ownerProfile } = await (supabase as any)
          .from("profiles")
          .select("email")
          .eq("id", data.user_id)
          .maybeSingle()
        if (ownerProfile?.email) {
          setOwnerEmail(ownerProfile.email)
        }
      }
      if (data.status === "deleted") {
        toast({
          title: "Draft is in trash",
          description: "This draft was deleted. Restore it from Trash to edit.",
          variant: "destructive",
        })
        setLoading(false)
        router.push("/trash")
        return
      }

      setTitle(data.title || "Untitled Draft")
      setContent(data.content || "")
      const storedMode = readStoredMode(currentDraftId)
      setMode(data.mode || storedMode || "standard")
      persistStoredMode(currentDraftId, data.mode || storedMode || "standard")
      if (modeSupported && data.mode) {
        persistModeSupportedFlag(true)
      }
      await refreshCollaboration(data.id)
      setLoading(false)
    }

    fetchDraft()
  }, [currentDraftId, refreshCollaboration, router, toast, isNewSession, modeSupported])

  useEffect(() => {
    if (currentDraftId) {
      refreshCollaboration(currentDraftId)
    }
  }, [currentDraftId, refreshCollaboration])

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient()
      const { data: authData } = await supabase.auth.getUser()
      const user = authData?.user
      if (!user) return

      const { data: profile } = await (supabase as any)
        .from("profiles")
        .select("full_name, avatar_url, subscription_tier, trial_started_at, trial_ends_at, is_trial_active, trial_used")
        .eq("id", user.id)
        .maybeSingle()
      setUserName(profile?.full_name || user.email || "User")
      setUserEmail(user.email || "")
      setUserId(user.id)
      setAvatarUrl(profile?.avatar_url || (user.user_metadata as any)?.avatar_url || "")

      const tier = (profile?.subscription_tier || "free").toString().toLowerCase()
      const trialStart = profile?.trial_started_at ? new Date(profile.trial_started_at as any) : null
      const trialEnd = profile?.trial_ends_at ? new Date(profile.trial_ends_at as any) : null
      const now = new Date()
      const trialActive =
        (profile as any)?.is_trial_active === true && trialEnd && now <= trialEnd
          ? true
          : Boolean((profile as any)?.trial_used && trialStart && trialEnd && now <= trialEnd && tier !== "pro")
      setSubscriptionTier(trialActive ? "trial-pro" : tier)
    }

    fetchProfile().catch((err) => {
      console.error("Failed to fetch profile", err)
    })
  }, [])

  const canEditDraft = useMemo(() => {
    if (!COLLAB_ENABLED) return isOwner
    if (isOwner) return true
    return collaboration.status === "accepted"
  }, [collaboration.status, isOwner])

  const editorReadOnly = COLLAB_ENABLED
    ? !canEditDraft || (collaboration.status === "ended" && !isOwner)
    : !canEditDraft

  const wordCount = useMemo(() => {
    return content.split(/\s+/).filter(Boolean).length
  }, [content])

  // Word-count milestone
  useEffect(() => {
    if (!wordMilestoneHit && wordCount >= 200) {
      setWordMilestoneHit(true)
      toast({
        title: "You're writing well! Keep going 💚",
        duration: 2500,
      })
    }
  }, [wordCount, wordMilestoneHit, toast])

  // Streak tracking (based on writing activity per day)
  useEffect(() => {
    if (!content.trim()) return
    const today = new Date()
    const todayKey = today.toISOString().slice(0, 10)
    const yesterdayKey = new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

    const { lastDate, days = 0 } = readStreak()
    if (lastDate === todayKey) {
      setStreakDays(days)
      return
    }

    const nextDays = lastDate === yesterdayKey ? days + 1 : 1
    setStreakDays(nextDays)
    writeStreak({ lastDate: todayKey, days: nextDays })

    // Reward nudges
    if (nextDays === 3) {
      setStreakReward("Tone mode unlimited for 24h")
    } else if (nextDays === 5) {
      setStreakReward("News mode boost unlocked")
    } else if (nextDays === 10) {
      setStreakReward("2-day Pro unlock coupon available")
    } else {
      setStreakReward(null)
    }
  }, [content])

  // News mode toast
  useEffect(() => {
    if (mode === "news" && lastModeToasted !== "news") {
      setLastModeToasted("news")
      toast({
        title: "📰 Writing for news?",
        description: "Keep tone neutral, factual.",
        duration: 2500,
      })
    } else if (mode !== "news" && lastModeToasted === "news") {
      setLastModeToasted(mode || "")
    }
  }, [mode, lastModeToasted, toast])

  // Personalization: default tone prompt after 3 days
  useEffect(() => {
    const prefs = readPreferences()
    if (prefs.defaultTone) {
      setUserDefaultTone(prefs.defaultTone)
    } else if (userMetadata?.preferences?.defaultTone) {
      setUserDefaultTone(userMetadata.preferences.defaultTone)
      writePreferences({ ...prefs, defaultTone: userMetadata.preferences.defaultTone })
    }

    if (!userCreatedAt || prefs.dismissedTonePrompt || prefs.defaultTone) return
    const now = new Date()
    const diffDays = (now.getTime() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24)
    if (diffDays >= 3) {
      setShowTonePrompt(true)
    }
  }, [userMetadata, userCreatedAt])

  // Trial engagement banners
  useEffect(() => {
    if (!subscriptionTier.includes("trial") && subscriptionTier !== "free") {
      setTrialBanner(null)
      return
    }
    const prefs = readPreferences()
    const trialStartStr = (prefs.trialStartedAt as string) || null
    let startDate = trialStartStr ? new Date(trialStartStr) : null
    if (!startDate && userMetadata?.trial_started_at) {
      startDate = new Date(userMetadata.trial_started_at)
    }
    if (!startDate) {
      setTrialBanner(null)
      return
    }
    const now = new Date()
    const day = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

    if (subscriptionTier === "free") {
      setTrialBanner(null)
      return
    }

    if (day === 1) {
      setTrialBanner("Welcome to Thamly Pro Trial 🎉 Try News Mode for Tamil editorial perfection.")
    } else if (day === 3) {
      const improved = Math.max(acceptedCount, 62)
      setTrialBanner(`Halfway there! You’ve improved ${improved} sentences already. Try Formal Mode for faster rewriting.`)
    } else if (day === 5) {
      const words = Math.max(wordCount, 4120)
      setTrialBanner(`Trial ending soon ⏳ You’ve written ${words} words with Thamly. Don’t lose your pace — upgrade to Pro.`)
    } else if (day >= 7) {
      setTrialBanner("Your trial ended today 💚 Continue writing without limits → Thamly Pro")
    } else {
      setTrialBanner(null)
    }
  }, [subscriptionTier, userMetadata, acceptedCount, wordCount])

  const broadcastContent = useCallback((value: string) => {
    if (!COLLAB_ENABLED) return
    if (!channelRef.current || collaboration.status !== "accepted" || !userId) return
    if (realtimeBroadcastRef.current) {
      clearTimeout(realtimeBroadcastRef.current)
    }
    realtimeBroadcastRef.current = setTimeout(() => {
      channelRef.current?.send({
        type: "broadcast",
        event: "content_update",
        payload: { content: value, sender: userId, email: userEmail },
      })
    }, 200)
  }, [collaboration.status, userEmail, userId])

  const updateContent = (value: string) => {
    setContent(value)
    if (editorReadOnly || !canEditDraft) return
    if (!applyingRemoteRef.current) {
      broadcastContent(value)
    }
  }

  const applyContentWithBroadcast = (compute: (current: string) => string) => {
    setContent((prev) => {
      const next = compute(prev)
      if (!editorReadOnly && canEditDraft && !applyingRemoteRef.current) {
        broadcastContent(next)
      }
      return next
    })
  }

  const applySuggestionToContent = (base: string, suggestion: AISuggestion, selectionText: string) => {
    const replacement = suggestion.suggested
    if (!replacement) return base

    // Prefer explicit highlight range when available
    if (suggestion.highlight && typeof suggestion.highlight.start === "number" && typeof suggestion.highlight.end === "number") {
      const { start, end } = suggestion.highlight
      if (start >= 0 && end > start && end <= base.length) {
        return base.slice(0, start) + replacement + base.slice(end)
      }
    }

    // Replace first matching original text if present
    if (suggestion.original) {
      const idx = base.indexOf(suggestion.original)
      if (idx !== -1) {
        return base.slice(0, idx) + replacement + base.slice(idx + suggestion.original.length)
      }
    }

    // Fallback to current selection if it still exists in content
    if (selectionText && base.includes(selectionText)) {
      const idx = base.indexOf(selectionText)
      return base.slice(0, idx) + replacement + base.slice(idx + selectionText.length)
    }

    // Final fallback: return replacement as full content
    return replacement
  }

  const handleApplyAISuggestion = (suggestion: AISuggestion) => {
    if (editorReadOnly) return
    if (!suggestion?.suggested) return
    const activeSelection = selectedText?.trim() || ""
    const fallbackTranslate = (text: string) => {
      const map: Record<string, string> = {
        ok: "சரி",
        fix: "சரிசெய்",
        newer: "புதிய",
        models: "மாடல்கள்",
        model: "மாடல்",
        done: "முடிந்தது",
        clear: "தெளிவாக",
      }
      return text
        .split(/\s+/)
        .map((w) => map[w.toLowerCase()] ?? w)
        .join(" ")
        .trim()
    }

    const safeDefault = () => "இதை சிறப்பாக மாற்றுகிறேன்"

    const baseReplacement = (() => {
      if (!activeSelection) return suggestion.suggested
      const tooShort = suggestion.suggested.length < Math.max(activeSelection.length * 0.5, activeSelection.length - 4)
      if (!tooShort) return suggestion.suggested
      const mapped = fallbackTranslate(activeSelection)
      return mapped !== activeSelection ? mapped : safeDefault()
    })()

    applyContentWithBroadcast((current) =>
      applySuggestionToContent(current, { ...suggestion, suggested: baseReplacement }, activeSelection)
    )
    setAcceptedCount((prev) => prev + 1)
    setSelectedText("")
    setSelectedTextVersion((prev) => prev + 1)
    toast({
      title: "✔ Improved clarity + tone",
      duration: 1800,
    })
  }

  const handleTonePreference = async (accept: boolean) => {
    setShowTonePrompt(false)
    const prefs = readPreferences()
    const updated = {
      ...prefs,
      dismissedTonePrompt: true,
      ...(accept ? { defaultTone: "casual" } : {}),
    }
    if (accept) {
      setUserDefaultTone("casual")
    }
    writePreferences(updated)

    try {
      const supabase = createClient()
      await supabase.auth.updateUser({
        data: {
          ...(userMetadata || {}),
          preferences: {
            ...(userMetadata?.preferences || {}),
            ...(accept ? { defaultTone: "casual" } : {}),
            dismissedTonePrompt: true,
          },
        },
      })
    } catch (err) {
      console.error("Failed to save tone preference", err)
    }
  }

  const downloadTextFile = (ext: string, mime: string) => {
    if (typeof window === "undefined") return
    if (!content?.trim()) {
      toast({ title: "Add content to download", variant: "destructive" })
      return
    }
    const blob = new Blob([content], { type: `${mime};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    const safeTitle = (title || "document").trim() || "document"
    a.download = `${safeTitle}.${ext}`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const downloadAsPng = () => {
    if (typeof window === "undefined") return
    const canvas = document.createElement("canvas")
    const width = 1200
    const height = 1600
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, width, height)
    ctx.fillStyle = "#0f172a"
    ctx.font = "16px system-ui, -apple-system, sans-serif"
    const lineHeight = 24
    const words = (content || "").split(/\s+/)
    let x = 40
    let y = 80
    const maxWidth = width - 80
    let line = ""
    words.forEach((word) => {
      const testLine = line + word + " "
      const metrics = ctx.measureText(testLine)
      if (metrics.width > maxWidth) {
        ctx.fillText(line, x, y)
        line = word + " "
        y += lineHeight
      } else {
        line = testLine
      }
    })
    if (line.trim().length > 0) {
      ctx.fillText(line, x, y)
    }
    const link = document.createElement("a")
    const safeTitle = (title || "document").trim() || "document"
    link.download = `${safeTitle}.png`
    link.href = canvas.toDataURL("image/png")
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  const handleDownload = (type: "pdf" | "png" | "word") => {
    if (type === "pdf") {
      downloadTextFile("pdf", "application/pdf")
    } else if (type === "word") {
      downloadTextFile("doc", "application/msword")
    } else {
      downloadAsPng()
    }
  }

  const handleCopyShareLink = async () => {
    const draftId = currentDraftId || await saveDraft()
    if (!draftId) {
      toast({ title: "Save your draft first", variant: "destructive" })
      return
    }
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SITE_URL || ""
    const link = origin ? `${origin}/editor?id=${draftId}` : ""
    if (!link) {
      toast({ title: "Unable to build share link", variant: "destructive" })
      return
    }
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: title || "Thamly Draft", url: link })
        toast({ title: "Shared", description: "Draft link shared from your device." })
      } else if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link)
        toast({ title: "Link copied", description: "Invite teammates by sharing the link." })
      } else {
        // Fallback: prompt copy
        window.prompt("Copy this link", link)
      }
    } catch (err) {
      console.error("Copy share link failed", err)
      toast({ title: "Copy failed", description: "Could not copy link. Please copy manually.", variant: "destructive" })
      if (typeof window !== "undefined") {
        window.prompt("Copy this link", link)
      }
    }
  }

  const saveDraft = useCallback(async (): Promise<string | null> => {
    try {
      if (!canEditDraft) return currentDraftId
      setSaving(true)
      const supabase = createClient()
      const { data: session } = await supabase.auth.getUser()
      const user = session?.user
      if (!user) {
        router.push("/auth/login")
        return null
      }

      let draftId = currentDraftId

      const basePayload = {
        title: title || "Untitled Draft",
        content: content || "",
      }

      if (!draftId) {
        const insertPayload = {
          user_id: user.id,
          status: "draft",
          ...basePayload,
          ...(modeSupported ? { mode: mode || "standard" } : {}),
        }

        const { data, error } = await (supabase as any)
          .from("drafts")
          .insert(insertPayload as any)
          .select()
          .single()

        if (error && modeSupported && isModeError(error)) {
          setModeSupported(false)
          persistModeSupportedFlag(false)
          const retry = await (supabase as any)
            .from("drafts")
            .insert({ user_id: user.id, status: "draft", ...basePayload } as any)
            .select()
            .single()
          if (retry.error) {
            console.error("Autosave failed", retry.error)
            return null
          } else if (retry.data?.id) {
            draftId = retry.data.id
            setCurrentDraftId(draftId)
            setLastSaved(new Date())
            router.replace(`/editor?id=${draftId}`)
            persistStoredMode(draftId, mode || "standard")
          }
        } else if (error) {
          console.error("Autosave failed", error)
          return null
        } else if (data?.id) {
          draftId = data.id
          setCurrentDraftId(draftId)
          setLastSaved(new Date())
          router.replace(`/editor?id=${draftId}`)
          if (modeSupported) {
            persistModeSupportedFlag(true)
          }
          persistStoredMode(draftId, mode || "standard")
        }
      } else {
        const updatePayload = {
          ...basePayload,
          ...(modeSupported ? { mode: mode || "standard" } : {}),
          updated_at: new Date().toISOString(),
        }

        const { error } = await (supabase as any)
          .from("drafts")
          .update(updatePayload as any)
          .eq("id", draftId)

        if (error && modeSupported && isModeError(error)) {
          setModeSupported(false)
          persistModeSupportedFlag(false)
          const retry = await (supabase as any)
            .from("drafts")
            .update({ ...basePayload, updated_at: new Date().toISOString() } as any)
            .eq("id", draftId)
          if (retry.error) {
            console.error("Autosave failed", retry.error)
          } else {
            setLastSaved(new Date())
            persistStoredMode(draftId, mode || "standard")
          }
        } else if (error) {
          console.error("Autosave failed", error)
        } else {
          setLastSaved(new Date())
          if (modeSupported) {
            persistModeSupportedFlag(true)
          }
          persistStoredMode(draftId, mode || "standard")
        }
      }
      return draftId || null
    } catch (err) {
      console.error("Autosave failed", err)
      return currentDraftId
    } finally {
      setSaving(false)
    }
  }, [canEditDraft, content, currentDraftId, mode, modeSupported, router, title])

  const createNewsDraft = useCallback(async () => {
    if (isNewsSwitching) return null
    setIsNewsSwitching(true)
    setNewsSwitchStep("Switching to Newsroom Draft…")
    try {
      const res = await fetch("/api/news/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title ? `${title} — News` : "News Draft",
          sourceDraftId: currentDraftId,
        }),
      })
      if (!res.ok) {
        const detail = await res.text().catch(() => "")
        throw new Error(detail || "Failed to create news draft")
      }
      const data = await res.json()
      setNewsSwitchStep("Opening newsroom workspace…")
      const newId = data?.id as string
      const newContent = data?.content || ""
      const newTitle = data?.draft?.title || title || "News Draft"
      setMode("news")
      setContent(newContent)
      setTitle(newTitle)
      setCurrentDraftId(newId)
      persistStoredMode(newId, "news")
      router.replace(`/editor?id=${newId}&new=1`)
      setLastSaved(new Date())
      setLastModeToasted("news")
      return newId
    } catch (err) {
      console.error("News draft creation failed", err)
      toast({
        title: "News Mode unavailable",
        description: "Could not create a newsroom draft. Try again in a moment.",
        variant: "destructive",
      })
      return null
    } finally {
      setTimeout(() => setIsNewsSwitching(false), 600)
    }
  }, [currentDraftId, isNewsSwitching, router, title, toast])

  // Manual save via Cmd/Ctrl+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault()
        saveDraft()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [saveDraft])

  // Real-time collaboration channel
  useEffect(() => {
    if (!COLLAB_ENABLED) return
    const supabase = createClient()
    if (!currentDraftId || !userId || collaboration.status === "none" || collaboration.status === "ended") {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      setRealtimeActive(false)
      return
    }

    const channel = supabase.channel(`draft_${currentDraftId}`, {
      config: { broadcast: { self: true }, presence: { key: userId } },
    })

    channel
      .on("broadcast", { event: "content_update" }, ({ payload }) => {
        if (payload?.sender === userId) return
        applyingRemoteRef.current = true
        setContent(payload?.content || "")
        setTimeout(() => {
          applyingRemoteRef.current = false
        }, 50)
      })
      .on("broadcast", { event: "collab_end" }, () => {
        setCollaboration((prev) => ({ ...prev, status: "ended" }))
        setCollabBannerMessage("")
        if (!isOwner) {
          setViewOnlyMessage("Collaboration ended by owner. You can no longer edit.")
        }
      })
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "draft_collaborators",
          filter: `draft_id=eq.${currentDraftId}`,
        },
        (payload) => {
          const newStatus = (payload.new as any)?.status as CollaborationStatus | undefined
          const newEmail = (payload.new as any)?.collaborator_email as string | undefined
          if (newStatus) {
            setCollaboration((prev) => ({
              ...prev,
              status: newStatus,
              email: newEmail || prev.email,
            }))
          }
          if (newStatus === "ended" && !isOwner) {
            setViewOnlyMessage("Collaboration ended by owner. You can no longer edit.")
            setCollabBannerMessage("")
          } else if (newStatus === "accepted" && newEmail) {
            setCollabBannerMessage(`Collaboration active with: ${newEmail}`)
            setViewOnlyMessage("")
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setRealtimeActive(true)
          channel.track({ email: userEmail || userId, role: isOwner ? "owner" : "collaborator" })
        }
      })

    channelRef.current = channel

    return () => {
      channelRef.current = null
      setRealtimeActive(false)
      supabase.removeChannel(channel)
    }
  }, [collaboration.status, currentDraftId, isOwner, userEmail, userId])

  // Autosave to Supabase drafts (creates if missing)
  useEffect(() => {
    if (!canEditDraft) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)

    saveTimerRef.current = setTimeout(() => {
      saveDraft()
    }, 1000)

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [title, content, mode, currentDraftId, saveDraft, canEditDraft])

  useEffect(() => {
    return () => {
      if (realtimeBroadcastRef.current) clearTimeout(realtimeBroadcastRef.current)
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-slate-500">
        Loading editor...
      </div>
    )
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden p-4 md:p-6"
      style={{
        background: "radial-gradient(circle at 20% 20%, rgba(148, 163, 184, 0.12), transparent 35%), radial-gradient(circle at 80% 10%, rgba(52, 211, 153, 0.12), transparent 30%), linear-gradient(120deg, #f8fafc 0%, #f5f7fb 40%, #f8fafc 100%)",
      }}
    >
      {isNewsSwitching && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-white/85 backdrop-blur-sm">
          <div className="h-11 w-11 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <p className="text-sm font-semibold text-[#0f2c21]">Switching to Newsroom Draft…</p>
          <p className="text-xs text-[#42584a]">{newsSwitchStep}</p>
        </div>
      )}
      <div className="mx-auto flex min-h-[80vh] w-full max-w-7xl flex-col rounded-3xl">
        {collabBannerMessage && (
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {collabBannerMessage}
          </div>
        )}
        {viewOnlyMessage && (
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            {viewOnlyMessage}
          </div>
        )}
        {/* Top nav */}
        <div className="mb-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Image src="/logo1.png" alt="Thamly" width={32} height={32} className="rounded-lg" />
            </div>
            <Link href="/drafts">
              <Button variant="ghost" size="sm" className="text-slate-800 hover:text-slate-900 hover:bg-slate-100">
                <Undo2 className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            <div className="h-4 w-px bg-slate-200" />
            <div className="leading-tight">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-base font-semibold text-slate-900 border-none outline-none bg-transparent"
                placeholder="Untitled Draft"
              />
              <p className="text-xs text-slate-600">
                <span
                  className={
                    saving
                      ? "text-amber-600"
                      : navigator.onLine === false
                        ? "text-slate-500"
                        : lastSaved
                          ? "text-emerald-600"
                          : "text-rose-600"
                  }
                >
                  {saving
                    ? "Saving..."
                    : navigator.onLine === false
                      ? "Offline"
                      : lastSaved
                        ? "Auto saved"
                        : "Not saved"}
                </span>
              </p>
            </div>
            </div>

            <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 bg-white text-slate-900 border-slate-200 hover:bg-slate-50 hover:shadow-[0_10px_30px_rgba(255,193,7,0.35)]"
              onClick={() => router.push("/subscription/upgrade")}
              style={{ display: subscriptionTier === "free" ? "inline-flex" : "none" }}
            >
              <Sparkles className="h-4 w-4 text-amber-500" />
              Upgrade
            </Button>
            <div className="text-sm text-slate-700 flex items-center gap-2">
              {mode === "news" && (
                <span className="flex items-center gap-1 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800 border border-teal-200 shadow-sm">
                  News Mode
                </span>
              )}
              {subscriptionTier === "trial-pro" && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-800 border border-emerald-200 shadow-sm">
                  Trial Pro active
                </span>
              )}
              <span className="text-[11px] font-semibold text-slate-800">
                Usage: {subscriptionTier !== "free" ? "Unlimited" : `${usageCounts.total} checks`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Avatar className="h-9 w-9 border border-slate-200">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt="Profile" /> : <AvatarImage src="/placeholder-user.jpg" alt="Profile" />}
                <AvatarFallback>{(userName || "U").charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>

        {showWelcomeGuide && (
          <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-[#dfe9dd] bg-white/90 px-4 py-3 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-semibold">
                ✨
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-[#0f2c21]">Type anything in English, Tamil, or Tanglish.</p>
                <p className="text-sm text-[#42584a]">I’ll handle the rest. Try: epdi irukeenga</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowWelcomeGuide(false)}
                className="ml-auto text-slate-600 hover:text-slate-900"
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}

        {trialBanner && (
          <div className="mb-3 flex items-center gap-3 rounded-lg border border-[#dfe9dd] bg-white px-3 py-2 text-sm text-[#0f2c21] shadow-sm">
            <span className="text-lg">💚</span>
            <div className="flex-1">{trialBanner}</div>
            <Button size="sm" variant="outline" className="text-[#0f7a5c] border-[#dfe9dd]" onClick={() => setTrialBanner(null)}>
              Dismiss
            </Button>
          </div>
        )}
        {/* Streak banner temporarily disabled per request */}

        {showTonePrompt && (
          <div className="mb-4 flex flex-col gap-2 rounded-2xl border border-[#dfe9dd] bg-white/90 px-4 py-3 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center font-semibold">
                💬
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-semibold text-[#0f2c21]">We noticed you like conversational Tamil.</p>
                <p className="text-sm text-[#42584a]">Switch default tone → Casual?</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="bg-[#0f7a5c] text-white hover:bg-[#0c6148]" onClick={() => handleTonePreference(true)}>
                  Yes
                </Button>
                <Button size="sm" variant="ghost" className="text-slate-600 hover:text-slate-900" onClick={() => handleTonePreference(false)}>
                  No
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="grid flex-1 gap-6 overflow-hidden lg:grid-cols-[2.05fr_1.2fr] items-start">
          {/* Editor panel */}
          <div className="flex h-[70vh] md:h-[75vh] lg:h-[80vh] flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden relative">
            <RichTextEditor
              value={content}
              onChange={(val) => updateContent(val)}
              onTextSelection={(text, _wordAtCursor) => {
                setSelectedText(text)
                if (text && text.trim().length > 0) {
                  setSelectedTextVersion((prev) => prev + 1)
                }
              }}
              mode={mode}
              onModeToggle={() => {
                if (editorReadOnly) return
                const nextMode = mode === "news" ? "standard" : "news"
                if (nextMode === "news") {
                  if (isFreeTier) {
                    toast({
                      title: "You’re writing great!",
                      description: "To keep unlimited corrections and News Mode, upgrade to Pro 💚",
                    })
                  }
                  createNewsDraft()
                  return
                }
                setMode(nextMode)
                persistStoredMode(currentDraftId, nextMode)
                saveDraft()
              }}
              readOnly={editorReadOnly}
            />
            <div className="flex items-center justify-end px-4 py-3 border-t border-slate-100">
              <span className="rounded-full bg-slate-900 px-3 py-1.5 text-xs text-white shadow-sm">
                {wordCount} words • {acceptedCount} accepted
              </span>
            </div>
            <div className="absolute left-4 bottom-3 flex items-center gap-2 text-xs px-3 py-1.5 rounded-full shadow-sm border text-emerald-700 bg-emerald-50 border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              {editorReadOnly ? "View only" : "Live"}
            </div>
          </div>

          {/* AI Assistant */}
          <div
            ref={assistantRef}
            className="flex h-auto md:h-[75vh] lg:h-[80vh] flex-col items-start overflow-hidden w-full max-w-full md:max-w-[520px] mx-auto"
          >
            <AIAssistantPanel
              text={content}
              isAnalyzing={false}
              onApplySuggestion={handleApplyAISuggestion}
              mode={mode}
              selectedText={selectedText}
              selectedTextVersion={selectedTextVersion}
              onUsageUpdate={({ counts }) => {
                setUsageCounts(counts)
              }}
              defaultTone={userDefaultTone}
            />
          </div>
        </div>

      </div>

      {/* Collaboration dialog removed */}
    </div>
  )
}

export default function EditorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center text-slate-500">
        Loading editor...
      </div>
    }>
      <EditorContent />
    </Suspense>
  )
}
