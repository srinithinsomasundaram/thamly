import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { Buffer } from "buffer"

const RAZORPAY_ORDER_URL = "https://api.razorpay.com/v1/orders"

export async function POST(req: Request) {
  try {
    const { amount } = await req.json().catch(() => ({}))
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET
    if (!keyId || !keySecret) {
      return NextResponse.json({ error: "Missing Razorpay configuration" }, { status: 500 })
    }

    const baseReceipt = `thamly-${user.id}-${Date.now()}`
    const trimmedReceipt = baseReceipt.length <= 40 ? baseReceipt : baseReceipt.slice(0, 40)

    const payload = new URLSearchParams({
      amount: ((amount ?? 100) as number).toString(),
      currency: "INR",
      receipt: trimmedReceipt,
      payment_capture: "1",
    })

    const response = await fetch(RAZORPAY_ORDER_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: payload,
    })

    const data = await response.json()
    if (!response.ok) {
      console.error("[Razorpay] order creation failed", data)
      return NextResponse.json({ error: data.error?.description || "Failed to create order" }, { status: response.status })
    }

    return NextResponse.json({
      id: data.id,
      amount: data.amount,
      currency: data.currency,
      receipt: data.receipt,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || keyId,
    })
  } catch (error) {
    console.error("[Razorpay] create checkout error", error)
    return NextResponse.json({ error: "Failed to create Razorpay order" }, { status: 500 })
  }
}
