import { createAdminClient } from "@/lib/supabase/admin"

export async function completeMerchandiseOrder(orderId: string, sessionId: string, paymentIntentId: string) {
  const admin = createAdminClient()
  const { data: order } = await admin
    .from("merchandise_orders")
    .select("id, member_id, order_number, total_amount, payment_status")
    .eq("id", orderId)
    .maybeSingle()

  if (!order || order.payment_status === "paid") {
    return
  }

  const { data: items } = await admin
    .from("merchandise_order_items")
    .select("product_id, product_name, quantity")
    .eq("order_id", orderId)

  for (const item of items ?? []) {
    if (!item.product_id) {
      continue
    }

    const { data: product } = await admin
      .from("merchandise_products")
      .select("stock_count")
      .eq("id", item.product_id)
      .maybeSingle()

    const nextStock = Math.max(0, Number(product?.stock_count ?? 0) - Number(item.quantity ?? 0))
    await admin.from("merchandise_products").update({ stock_count: nextStock, updated_at: new Date().toISOString() }).eq("id", item.product_id)
  }

  await admin
    .from("merchandise_orders")
    .update({
      status: "paid",
      payment_status: "paid",
      payment_option: "cash",
      amount_paid: order.total_amount,
      balance_remaining: 0,
      paid_at: new Date().toISOString(),
      stripe_session_id: sessionId || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)

  const productNames = (items ?? []).map((item) => item.product_name).join(", ")
  const { data: application } = await admin
    .from("service_applications")
    .insert({
      member_id: order.member_id,
      application_type: "merchandise",
      status: "fulfilled",
      requested_amount: order.total_amount,
      details: {
        orderId,
        orderNumber: order.order_number,
        paymentOption: "cash",
        products: productNames,
      },
    })
    .select("id")
    .single()

  await admin.from("payment_transactions").insert({
    member_id: order.member_id,
    application_id: application?.id ?? null,
    stripe_session_id: sessionId || null,
    stripe_payment_intent_id: paymentIntentId || null,
    description: `Merchandise order ${order.order_number}`,
    amount: order.total_amount,
    currency: "BWP",
    status: "paid",
    paid_at: new Date().toISOString(),
    metadata: {
      orderId,
      products: productNames,
    },
  })

  await admin.from("notifications").insert({
    member_id: order.member_id,
    title: "Payment successful",
    message: `Payment received for merchandise order ${order.order_number}. Merchandise order status is paid.`,
    channel: "in_app",
  })
}
