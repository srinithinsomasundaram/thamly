"use client"

import { useState, Suspense } from "react"
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

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const lockedEmail = searchParams.get("email") || ""
  const redirectTo = searchParams.get("redirectTo") || "/drafts"
  const [email, setEmail] = useState(lockedEmail)
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    router.replace(redirectTo || "/drafts")
    router.refresh()
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
                <Link href={`/auth/sign-up?redirectTo=${encodeURIComponent(redirectTo)}`}>Sign up</Link>
              </Button>
            </div>
          </div>
        </header>

        <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl flex-col items-center justify-center px-4 py-12 sm:px-8">
          <Card className="w-full max-w-md border-[#cdeae8] bg-gradient-to-br from-[#eefaf8] via-white to-[#d8efeb] shadow-xl shadow-teal-100/60">
            <CardHeader className="space-y-3 pb-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl text-slate-900">Sign in</CardTitle>
                <span className="rounded-full bg-[#e5f7f5] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[#0f777c]">
                  Secure access
                </span>
              </div>
              <CardDescription className="text-slate-600">
                Rejoin your drafts and keep Tamil AI checks flowing. No card needed for trial users.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form className="space-y-4" onSubmit={handleSubmit}>
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
                      This invite is restricted to {lockedEmail}. Sign in with this email to continue.
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

                <Button
                  type="submit"
                  className="w-full border border-[#0f777c]/20 bg-[#0f777c] text-white hover:bg-[#0d6a6f]"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>

              <div className="flex justify-between text-sm text-slate-600">
                <Link href="/auth/forgot-password" className="hover:text-slate-900">
                  Forgot password?
                </Link>
                <Link
                  href={`/auth/sign-up?redirectTo=${encodeURIComponent(redirectTo)}`}
                  className="font-medium text-[#0f777c] hover:text-[#0d6a6f]"
                >
                  Create an account
                </Link>
              </div>

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
