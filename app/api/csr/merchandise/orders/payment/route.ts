import { NextResponse } from "next/server"
import { requireStaffRequest } from "@/lib/admin-auth"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  try {
    const { response } = await requireStaffRequest(request)

    if (response) {
      return response
    }

    const formData = await request.formData()
    const orderId = String(formData.get("orderId") ?? "")
    const paymentAmount = Number(formData.get("paymentAmount") ?? 0)
    const redirectTo = safeCsrRedirect(formData.get("redirectTo"))

    if (!orderId || !Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      return NextResponse.redirect(new URL(`${redirectTo}?error=missing`, request.url), 303)
    }

    const admin = createAdminClient()
    const { data: order, error: orderError } = await admin
      .from("merchandise_orders")
      .select("id, member_id, order_number, total_amount, amount_paid, balance_remaining")
      .eq("id", orderId)
      .maybeSingle()

    if (orderError || !order) {
      return NextResponse.redirect(new URL(`${redirectTo}?error=missing`, request.url), 303)
    }

    const nextPaid = Math.min(Number(order.total_amount ?? 0), Number(order.amount_paid ?? 0) + paymentAmount)
    const nextBalance = Math.max(0, Number(order.total_amount ?? 0) - nextPaid)
    const paidInFull = nextBalance === 0

    const { error } = await admin
      .from("merchandise_orders")
      .update({
        amount_paid: nextPaid,
        balance_remaining: nextBalance,
        payment_status: paidInFull ? "paid" : "credit_active",
        status: paidInFull ? "paid" : "credit_active",
        paid_at: paidInFull ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)

    if (error) {
      return NextResponse.redirect(new URL(`${redirectTo}?error=application-update`, request.url), 303)
    }

    await admin.from("payment_transactions").insert({
      member_id: order.member_id,
      description: `Merchandise credit payment ${order.order_number}`,
      amount: paymentAmount,
      currency: "BWP",
      status: "paid",
      paid_at: new Date().toISOString(),
      metadata: {
        orderId,
        balanceRemaining: nextBalance,
      },
    })

    await admin.from("notifications").insert({
      member_id: order.member_id,
      title: paidInFull ? "Credit order fully paid" : "Credit payment recorded",
      message: paidInFull
        ? `Merchandise order ${order.order_number} is now fully paid.`
        : `Payment of P ${paymentAmount.toFixed(2)} was recorded for merchandise order ${order.order_number}. Balance left: P ${nextBalance.toFixed(2)}.`,
      channel: "in_app",
    })

    return NextResponse.redirect(new URL(`${redirectTo}?success=order-payment-recorded`, request.url), 303)
  } catch (error) {
    console.error("Merchandise order payment failed", error)
    return NextResponse.redirect(new URL("/csr?error=not-configured#merchandise-orders", request.url), 303)
  }
}

function safeCsrRedirect(value: FormDataEntryValue | null) {
  const path = String(value ?? "/csr")
  return path.startsWith("/csr") ? path : "/csr"
}
