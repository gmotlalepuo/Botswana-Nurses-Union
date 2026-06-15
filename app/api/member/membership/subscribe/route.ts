import { NextResponse } from "next/server"
import { requireMemberRequest } from "@/lib/member-auth"
import {
  completeMonthlyPayment,
  findMonthlyPayment,
  getMembershipMonthlyCharge,
  getMemberPaymentTargetMonth,
  hasApprovedMembershipOnboarding,
} from "@/lib/membership-payments"
import { createAdminClient } from "@/lib/supabase/admin"
import { stripe } from "@/lib/stripe"

export async function POST(request: Request) {
  try {
    const { user, response } = await requireMemberRequest(request)
    if (response || !user) return response

    const admin = createAdminClient()
    const { data: member, error: memberError } = await admin
      .from("members")
      .select("id, full_name, email, status")
      .eq("user_id", user.id)
      .maybeSingle()

    if (memberError || !member) {
      return NextResponse.redirect(new URL("/portal/profile?error=profile-required", request.url), 303)
    }

    if (!["active", "suspended"].includes(member.status)) {
      const onboardingApproved = await hasApprovedMembershipOnboarding(admin, member.id)
      if (!onboardingApproved) {
        return NextResponse.redirect(new URL("/portal/membership?error=membership-onboarding-approval-required", request.url), 303)
      }
    }

    const paymentMonth = await getMemberPaymentTargetMonth(admin, member)
    const existingPayment = await findMonthlyPayment(admin, member.id, paymentMonth)
    if (existingPayment?.status === "paid") {
      return NextResponse.redirect(new URL("/portal/membership?error=membership-month-paid", request.url), 303)
    }

    const charges = await getMembershipMonthlyCharge(admin, member.id)
    if (charges.breakdown.length === 0 || charges.total <= 0) {
      return NextResponse.redirect(new URL("/portal/profile?error=membership-salary-required", request.url), 303)
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      await completeMonthlyPayment({
        admin,
        memberId: member.id,
        paymentMonth,
        amount: charges.total,
        expectedAmount: charges.total,
        source: "stripe",
        paidAt: new Date().toISOString(),
        breakdown: charges.breakdown,
        metadata: { mode: "demo" },
      })
      return NextResponse.redirect(new URL("/portal/membership?success=membership-payment-complete", request.url), 303)
    }

    if (existingPayment?.stripe_session_id) {
      const existingSession = await stripe.checkout.sessions.retrieve(existingPayment.stripe_session_id)
      if (existingSession.status === "open" && existingSession.url) {
        return NextResponse.redirect(existingSession.url, 303)
      }
    }

    const pendingPayload = {
      member_id: member.id,
      description: `BONU membership fee for ${paymentMonth.slice(0, 7)}`,
      amount: charges.total,
      expected_amount: charges.total,
      currency: "BWP",
      status: "pending",
      payment_kind: "membership_monthly",
      payment_month: paymentMonth,
      payment_source: "stripe",
      stripe_session_id: null,
      metadata: { breakdown: charges.breakdown },
    }

    let paymentId = existingPayment?.id
    if (existingPayment) {
      const { error } = await admin.from("payment_transactions").update(pendingPayload).eq("id", existingPayment.id)
      if (error) throw error
    } else {
      const { data: reservedPayment, error } = await admin.from("payment_transactions").insert(pendingPayload).select("id").single()
      if (error?.code === "23505") {
        return NextResponse.redirect(new URL("/portal/membership?error=membership-payment-in-progress", request.url), 303)
      }
      if (error || !reservedPayment) throw error ?? new Error("Could not reserve the monthly payment.")
      paymentId = reservedPayment.id
    }

    const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: member.email || user.email,
      success_url: `${origin}/api/payments/complete?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/portal/membership?error=payment-cancelled`,
      client_reference_id: member.id,
      metadata: {
        checkoutType: "membership_monthly",
        memberId: member.id,
        paymentMonth,
        expectedAmount: charges.total.toFixed(2),
        platform: "bonu-member-services",
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "bwp",
            unit_amount: Math.round(charges.total * 100),
            product_data: {
              name: `BONU membership fee - ${paymentMonth.slice(0, 7)}`,
              description: `5% of monthly salary: P ${charges.salary.toFixed(2)}`,
            },
          },
        },
      ],
    })

    const { error: sessionUpdateError } = await admin
      .from("payment_transactions")
      .update({ stripe_session_id: session.id })
      .eq("id", paymentId)
    if (sessionUpdateError) throw sessionUpdateError
    if (!session.url) throw new Error("Stripe did not return a checkout URL.")

    return NextResponse.redirect(session.url, 303)
  } catch (error) {
    console.error("Membership checkout creation failed", error)
    if (isMissingMembershipLedger(error)) {
      return NextResponse.redirect(new URL("/portal/membership?error=membership-migration-required", request.url), 303)
    }
    return NextResponse.redirect(new URL("/portal/membership?error=subscription-create", request.url), 303)
  }
}

function isMissingMembershipLedger(error: unknown) {
  if (!error || typeof error !== "object") return false
  const record = error as { code?: string; message?: string }
  return record.code === "42703" ||
    record.code === "42P01" ||
    String(record.message ?? "").includes("payment_kind") ||
    String(record.message ?? "").includes("payment_import_batches")
}
