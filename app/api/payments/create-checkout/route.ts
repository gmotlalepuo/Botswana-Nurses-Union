import { NextResponse } from "next/server"
import { randomUUID } from "node:crypto"
import { checkoutItems } from "@/lib/bonu-data"
import { completeMerchandiseOrder } from "@/lib/merchandise-orders"
import { discountedPrice, seededMerchandiseProducts } from "@/lib/merchandise-data"
import { requireMemberRequest } from "@/lib/member-auth"
import { isMemberProfileComplete, type MemberProfile } from "@/lib/member-data"
import { createAdminClient } from "@/lib/supabase/admin"
import { stripe } from "@/lib/stripe"

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? ""
  const body = contentType.includes("application/json")
    ? await request.json().catch(() => ({}))
    : Object.fromEntries((await request.formData()).entries())
  const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  if (body.checkoutType === "merchandise") {
    const { user, response } = await requireMemberRequest(request)
    if (response || !user) return response
    return createMerchandiseCheckout(body, origin, contentType, user.id)
  }

  const { itemId = "membership", memberId = "guest" } = body
  if (itemId === "membership") {
    return contentType.includes("application/json")
      ? NextResponse.json({ error: "Use the membership page to create a monthly payment." }, { status: 400 })
      : NextResponse.redirect(`${origin}/portal/membership`, 303)
  }
  const item = checkoutItems.find((entry) => entry.id === itemId) ?? checkoutItems[0]

  if (!process.env.STRIPE_SECRET_KEY) {
    const demoUrl = `${origin}/portal?notice=payment-demo&item=${item.id}`
    return contentType.includes("application/json")
      ? NextResponse.json({
          mode: "demo",
          checkoutUrl: demoUrl,
          message: "Add STRIPE_SECRET_KEY to enable live Stripe Checkout sessions.",
        })
      : NextResponse.redirect(demoUrl, 303)
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${origin}/portal?success=payment-success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/portal?error=payment-cancelled`,
    client_reference_id: String(memberId),
    metadata: {
      memberId: String(memberId),
      itemId: item.id,
      platform: "bonu-member-services",
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "bwp",
          unit_amount: item.amount,
          product_data: {
            name: item.name,
          },
        },
      },
    ],
  })

  if (!contentType.includes("application/json") && session.url) {
    return NextResponse.redirect(session.url, 303)
  }

  return NextResponse.json({ checkoutUrl: session.url })
}

type CartItem = {
  productId: string
  quantity: number
  color?: string
}

async function createMerchandiseCheckout(body: Record<string, unknown>, origin: string, contentType: string, userId: string) {
  const memberId = String(body.memberId ?? "")
  const deliveryMethod = String(body.deliveryMethod ?? "delivery")
  const paymentOption = String(body.paymentOption ?? "stripe")
  const monthlyDeduction = Number(body.monthlyDeduction ?? 0)
  const deliveryAddress = String(body.deliveryAddress ?? "").trim()
  const collectionPoint = String(body.collectionPoint ?? "").trim()
  const cart = parseCart(body.cart)

  if (!memberId || cart.length === 0 || (deliveryMethod === "delivery" && !deliveryAddress) || (paymentOption === "credit" && (!Number.isFinite(monthlyDeduction) || monthlyDeduction <= 0))) {
    return NextResponse.redirect(`${origin}/portal/merchandise?error=missing`, 303)
  }

  const admin = createAdminClient()
  const { data: member } = await admin
    .from("members")
    .select("*")
    .eq("id", memberId)
    .eq("user_id", userId)
    .maybeSingle()

  if (!member) {
    return NextResponse.redirect(`${origin}/portal/profile?error=profile-required`, 303)
  }

  const accessProfile = {
    ...member,
    council: member.council ?? member.region ?? null,
  } as MemberProfile
  if (!isMemberProfileComplete(accessProfile)) {
    return NextResponse.redirect(`${origin}/portal/profile?error=profile-required`, 303)
  }

  if (member.status !== "active") {
    return NextResponse.redirect(`${origin}/portal/membership?error=membership-active-required`, 303)
  }

  const productIds = Array.from(new Set(cart.map((item) => item.productId)))
  const { data: products, error } = await admin
    .from("merchandise_products")
    .select("*")
    .in("id", productIds)
    .eq("is_active", true)

  if (error) {
    console.error("Merchandise products lookup failed", error)
    return NextResponse.redirect(`${origin}/portal/merchandise?error=application-submit`, 303)
  }

  if (!products || products.length === 0) {
    await ensureSeededProducts(admin)
  }

  const { data: refreshedProducts } = await admin
    .from("merchandise_products")
    .select("*")
    .in("id", productIds)
    .eq("is_active", true)

  const productRows = refreshedProducts && refreshedProducts.length > 0 ? refreshedProducts : seededMerchandiseProducts.filter((product) => productIds.includes(product.id))
  if (productRows.length === 0) {
    return NextResponse.redirect(`${origin}/portal/merchandise?error=missing`, 303)
  }

  const productById = new Map(productRows.map((product) => [String(product.id), product]))
  const orderItems = cart.map((cartItem) => {
    const product = productById.get(cartItem.productId)

    if (!product || cartItem.quantity < 1 || Number(product.stock_count) < cartItem.quantity) {
      return null
    }

    const unitAmount = discountedPrice(product)
    return {
      product,
      product_id: product.id,
      product_name: product.name,
      color: cartItem.color ?? null,
      quantity: cartItem.quantity,
      unit_amount: unitAmount,
      discount_percent: Number(product.discount_percent ?? 0),
      line_total: unitAmount * cartItem.quantity,
      image_url: product.image_url,
    }
  })

  if (orderItems.some((item) => item === null)) {
    return NextResponse.redirect(`${origin}/portal/merchandise?error=subscription-amount`, 303)
  }

  const validItems = orderItems.filter(Boolean) as Array<NonNullable<(typeof orderItems)[number]>>
  const total = validItems.reduce((sum, item) => sum + item.line_total, 0)
  const orderNumber = `BONU-${randomUUID().slice(0, 8).toUpperCase()}`

  const { data: order, error: orderError } = await admin
    .from("merchandise_orders")
    .insert({
      order_number: orderNumber,
      member_id: memberId,
      payment_option: paymentOption === "credit" ? "credit" : "cash",
      status: paymentOption === "credit" ? "credit_active" : "pending_payment",
      payment_status: paymentOption === "credit" ? "credit_active" : "pending",
      delivery_method: deliveryMethod,
      delivery_address: deliveryMethod === "delivery" ? deliveryAddress : null,
      collection_point: deliveryMethod === "collection" ? collectionPoint : null,
      subtotal_amount: total,
      total_amount: total,
      amount_paid: 0,
      balance_remaining: paymentOption === "credit" ? total : total,
      monthly_deduction: paymentOption === "credit" ? monthlyDeduction : null,
      metadata: {
        source: "member-shop",
      },
    })
    .select("id")
    .single()

  if (orderError || !order) {
    return NextResponse.redirect(`${origin}/portal/merchandise?error=application-submit`, 303)
  }

  const { error: itemsError } = await admin.from("merchandise_order_items").insert(
    validItems.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      color: item.color,
      quantity: item.quantity,
      unit_amount: item.unit_amount,
      discount_percent: item.discount_percent,
      line_total: item.line_total,
      image_url: item.image_url,
    })),
  )

  if (itemsError) {
    return NextResponse.redirect(`${origin}/portal/merchandise?error=application-submit`, 303)
  }

  if (paymentOption === "credit") {
    await deductMerchandiseStock(admin, validItems)
    const { data: application } = await admin
      .from("service_applications")
      .insert({
        member_id: memberId,
        application_type: "merchandise",
        status: "approved",
        requested_amount: total,
        monthly_deduction: monthlyDeduction,
        details: {
          orderId: order.id,
          orderNumber,
          paymentOption: "credit",
          balanceRemaining: total,
        },
      })
      .select("id")
      .single()

    await admin.from("payment_transactions").insert({
      member_id: memberId,
      application_id: application?.id ?? null,
      description: `Credit merchandise order ${orderNumber}`,
      amount: total,
      currency: "BWP",
      status: "pending",
      metadata: {
        orderId: order.id,
        monthlyDeduction,
        balanceRemaining: total,
      },
    })

    await admin.from("notifications").insert({
      member_id: memberId,
      title: "Credit order created",
      message: `Merchandise order ${orderNumber} was created on credit. Monthly deduction: P ${monthlyDeduction.toFixed(2)}. Balance left: P ${total.toFixed(2)}.`,
      channel: "in_app",
    })

    return NextResponse.redirect(`${origin}/portal/merchandise?success=credit-order-created`, 303)
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    await completeMerchandiseOrder(order.id, "", "")
    return NextResponse.redirect(`${origin}/portal/merchandise?success=payment-success&order=${order.id}`, 303)
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${origin}/api/payments/complete?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/portal/merchandise?error=payment-cancelled`,
    client_reference_id: memberId,
    metadata: {
      memberId,
      orderId: order.id,
      checkoutType: "merchandise",
      platform: "bonu-member-services",
    },
    line_items: validItems.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: "bwp",
        unit_amount: Math.round(item.unit_amount * 100),
        product_data: {
          name: item.product_name,
        },
      },
    })),
  })

  await admin.from("merchandise_orders").update({ stripe_session_id: session.id }).eq("id", order.id)

  if (!contentType.includes("application/json") && session.url) {
    return NextResponse.redirect(session.url, 303)
  }

  return NextResponse.json({ checkoutUrl: session.url })
}

