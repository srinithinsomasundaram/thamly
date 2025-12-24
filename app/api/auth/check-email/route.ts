import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : ""
    if (!email) {
      return NextResponse.json({ exists: false, error: "Email is required" }, { status: 400 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ exists: false, error: "Supabase admin not configured" }, { status: 500 })
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .limit(1)

    if (error) {
      console.error("[check-email] error", error)
      return NextResponse.json({ exists: false, error: "Failed to check email" }, { status: 500 })
    }

    return NextResponse.json({ exists: (data || []).length > 0 })
  } catch (error) {
    console.error("[check-email] unexpected", error)
    return NextResponse.json({ exists: false, error: "Unexpected error" }, { status: 500 })
  }
}
