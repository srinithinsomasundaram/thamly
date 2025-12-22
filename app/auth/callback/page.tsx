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

      const { data } = await supabase.auth.getSession()
      if (data.session) {
        router.replace(nextParam)
      } else {
        router.replace("/auth/login")
      }
    }

    handleAuth()
  }, [router, searchParams])

  return <p className="p-6 text-sm text-slate-700">Signing you in…</p>
}
