import { NextResponse } from "next/server"
import { requireMemberRequest } from "@/lib/member-auth"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  try {
    const { user, response } = await requireMemberRequest(request)

    if (response) {
      return response
    }

    const formData = await request.formData()
    const orderId = String(formData.get("orderId") ?? "")

    if (!orderId) {
      return NextResponse.redirect(new URL("/portal/merchandise?error=missing", request.url), 303)
    }

    const admin = createAdminClient()
    const { data: order, error: orderError } = await admin
      .from("merchandise_orders")
      .select("id, delivery_method, members(user_id)")
      .eq("id", orderId)
      .maybeSingle()

    if (orderError || !order) {
      return NextResponse.redirect(new URL("/portal/merchandise?error=missing", request.url), 303)
    }

    const memberRecord = Array.isArray(order.members) ? order.members[0] : order.members

    if (memberRecord?.user_id !== user?.id) {
      return NextResponse.redirect(new URL("/portal/merchandise?error=member-required", request.url), 303)
    }

    const fulfilmentStatus = order.delivery_method === "delivery" ? "delivered" : "collected"
    const { error } = await admin
      .from("merchandise_orders")
      .update({
        status: "completed",
        fulfilment_status: fulfilmentStatus,
        customer_signed_off_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)

    if (error) {
      return NextResponse.redirect(new URL("/portal/merchandise?error=application-update", request.url), 303)
    }

    return NextResponse.redirect(new URL("/portal/merchandise?success=order-signed-off", request.url), 303)
  } catch (error) {
    console.error("Merchandise order sign-off failed", error)
    return NextResponse.redirect(new URL("/portal/merchandise?error=not-configured", request.url), 303)
  }
}
