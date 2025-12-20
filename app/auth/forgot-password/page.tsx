"use client"

import { useState } from "react"
import Link from "next/link"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const supabase = createClient()
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    const redirectTo = `${origin}/auth/reset-password`

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setSent(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0f777c] via-slate-900 to-[#0f2c21] px-4 py-12 text-slate-100">
      <div className="w-full max-w-md">
        <div className="mb-4">
          <Button variant="ghost" className="text-sm text-slate-300 hover:text-white" asChild>
            <Link href="/">← Back</Link>
          </Button>
        </div>
        <Card className="border-slate-800 bg-slate-900/70 shadow-2xl shadow-teal-900/30 backdrop-blur">
          <CardHeader className="space-y-2">
          <CardTitle className="text-2xl text-white">Reset your password</CardTitle>
          <CardDescription className="text-slate-300">
            Get a secure link to choose a new password and get back to writing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-100">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {sent && !error && (
              <div className="flex items-start gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <p>Reset link sent. Check your inbox.</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending link...
                </>
              ) : (
                "Send reset link"
              )}
            </Button>
          </form>

          <div className="mt-4 flex justify-between text-sm text-slate-300">
            <Link href="/auth/login" className="hover:text-white">
              Back to login
            </Link>
            <Link href="/auth/sign-up" className="hover:text-white">
              Create an account
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
)
}
