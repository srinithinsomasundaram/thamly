import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createHmac } from "crypto"

function signInvoiceToken(payload: { invoice_id: string; user_id: string }) {
  const secret = process.env.SUPABASE_JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) return null
  const header = { alg: "HS256", typ: "JWT" }
  const encode = (obj: any) =>
    Buffer.from(JSON.stringify(obj))
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "")
  const encodedHeader = encode(header)
  const encodedPayload = encode(payload)
  const data = `${encodedHeader}.${encodedPayload}`
  const signature = createHmac("sha256", secret).update(data).digest("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
  return `${encodedHeader}.${encodedPayload}.${signature}`
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount = 100, currency = "INR" } = body
    const baseUrl = new URL(req.url).origin

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing Razorpay verification fields" }, { status: 400 })
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET
    if (!keySecret) {
      return NextResponse.json({ error: "Missing Razorpay secret" }, { status: 500 })
    }

    const expectedSignature = createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex")

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid Razorpay signature" }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const numericAmount = typeof amount === "number" ? amount : Number(amount) || 100

      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_tier, subscription_status, trial_started_at, trial_ends_at, is_trial_active, trial_used")
        .eq("id", user.id)
        .maybeSingle()

      const trialStart = profile?.trial_started_at ? new Date(profile.trial_started_at as any) : null
      const trialEnd = profile?.trial_ends_at ? new Date(profile.trial_ends_at as any) : null
      const now = new Date()
      const trialActive =
        profile?.is_trial_active === true && trialEnd && now <= trialEnd
          ? true
          : Boolean(profile?.trial_used && trialStart && trialEnd && now <= trialEnd && (profile?.subscription_tier || "") !== "pro")

      // If trial is active, schedule Pro to start when trial ends; keep trial tier/status
      if (trialActive && trialEnd) {
        await supabase
          .from("profiles")
          .update({
            subscription_tier: "trial",
            subscription_status: "active", // using active to satisfy constraint; UI will show "Pro scheduled"
            subscription_updated_at: trialEnd.toISOString(),
          })
          .eq("id", user.id)

        await supabase.from("payments").insert({
          user_id: user.id,
          plan_name: "Pro (scheduled)",
          amount: numericAmount,
          currency,
          status: "completed",
          payment_method: "razorpay",
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          receipt_id: razorpay_order_id,
          paid_at: new Date().toISOString(),
        } as any)

        const { data: invoiceRow } = await supabase
          .from("invoices")
          .insert({
            user_id: user.id,
            amount: numericAmount,
            currency,
            status: "scheduled",
            invoice_date: trialEnd.toISOString(),
            description: `Thamly Pro starts after trial ends (${trialEnd.toLocaleDateString()})`,
          } as any)
          .select("id")
          .single()

        if (invoiceRow?.id) {
          const token = signInvoiceToken({ invoice_id: invoiceRow.id, user_id: user.id })
          const downloadUrl = token
            ? `${baseUrl}/api/invoices/${invoiceRow.id}?token=${token}`
            : `${baseUrl}/api/invoices/${invoiceRow.id}`
          await supabase.from("invoices").update({ download_url: downloadUrl }).eq("id", invoiceRow.id)
          await supabase
            .from("payments")
            .update({ invoice_url: downloadUrl })
            .eq("razorpay_payment_id", razorpay_payment_id)
        }
      } else {
        await supabase
          .from("profiles")
          .update({ subscription_tier: "pro", subscription_status: "active", subscription_updated_at: new Date().toISOString() })
          .eq("id", user.id)

        await supabase.from("payments").insert({
          user_id: user.id,
          plan_name: "Pro",
          amount: numericAmount,
          currency,
          status: "completed",
          payment_method: "razorpay",
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          receipt_id: razorpay_order_id,
          paid_at: new Date().toISOString(),
        } as any)

        const { data: invoiceRow } = await supabase
          .from("invoices")
          .insert({
            user_id: user.id,
            amount: numericAmount,
            currency,
            status: "paid",
            invoice_date: new Date().toISOString(),
            description: "Thamly Pro subscription",
          } as any)
          .select("id")
          .single()

        if (invoiceRow?.id) {
          const token = signInvoiceToken({ invoice_id: invoiceRow.id, user_id: user.id })
          const downloadUrl = token
            ? `${baseUrl}/api/invoices/${invoiceRow.id}?token=${token}`
            : `${baseUrl}/api/invoices/${invoiceRow.id}`
          await supabase.from("invoices").update({ download_url: downloadUrl }).eq("id", invoiceRow.id)
          await supabase
            .from("payments")
            .update({ invoice_url: downloadUrl })
            .eq("razorpay_payment_id", razorpay_payment_id)
        }
      }

    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Razorpay] verify error", error)
    return NextResponse.json({ error: "Verification failed" }, { status: 500 })
  }
}
