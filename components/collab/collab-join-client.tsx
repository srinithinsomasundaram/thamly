"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, ShieldAlert } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface CollabJoinProps {
  token: string
  inviteEmail: string
  draftId: string
  hasSession: boolean
  sessionEmail: string
  valid: boolean
  reason?: string
}

export function CollabJoinClient({
  token,
  inviteEmail,
  draftId,
  hasSession,
  sessionEmail,
  valid,
  reason,
}: CollabJoinProps) {
  const router = useRouter()
  const [status, setStatus] = useState<"idle" | "invalid" | "accepting" | "error" | "accepted">(
    valid ? "idle" : "invalid",
  )
  const [message, setMessage] = useState(reason || "")

  const acceptInvite = async () => {
    if (!token) return
    if (!draftId) {
      setStatus("error")
      setMessage("Invite is missing a draft target.")
      return
    }
    setStatus("accepting")
    try {
      const res = await fetch("/api/collab/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setStatus("error")
        setMessage(data?.error || "Failed to accept invite")
        return
      }
      setStatus("accepted")
      router.push(`/editor?id=${draftId}&collab=true`)
    } catch (err) {
      console.error("Accept invite failed", err)
      setStatus("error")
      setMessage("Unable to accept invite right now.")
    }
  }

  useEffect(() => {
    if (!valid || !token || !hasSession) return
    if (!sessionEmail || sessionEmail.toLowerCase() !== inviteEmail.toLowerCase()) return
    acceptInvite()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valid, token, hasSession, sessionEmail, inviteEmail, draftId])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()
  }

  const loginHref = `/auth/login?redirectTo=${encodeURIComponent(`/collab/join?token=${token}`)}&email=${encodeURIComponent(inviteEmail)}`
  const signupHref = `/auth/sign-up?redirectTo=${encodeURIComponent(`/collab/join?token=${token}`)}&email=${encodeURIComponent(inviteEmail)}`

  const showMismatch = hasSession && sessionEmail && sessionEmail.toLowerCase() !== inviteEmail.toLowerCase()

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <Card className="w-full max-w-xl border-slate-200 shadow-lg">
        <CardHeader>
          <CardTitle>Join collaboration</CardTitle>
          <CardDescription>
            Access to this draft is limited to <span className="font-semibold text-slate-900">{inviteEmail}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!valid && (
            <div className="flex items-start gap-3 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
              <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600" />
              <div>
                <p className="font-semibold">Invalid or expired link</p>
                <p className="text-rose-700">Ask the owner to resend the invitation.</p>
              </div>
            </div>
          )}

          {valid && !hasSession && (
            <div className="space-y-3">
              <p className="text-sm text-slate-700">
                Please sign in or create an account using <span className="font-semibold text-slate-900">{inviteEmail}</span> to
                join this draft.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href={loginHref}>
                  <Button>Sign in as {inviteEmail}</Button>
                </Link>
                <Link href={signupHref}>
                  <Button variant="outline">Create account</Button>
                </Link>
              </div>
            </div>
          )}

          {valid && showMismatch && (
            <div className="space-y-3">
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <p className="font-semibold">You are logged in as {sessionEmail}</p>
                <p>Please switch to {inviteEmail} to accept this invite.</p>
              </div>
              <Button variant="outline" onClick={handleSignOut}>
                Sign out and switch account
              </Button>
            </div>
          )}

          {valid && hasSession && !showMismatch && (
            <div className="space-y-3">
              <p className="text-sm text-slate-700">
                You are signed in as <span className="font-semibold text-slate-900">{sessionEmail}</span>. We&apos;ll attach your
                account to the draft.
              </p>
              <Button onClick={acceptInvite} disabled={status === "accepting"}>
                {status === "accepting" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Joining...
                  </>
                ) : (
                  "Accept invite"
                )}
              </Button>

              {status === "error" && (
                <p className="text-sm text-rose-700">
                  {message || "Something went wrong accepting the invite. Try again."}
                </p>
              )}
            </div>
          )}

          {status === "accepted" && (
            <p className="text-sm text-emerald-700">Redirecting you to the editor...</p>
          )}

          {status === "invalid" && valid === false && message && (
            <p className="text-sm text-rose-700">{message}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
