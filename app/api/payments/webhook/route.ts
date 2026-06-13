import { NextResponse } from "next/server"
import { completeMerchandiseOrder } from "@/lib/merchandise-orders"
import { createAdminClient } from "@/lib/supabase/admin"
import { stripe } from "@/lib/stripe"

export async function POST(request: Request) {
  const payload = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!process.env.STRIPE_WEBHOOK_SECRET || !signature) {
    return NextResponse.json({ received: true, mode: "demo" })
  }

  const event = stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET)

  if (event.type === "checkout.session.completed") {
    const session = event.data.object
    if (session.metadata?.checkoutType === "merchandise" && session.metadata.orderId) {
      await completeMerchandiseOrder(session.metadata.orderId, session.id, String(session.payment_intent ?? ""))
    } else if (session.metadata?.memberId) {
      const admin = createAdminClient()
      await admin.from("notifications").insert({
        member_id: session.metadata.memberId,
        title: "Payment successful",
        message: `Payment received for ${session.metadata.itemId ?? "BONU service"}.`,
        channel: "in_app",
      })
    }

    console.log("BONU payment completed", {
      id: session.id,
      memberId: session.client_reference_id,
      itemId: session.metadata?.itemId,
      amount: session.amount_total,
    })
  }

  return NextResponse.json({ received: true })
}
