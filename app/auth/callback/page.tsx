"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleAuth = async () => {
      const supabase = createClient()
      const code = searchParams.get("code")
      const nextParam = searchParams.get("next") || "/drafts"

      // Exchange the code for a session if present
      if (code) {
        await supabase.auth.exchangeCodeForSession(code)
      }

      const { data: sessionData } = await supabase.auth.getSession()
      if (sessionData.session) {
        try {
          const { data: userData } = await supabase.auth.getUser()
          const user = userData.user
          const meta = (user?.user_metadata as any) || {}
          // Best-effort welcome email for OAuth users
          if (user?.email && !meta.welcome_v1_sent) {
            // fire-and-forget welcome email
            fetch("/api/email/welcome", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: user.email, name: meta.full_name }),
            }).catch(() => {})
            await supabase.auth.updateUser({
              data: { ...meta, welcome_v1_sent: true },
            })
          }
          // Best-effort trial start for new OAuth users
          fetch("/api/trial/start", { method: "POST" }).catch(() => {})
        } catch (err) {
          console.error("Welcome email after OAuth failed", err)
        }
        router.replace(nextParam)
      } else {
        router.replace("/auth/login")
      }
    }

    handleAuth()
  }, [router, searchParams])

  return <p className="p-6 text-sm text-slate-700">Signing you in…</p>
}
