"use server"

import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import crypto from "crypto"

function formatAmount(amount: number, currency: string) {
  const formatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "INR",
    minimumFractionDigits: 2,
  })
  return formatter.format(amount / 100) // amounts stored in paise
}

function verifyToken(token: string, invoiceId: string) {
  try {
    const [h, p, s] = token.split(".")
    if (!h || !p || !s) throw new Error("Malformed token")
    const secret = process.env.SUPABASE_JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!secret) throw new Error("Missing signing secret")
    const data = `${h}.${p}`
    const expected = crypto.createHmac("sha256", secret).update(data).digest("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
    if (expected !== s) throw new Error("Bad signature")
    const payload = JSON.parse(Buffer.from(p.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"))
    if (payload?.invoice_id !== invoiceId || !payload?.user_id) throw new Error("Invalid payload")
    return payload.user_id as string
  } catch (err) {
    console.error("Invoice token verify failed", err)
    return null
  }
}

function escapePdf(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)")
}

function buildPdf(payload: {
  invoiceId: string
  invoiceDate: string
  billingPeriod: string
  dueDate: string
  status: string
  sellerName: string
  sellerEmail: string
  sellerSite: string
  customerName: string
  customerEmail: string
  userId: string
  planName: string
  amount: string
  orderId: string
  paymentId: string
  paymentMode: string
}) {
  // A very small hand-rolled PDF layout (no HTML) inspired by the provided sample.
  const commands = [
    "0.8 w 0.9 0.9 0.9 rg 0.9 0.9 0.9 RG 40 710 m 572 710 l S", // top rule
    "0.8 w 0.95 0.95 0.95 rg 0.95 0.95 0.95 RG 40 270 m 572 270 l S", // notes rule
    "BT /F1 22 Tf 40 750 Td (Invoice) Tj ET",
    `BT /F1 10 Tf 40 735 Td (Invoice Number) Tj ET`,
    `BT /F1 12 Tf 40 722 Td (#${escapePdf(payload.invoiceId)}) Tj ET`,
    `BT /F1 10 Tf 380 735 Td (Status) Tj ET`,
    `BT /F1 12 Tf 380 722 Td (${escapePdf(payload.status)}) Tj ET`,

    // Billed by
    "BT /F1 10 Tf 40 700 Td (Billed by:) Tj ET",
    `BT /F1 12 Tf 40 687 Td (${escapePdf(payload.sellerName)}) Tj ET`,
    `BT /F1 10 Tf 40 674 Td (${escapePdf(payload.sellerEmail)}) Tj ET`,
    `BT /F1 10 Tf 40 661 Td (${escapePdf(payload.sellerSite)}) Tj ET`,

    // Billed to
    "BT /F1 10 Tf 300 700 Td (Billed to:) Tj ET",
    `BT /F1 12 Tf 300 687 Td (${escapePdf(payload.customerName)}) Tj ET`,
    `BT /F1 10 Tf 300 674 Td (${escapePdf(payload.customerEmail)}) Tj ET`,
    `BT /F1 10 Tf 300 661 Td (User ID: ${escapePdf(payload.userId)}) Tj ET`,

    // Dates
    "BT /F1 10 Tf 40 640 Td (Date Issued) Tj ET",
    `BT /F1 12 Tf 40 627 Td (${escapePdf(payload.invoiceDate)}) Tj ET`,
    "BT /F1 10 Tf 300 640 Td (Due Date) Tj ET",
    `BT /F1 12 Tf 300 627 Td (${escapePdf(payload.dueDate)}) Tj ET`,
    "BT /F1 10 Tf 40 606 Td (Billing Period) Tj ET",
    `BT /F1 12 Tf 40 593 Td (${escapePdf(payload.billingPeriod)}) Tj ET`,

    // Table headers
    "0.8 w 0 0 0 RG 0 0 0 rg 40 570 m 572 570 l S",
    "BT /F1 11 Tf 40 582 Td (Item) Tj ET",
    "BT /F1 11 Tf 300 582 Td (Qty) Tj ET",
    "BT /F1 11 Tf 360 582 Td (Rate) Tj ET",
    "BT /F1 11 Tf 470 582 Td (Total) Tj ET",
    "0.5 w 0.8 0.8 0.8 RG 40 560 m 572 560 l S",

    // Single line item
    `BT /F1 12 Tf 40 546 Td (${escapePdf(payload.planName)}) Tj ET`,
    "BT /F1 12 Tf 300 546 Td (1) Tj ET",
    `BT /F1 12 Tf 360 546 Td (${escapePdf(payload.amount)}) Tj ET`,
    `BT /F1 12 Tf 470 546 Td (${escapePdf(payload.amount)}) Tj ET`,
    "0.5 w 0.9 0.9 0.9 RG 40 530 m 572 530 l S",

    // Totals (no tax lines as requested)
    "BT /F1 10 Tf 360 510 Td (Subtotal) Tj ET",
    `BT /F1 12 Tf 470 510 Td (${escapePdf(payload.amount)}) Tj ET`,
    "BT /F1 10 Tf 360 492 Td (Tax) Tj ET",
    "BT /F1 12 Tf 470 492 Td (₹0.00) Tj ET",
    "BT /F1 10 Tf 360 474 Td (Discount) Tj ET",
    "BT /F1 12 Tf 470 474 Td (₹0.00) Tj ET",
    "0.8 w 0 0 0 RG 40 460 m 572 460 l S",
    "BT /F1 12 Tf 360 444 Td (Total) Tj ET",
    `BT /F1 14 Tf 470 444 Td (${escapePdf(payload.amount)}) Tj ET`,

    // Payment info
    "BT /F1 10 Tf 40 420 Td (Payment Mode) Tj ET",
    `BT /F1 12 Tf 40 407 Td (${escapePdf(payload.paymentMode)}) Tj ET`,
    "BT /F1 10 Tf 40 390 Td (Razorpay Order ID) Tj ET",
    `BT /F1 12 Tf 40 377 Td (${escapePdf(payload.orderId)}) Tj ET`,
    "BT /F1 10 Tf 40 360 Td (Razorpay Payment ID) Tj ET",
    `BT /F1 12 Tf 40 347 Td (${escapePdf(payload.paymentId)}) Tj ET`,

    // Notes
    "BT /F1 10 Tf 40 320 Td (Notes) Tj ET",
    "BT /F1 10 Tf 40 306 Td (Thank you for choosing Thamly Pro. This invoice is system-generated and tax-free.) Tj ET",
  ]

  const encoder = new TextEncoder()
  const contentStream = commands.join("\n") + "\n"
  const contentLength = encoder.encode(contentStream).length

  const pdfParts = [
    "%PDF-1.4",
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj",
    `4 0 obj << /Length ${contentLength} >> stream`,
    contentStream + "endstream",
    "endobj",
    "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    "xref",
    "0 6",
    "0000000000 65535 f ",
    "0000000010 00000 n ",
    "0000000061 00000 n ",
    "0000000114 00000 n ",
    "0000000271 00000 n ",
    "0000000000 00000 n ",
    "trailer << /Size 6 /Root 1 0 R >>",
    "startxref",
    "0",
    "%%EOF",
  ]

  const pdf = pdfParts.join("\n")
  return encoder.encode(pdf)
}

type InvoiceRouteContext = { params: Promise<{ id: string }> }

export const GET: (req: NextRequest, context: InvoiceRouteContext) => Promise<Response> = async (req, context) => {
  try {
    const url = new URL(req.url)
    const { id: paramId } = await context.params
    const invoiceId = paramId || url.searchParams.get("id") || ""
    const token = url.searchParams.get("token")
    if (!invoiceId) {
      return NextResponse.json({ error: "Missing invoice id" }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const tokenUserId = token ? verifyToken(token, invoiceId) : null
    let authedUserId = user?.id || tokenUserId

    let invoice: any = null
    let profileRow: any = null
    let paymentRow: any = null

    const fetchInvoice = async (client: any, userIdFilter?: string) => {
      const query = client
        .from("invoices")
        .select("id,amount,currency,status,invoice_date,description,user_id")
        .eq("id", invoiceId)
      if (userIdFilter) query.eq("user_id", userIdFilter)
      return query.maybeSingle()
    }

    // Admin first (allows token access) but only when caller is identified
    if (supabaseAdmin && authedUserId) {
      const { data, error } = await fetchInvoice(supabaseAdmin)
      if (error) {
        console.error("Admin invoice fetch failed", error)
      } else if (data) {
        invoice = data
        if (authedUserId && invoice.user_id !== authedUserId) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        const { data: prof } = await supabaseAdmin.from("profiles").select("full_name,email,id").eq("id", invoice.user_id).maybeSingle()
        profileRow = prof
        const { data: pay } = await supabaseAdmin
          .from("payments")
          .select("plan_name,amount,currency,status,razorpay_order_id,razorpay_payment_id,payment_method,created_at")
          .eq("user_id", invoice.user_id)
          .order("created_at", { ascending: false })
          .limit(1)
        paymentRow = pay?.[0] || null
      }
    }

    // If admin not available or not found, fallback to authed session
    if (!invoice) {
      if (!authedUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      const { data, error } = await fetchInvoice(supabase, authedUserId)
      if (error || !data) return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
      invoice = data
      const { data: prof } = await supabase.from("profiles").select("full_name,email,id").eq("id", authedUserId).maybeSingle()
      profileRow = prof
      const { data: pay } = await supabase
        .from("payments")
        .select("plan_name,amount,currency,status,razorpay_order_id,razorpay_payment_id,payment_method,created_at")
        .eq("user_id", authedUserId)
        .order("created_at", { ascending: false })
        .limit(1)
      paymentRow = pay?.[0] || null
    }

    const billingStart = invoice.invoice_date ? new Date(invoice.invoice_date) : new Date()
    const billingEnd = new Date(billingStart)
    billingEnd.setDate(billingEnd.getDate() + 30)
    const dueDate = new Date(billingStart)
    dueDate.setDate(dueDate.getDate() + 7)

    const amountStr = formatAmount(invoice.amount, invoice.currency)
    const planName = paymentRow?.plan_name || "Thamly Pro Subscription"
    const orderId = paymentRow?.razorpay_order_id || "N/A"
    const paymentId = paymentRow?.razorpay_payment_id || "N/A"
    const paymentMode = paymentRow?.payment_method ? paymentRow.payment_method.toUpperCase() : "RAZORPAY"
    const status = (invoice.status || "").toUpperCase() || "PAID"
    const invoiceDateStr = billingStart.toLocaleDateString()
    const billingPeriod = `${billingStart.toLocaleDateString()} to ${billingEnd.toLocaleDateString()}`

    const pdf = buildPdf({
      invoiceId,
      invoiceDate: invoiceDateStr,
      billingPeriod,
      dueDate: dueDate.toLocaleDateString(),
      status,
      sellerName: "Thamly Technologies Private Limited",
      sellerEmail: "hello@thamly.in",
      sellerSite: "https://thamly.com",
      customerName: profileRow?.full_name || "Customer",
      customerEmail: profileRow?.email || "N/A",
      userId: profileRow?.id || invoice.user_id || "N/A",
      planName,
      amount: amountStr,
      orderId,
      paymentId,
      paymentMode,
    })

    return new Response(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${invoice.id}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Invoice download error", error)
    return NextResponse.json({ error: "Failed to generate invoice" }, { status: 500 })
  }
}
