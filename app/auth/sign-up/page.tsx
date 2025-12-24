"use client"

import { useEffect, useState, Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertCircle, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GoogleAuthButton } from "@/components/auth/google-auth-button"
import { useUserProfile } from "@/components/providers/user-provider"

export default function SignUpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const lockedEmail = searchParams.get("email") || ""
  const redirectTo = searchParams.get("redirectTo") || "/drafts"
  const [email, setEmail] = useState(lockedEmail)
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const { user, loading: userLoading } = useUserProfile()

  useEffect(() => {
    if (!userLoading && user) {
      router.replace(redirectTo)
    }
  }, [userLoading, user, router, redirectTo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    // Pre-check if email already exists
    try {
      const res = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (res.ok && data?.exists) {
        setError("That email is already registered. Please use a different email or sign in.")
        setLoading(false)
        return
      }
    } catch (err) {
      console.error("Email check failed", err)
      // allow flow to continue; sign-up will still validate
    }

    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })

    if (error) {
      const msg = (error.message || "").toLowerCase()
      if (
        error.status === 400 ||
        msg.includes("already registered") ||
        msg.includes("user already registered") ||
        msg.includes("already exists")
      ) {
        setError("That email is already registered. Please use a different email or sign in.")
      } else {
        setError(error.message)
      }
      setLoading(false)
      return
    }

    // For email/password signups, Supabase sends a confirmation link.
    // Show confirmation message instead of redirecting immediately.
    const recipient = data?.user?.email || email
    setSuccess(`A verification link has been sent to ${recipient}. Please verify and then sign in.`)

    // Best-effort welcome email (non-blocking)
    fetch("/api/email/welcome", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: recipient, name: fullName }),
    })
      .then(() =>
        supabase.auth.updateUser({
          data: { welcome_v1_sent: true, full_name: fullName },
        }),
      )
      .catch(() => {})

    setLoading(false)
  }

  if (!userLoading && user) {
    return null
  }

  return (
    <>
      <div className="min-h-screen bg-white text-slate-900">
        <header className="border-b border-[#e5f2ef] bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-8">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo1.png" alt="Thamly" width={36} height={36} className="rounded-xl" />
              <span className="text-lg font-semibold text-[#0f2c21]">Thamly</span>
            </Link>
            <div className="flex items-center gap-3 text-sm font-semibold text-[#0f2c21]">
              <Link href="/pricing" className="hidden sm:inline-flex hover:text-[#0c6148]">
                Pricing
              </Link>
              <Link href="/contact" className="hidden sm:inline-flex hover:text-[#0c6148]">
                Contact
              </Link>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-[#d3e9d7] bg-white text-[#0f2c21] hover:border-[#b8d8c7]"
                asChild
              >
                <Link href={`/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`}>Sign in</Link>
              </Button>
            </div>
          </div>
        </header>

        <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl flex-col items-center justify-center px-4 py-12 sm:px-8">
          <Card className="w-full max-w-md border-[#cdeae8] bg-gradient-to-br from-[#eefaf8] via-white to-[#d8efeb] shadow-xl shadow-teal-100/60">
            <CardHeader className="space-y-3 pb-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl text-slate-900">Create your account</CardTitle>
                <span className="rounded-full bg-[#e5f7f5] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[#0f777c]">
                  7-day trial
                </span>
              </div>
              <CardDescription className="text-slate-600">
                Start Thamly with Tamil-first AI. Trial is cardless; billing begins only after trial if you choose to pay.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-slate-800">
                    Full name
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Jana Thiru"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="border-[#b9e2de] bg-white text-slate-900 placeholder:text-slate-500 focus-visible:border-[#0f777c] focus-visible:ring-[#0f777c]/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-800">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={Boolean(lockedEmail)}
                    className="border-[#b9e2de] bg-white text-slate-900 placeholder:text-slate-500 focus-visible:border-[#0f777c] focus-visible:ring-[#0f777c]/30"
                  />
                  {lockedEmail && (
                    <p className="text-xs text-slate-600">
                      This invitation only allows {lockedEmail}. Create your account with this email to continue.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-800">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="border-[#b9e2de] bg-white text-slate-900 placeholder:text-slate-500 focus-visible:border-[#0f777c] focus-visible:ring-[#0f777c]/30"
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-md border border-red-400/40 bg-red-50 px-3 py-2 text-sm text-red-800">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}
                {success && (
                  <div className="flex items-start gap-2 rounded-md border border-emerald-400/40 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                    <AlertCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                    <p>{success}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full border border-[#0f777c]/20 bg-[#0f777c] text-white hover:bg-[#0d6a6f]"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Sign up"
                  )}
                </Button>
              </form>

              <p className="text-center text-sm text-slate-600">
                Already have an account?{" "}
                <Link
                  href={`/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`}
                  className="font-medium text-[#0f777c] hover:text-[#0d6a6f]"
                >
                  Sign in
                </Link>
              </p>

              <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-slate-400">
                <div className="h-px flex-1 bg-slate-200" />
                or
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <Suspense fallback={<div className="text-slate-600">Loading...</div>}>
                <GoogleAuthButton />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </div>
      <footer className="border-t border-[#e5f2ef] bg-white py-4 text-center text-sm text-slate-600">
        © 2025 Thamly. Tamil-first AI writing partner.
      </footer>
    </>
  )
}
