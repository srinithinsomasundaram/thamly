"use client"

import { useEffect, useState, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // If Supabase sent a ?code= parameter (PKCE flow), exchange it for a session.
    const code = searchParams.get("code")
    if (!code) return

    const supabase = createClient()
    supabase.auth.exchangeCodeForSession(code).catch((err) => {
      console.error("Failed to exchange reset code:", err)
      setError("The reset link is invalid or expired.")
    })
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setSuccess(true)
    setTimeout(() => router.push("/auth/login"), 1200)
  }

  return (
    <Card className="w-full max-w-md border-slate-800 bg-slate-900/70 shadow-2xl shadow-teal-900/30 backdrop-blur">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl text-white">Set a new password</CardTitle>
        <CardDescription className="text-slate-300">
          Use the link from your email to securely update your password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-100">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <p>Password updated. Redirecting to login...</p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Update password"
            )}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-slate-300">
          <Link href="/auth/login" className="hover:text-white">
            Back to login
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0f777c] via-slate-900 to-[#0f2c21] px-4 py-12 text-slate-100">
      <div className="w-full max-w-md">
        <div className="mb-4">
          <Button variant="ghost" className="text-sm text-slate-300 hover:text-white" asChild>
            <Link href="/">← Back</Link>
          </Button>
        </div>
        <Suspense fallback={<div className="flex items-center justify-center min-h-[74px]"><Loader2 className="h-8 w-8 animate-spin text-white" /></div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
