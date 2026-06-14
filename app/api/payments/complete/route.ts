import { NextResponse } from "next/server"
import { completeMerchandiseOrder } from "@/lib/merchandise-orders"
import { completeStripeMonthlyPayment } from "@/lib/membership-payments"
import { createAdminClient } from "@/lib/supabase/admin"
import { stripe } from "@/lib/stripe"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const sessionId = url.searchParams.get("session_id") ?? ""

  if (!sessionId) {
    return NextResponse.redirect(new URL("/portal/merchandise?error=missing", request.url), 303)
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.metadata?.checkoutType === "merchandise" && session.metadata.orderId && session.payment_status === "paid") {
      await completeMerchandiseOrder(session.metadata.orderId, session.id, String(session.payment_intent ?? ""))
      return NextResponse.redirect(new URL("/portal/merchandise?success=payment-success", request.url), 303)
    }

    if (session.metadata?.checkoutType === "membership_monthly" && session.payment_status === "paid") {
      const result = await completeStripeMonthlyPayment(createAdminClient(), session)
      const status = result.status === "duplicate" ? "membership-month-paid" : "membership-payment-complete"
      return NextResponse.redirect(new URL(`/portal/membership?success=${status}`, request.url), 303)
    }

    return NextResponse.redirect(new URL("/portal/membership?error=payment-cancelled", request.url), 303)
  } catch (error) {
    console.error("Stripe completion lookup failed", error)
    return NextResponse.redirect(new URL("/portal/merchandise?error=payment-cancelled", request.url), 303)
  }
}
