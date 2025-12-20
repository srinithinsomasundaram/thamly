import Link from "next/link"
import Image from "next/image"

import { DeleteAccountButton } from "@/components/account/delete-account-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function AccountPageContent({ user, profile }: { user: any; profile: any }) {
  const plan = profile?.subscription_tier || "free"
  const planLower = plan.toLowerCase()
  const trialStart = profile?.trial_started_at ? new Date(profile.trial_started_at as any) : null
  const trialEnd = profile?.trial_ends_at ? new Date(profile.trial_ends_at as any) : null
  const now = new Date()
  const trialActive =
    (profile?.is_trial_active && trialEnd && now <= trialEnd) ||
    (profile?.trial_used && trialStart && trialEnd && now <= trialEnd && planLower !== "pro")
  const planLabel = trialActive ? "Trial Pro" : plan.charAt(0).toUpperCase() + plan.slice(1)
  const isPro = planLower !== "free" || trialActive
  const displayName = profile?.full_name || user?.email || "Account"
  const email = user?.email || ""
  const initial = displayName[0]?.toUpperCase() || "U"

  return (
    <div className="max-w-4xl space-y-6 bg-white">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-[#0f2c21]">Account</h1>
        <p className="text-[#42584a]">Profile and plan at a glance.</p>
      </div>

      <Card className="border-[#dfe9dd] bg-white shadow-[0_12px_36px_rgba(15,23,42,0.06)]">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14 overflow-hidden rounded-full border border-[#dfe9dd] bg-white">
              {profile?.avatar_url ? (
                <Image src={profile.avatar_url} alt="Profile" fill sizes="56px" className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#f7faf7] text-lg font-semibold text-[#0f7a5c]">
                  {initial}
                </div>
              )}
            </div>
            <div className="space-y-1">
              <CardTitle className="text-lg text-[#0f2c21]">{displayName}</CardTitle>
              <CardDescription className="text-[#42584a]">{email}</CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-[#0f7a5c] text-white">{planLabel}</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-[#0f2c21]">Email</Label>
            <Input value={email} disabled className="text-[#0f2c21] bg-[#f1f5f9] border-none focus-visible:ring-0" />
          </div>
          <div className="space-y-2">
            <Label className="text-[#0f2c21]">Full name</Label>
            <Input value={profile?.full_name || ""} disabled className="text-[#0f2c21] bg-[#f1f5f9] border-none focus-visible:ring-0" />
          </div>
          <div className="space-y-2">
            <Label className="text-[#0f2c21]">Plan</Label>
            <Input value={planLabel} disabled className="text-[#0f2c21] bg-[#f1f5f9] border-none focus-visible:ring-0" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#dfe9dd] bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-[#0f2c21]">Plan actions</CardTitle>
          <CardDescription className="text-[#42584a]">Upgrade or manage your subscription.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild className="bg-[#0f7a5c] text-white hover:bg-[#0c6148]">
            <Link href="/subscription">Manage subscription</Link>
          </Button>
          {!isPro && (
            <Button asChild className="bg-[#0f7a5c] text-white hover:bg-[#0c6148]">
              <Link href="/subscription/upgrade">Upgrade to Pro</Link>
            </Button>
          )}
        </CardContent>
      </Card>

      <Card className="border-red-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-red-700">Danger zone</CardTitle>
          <CardDescription className="text-red-600">
            Permanently delete your account, drafts, usage logs, and profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAccountButton />
        </CardContent>
      </Card>
    </div>
  )
}
