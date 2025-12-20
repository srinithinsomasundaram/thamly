"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Type, SpellCheck, Highlighter, PenSquare } from "lucide-react"

type UsageCounts = {
  translation: number
  grammar: number
  spelling: number
  improvement: number
  total: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [wordCount, setWordCount] = useState(0)
  const [usage, setUsage] = useState<UsageCounts>({
    translation: 0,
    grammar: 0,
    spelling: 0,
    improvement: 0,
    total: 0,
  })

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login?redirectTo=/dashboard")
        return
      }

      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      // Words written (approximate) from drafts updated this week
      const { data: drafts } = await supabase
        .from("drafts")
        .select("content, updated_at")
        .gte("updated_at", sevenDaysAgo.toISOString())
        .limit(200)

      const words = (drafts || []).reduce((acc, d: any) => {
        const text = (d?.content || "") as string
        const count = text.split(/\s+/).filter(Boolean).length
        return acc + count
      }, 0)
      setWordCount(words)

      // Usage logs this week
      const { data: logs } = await supabase
        .from("usage_logs")
        .select("action, created_at")
        .gte("created_at", sevenDaysAgo.toISOString())
        .limit(500)

      const counts: UsageCounts = { translation: 0, grammar: 0, spelling: 0, improvement: 0, total: 0 }
      ;(logs || []).forEach((row: any) => {
        const action = row?.action as keyof UsageCounts
        if (counts[action] !== undefined) {
          counts[action] += 1
          counts.total += 1
        }
      })
      setUsage(counts)
      setLoading(false)
    }
    load().catch((err) => {
      console.error("Dashboard load failed", err)
      setLoading(false)
    })
  }, [router])

  const progressSummary = useMemo(() => {
    return [
      { label: "Words written", value: wordCount, icon: Type },
      { label: "Grammar fixes", value: usage.grammar, icon: Highlighter },
      { label: "Spelling corrected", value: usage.spelling, icon: SpellCheck },
      { label: "Tone rewrites", value: usage.improvement, icon: PenSquare },
      { label: "Transliteration used", value: usage.translation, icon: Sparkles },
    ]
  }, [wordCount, usage])

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex items-center justify-center">
        Loading your progress...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-[#0f2c21]">
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-[#0f2c21]">Progress</h1>
            <p className="text-[#42584a]">This week’s writing and AI wins.</p>
          </div>
          <Badge className="bg-[#0f7a5c] text-white">Week in review</Badge>
        </div>

        <Card className="border-[#dfe9dd] bg-gradient-to-br from-[#f1fff8] via-white to-[#f7faf7] shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <CardHeader className="space-y-2">
            <CardTitle className="text-xl text-[#0f2c21]">This week</CardTitle>
            <CardDescription className="text-[#42584a]">Highlights from your last 7 days in Thamly.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-[#0f2c21]">
            <div className="flex flex-wrap gap-3">
              <span className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-semibold border border-[#dfe9dd]">
                ✔ {wordCount} words written
              </span>
              <span className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-semibold border border-[#dfe9dd]">
                ✔ {usage.grammar} grammar fixes
              </span>
              <span className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-semibold border border-[#dfe9dd]">
                ✔ {usage.improvement} tone rewrites
              </span>
            </div>
            <div className="text-sm font-semibold text-emerald-700">
              🔥 You’re more fluent than 84% of users.
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {progressSummary.map((stat) => (
            <Card key={stat.label} className="border-[#dfe9dd] bg-white shadow-sm">
              <CardHeader className="flex items-center justify-between">
                <CardTitle className="text-sm text-[#0f2c21]">{stat.label}</CardTitle>
                <stat.icon className="h-4 w-4 text-[#0f7a5c]" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-[#0f2c21]">{stat.value}</div>
                <p className="text-xs text-[#42584a]">Last 7 days</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