async function ensureSeededProducts(admin: ReturnType<typeof createAdminClient>) {
  await admin.from("merchandise_products").upsert(
    seededMerchandiseProducts.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      stock_count: product.stock_count,
      discount_percent: product.discount_percent,
      colors: product.colors,
      image_url: product.image_url,
      is_active: true,
    })),
    { onConflict: "id", ignoreDuplicates: true },
  )
}

async function deductMerchandiseStock(
  admin: ReturnType<typeof createAdminClient>,
  items: Array<{ product_id: string; quantity: number }>,
) {
  for (const item of items) {
    const { data: product } = await admin
      .from("merchandise_products")
      .select("stock_count")
      .eq("id", item.product_id)
      .maybeSingle()

    if (!product) {
      continue
    }

    const nextStock = Math.max(0, Number(product.stock_count ?? 0) - Number(item.quantity ?? 0))
    await admin.from("merchandise_products").update({ stock_count: nextStock, updated_at: new Date().toISOString() }).eq("id", item.product_id)
  }
}

function parseCart(value: unknown): CartItem[] {
  if (typeof value !== "string") {
    return []
  }

  try {
    const parsed = JSON.parse(value) as CartItem[]
    return Array.isArray(parsed)
      ? parsed.map((item) => ({
          productId: String(item.productId ?? ""),
          quantity: Math.max(1, Math.floor(Number(item.quantity ?? 1))),
          color: item.color ? String(item.color) : undefined,
        })).filter((item) => item.productId)
      : []
  } catch {
    return []
  }
}
