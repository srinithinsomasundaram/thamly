"use server"

import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { sendEmail, isSmtpConfigured } from "@/lib/email/send-email"

type ProfileRow = {
  id: string
  email: string | null
  full_name: string | null
  trial_started_at?: string | null
  trial_ends_at?: string | null
}

const DAY_MS = 24 * 60 * 60 * 1000

function daysSince(dateIso?: string | null) {
  if (!dateIso) return null
  const d = new Date(dateIso)
  if (Number.isNaN(d.getTime())) return null
  const diff = Date.now() - d.getTime()
  return Math.floor(diff / DAY_MS)
}

async function fetchWeekUsage(userId: string) {
  if (!supabaseAdmin) return { words: 0, checks: 0 }
  const sevenDaysAgo = new Date(Date.now() - 7 * DAY_MS).toISOString()
  const { data: drafts } = await supabaseAdmin
    .from("drafts")
    .select("content, updated_at")
    .eq("user_id", userId)
    .gte("updated_at", sevenDaysAgo)

  const words = (drafts || []).reduce((acc, d: any) => {
    const text = (d?.content || "") as string
    const count = text.split(/\s+/).filter(Boolean).length
    return acc + count
  }, 0)

  const { data: logs } = await supabaseAdmin
    .from("usage_logs")
    .select("id")
    .eq("user_id", userId)
    .gte("created_at", sevenDaysAgo)

  return { words, checks: logs?.length || 0 }
}

function buildEmail(day: number, name: string, editorUrl: string, usage: { words: number; checks: number }) {
  const safeName = name || "there"
  const lines: { subject: string; text: string } = { subject: "", text: "" }

  if (day === 0) {
    lines.subject = "Welcome to Thamly — start writing"
    lines.text = `Hi ${safeName},\n\nJump back into the editor: ${editorUrl}\nType in English/Tanglish, I’ll handle Tamil.\n\nHappy writing,\nThamly`
  } else if (day === 2) {
    lines.subject = "Try News & Tone modes in Thamly"
    lines.text = `Hi ${safeName},\n\nHighlight: News Mode for factual Tamil and Tone tweaks. Open the editor: ${editorUrl}\n\nKeep going,\nThamly`
  } else if (day === 4) {
    lines.subject = "Your progress so far"
    lines.text = `Hi ${safeName},\n\nYou’ve written ${usage.words || 0} words and made ${usage.checks || 0} AI checks this week.\nDon’t slow down now — open the editor: ${editorUrl}\n\nThamly`
  } else if (day === 6) {
    lines.subject = "Trial ending soon"
    lines.text = `Hi ${safeName},\n\nYour trial ends soon. You’ve written ${usage.words || 0} words. Keep unlimited corrections with Pro.\nOpen: ${editorUrl}\n\nThamly`
  } else if (day >= 7) {
    lines.subject = "Trial ended — keep writing without limits"
    lines.text = `Hi ${safeName},\n\nYour trial ended today. You’ve written ${usage.words || 0} words. Unlock full Pro to stay unlimited.\nOpen: ${editorUrl}\n\nThamly`
  }

  return lines
}

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ ok: false, error: "Supabase admin not configured" }, { status: 500 })
    }
    if (!isSmtpConfigured()) {
      return NextResponse.json({ ok: false, error: "SMTP not configured" }, { status: 500 })
    }

    const editorUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
      process.env.VERCEL_PROJECT_PRODUCTION_URL?.replace(/\/$/, "") ||
      "https://thamly.app"

    // Fetch users + profiles (limited batch)
    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("id,email,full_name,trial_started_at,trial_ends_at")
      .limit(200)

    if (error) {
      console.error("Engagement cron profiles error", error)
      return NextResponse.json({ ok: false, error: "Failed to read profiles" }, { status: 500 })
    }

    for (const profile of profiles as ProfileRow[]) {
      const email = profile.email
      if (!email) continue

      const day = daysSince(profile.trial_started_at)
      if (day === null) continue
      if (day > 7) continue

      // Load auth metadata to prevent duplicates
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(profile.id)
      const meta = (authUser?.user?.user_metadata as any) || {}
      const sent = (meta.engagement_sent as Record<string, boolean>) || {}

      const shouldSend = (day === 0 && !sent.d0) || (day === 2 && !sent.d2) || (day === 4 && !sent.d4) || (day === 6 && !sent.d6) || (day >= 7 && !sent.d7)
      if (!shouldSend) continue

      const usage = await fetchWeekUsage(profile.id)
      const emailLines = buildEmail(day, profile.full_name || email, `${editorUrl}/editor`, usage)
      if (!emailLines.subject) continue

      try {
        await sendEmail({
          to: email,
          subject: emailLines.subject,
          text: emailLines.text,
          html: `<pre style="font-family:Inter,system-ui,sans-serif;line-height:1.5;white-space:pre-wrap">${emailLines.text}</pre>`,
        })

        // Mark as sent
        const updatedSent = {
          ...sent,
          ...(day === 0 ? { d0: true } : {}),
          ...(day === 2 ? { d2: true } : {}),
          ...(day === 4 ? { d4: true } : {}),
          ...(day === 6 ? { d6: true } : {}),
          ...(day >= 7 ? { d7: true } : {}),
        }
        await supabaseAdmin.auth.admin.updateUserById(profile.id, {
          user_metadata: {
            ...meta,
            engagement_sent: updatedSent,
          },
        })
      } catch (err) {
        console.error("Engagement email send failed", err)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Engagement cron error", error)
    return NextResponse.json({ ok: false, error: "Unexpected error" }, { status: 500 })
  }
}
