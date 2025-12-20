import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Force dynamic so build-time static rendering doesn't try to execute cookie-based logic.
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 })
    }

    const { data: invoices, error: invoicesError } = await supabase
      .from("invoices")
      .select("id, amount, status, invoice_date, download_url, currency, description")
      .eq("user_id", user.id)
      .order("invoice_date", { ascending: false })

    const { data: payments, error: paymentsError } = await supabase
      .from("payments")
      .select("id, amount, currency, status, payment_method, paid_at, plan_name, razorpay_order_id, receipt_id, invoice_url")
      .eq("user_id", user.id)
      .order("paid_at", { ascending: false })

    if (invoicesError || paymentsError) {
      return NextResponse.json(
        {
          ok: false,
          error: invoicesError?.message || paymentsError?.message || "Failed to load billing",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({ ok: true, invoices: invoices || [], payments: payments || [] })
  } catch (error) {
    console.error("Billing API error", error)
    return NextResponse.json(
      { ok: false, error: "Unexpected error", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
