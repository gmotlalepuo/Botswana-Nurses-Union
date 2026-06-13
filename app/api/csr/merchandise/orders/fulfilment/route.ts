import { NextResponse } from "next/server"
import { requireStaffRequest } from "@/lib/admin-auth"
import { createAdminClient } from "@/lib/supabase/admin"

const fulfilmentStatuses = new Set(["pending", "processing", "ready_for_collection", "out_for_delivery", "delivered", "collected", "cancelled"])

export async function POST(request: Request) {
  try {
    const { response } = await requireStaffRequest(request)

    if (response) {
      return response
    }

    const formData = await request.formData()
    const orderId = String(formData.get("orderId") ?? "")
    const fulfilmentStatus = String(formData.get("fulfilmentStatus") ?? "")
    const redirectTo = safeCsrRedirect(formData.get("redirectTo"))

    if (!orderId || !fulfilmentStatuses.has(fulfilmentStatus)) {
      return NextResponse.redirect(new URL(`${redirectTo}?error=missing`, request.url), 303)
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from("merchandise_orders")
      .update({
        fulfilment_status: fulfilmentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select("order_number, member_id")
      .single()

    if (error) {
      return NextResponse.redirect(new URL(`${redirectTo}?error=application-update`, request.url), 303)
    }

    await admin.from("notifications").insert({
      member_id: data.member_id,
      title: "Order fulfilment updated",
      message: `Merchandise order ${data.order_number} is now ${fulfilmentStatus.replace(/_/g, " ")}.`,
      channel: "in_app",
    })

    return NextResponse.redirect(new URL(`${redirectTo}?success=order-updated`, request.url), 303)
  } catch {
    return NextResponse.redirect(new URL("/csr?error=not-configured#merchandise-orders", request.url), 303)
  }
}

function safeCsrRedirect(value: FormDataEntryValue | null) {
  const path = String(value ?? "/csr")
  return path.startsWith("/csr") ? path : "/csr"
}
