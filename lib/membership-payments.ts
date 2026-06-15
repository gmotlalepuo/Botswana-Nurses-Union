import { createAdminClient } from "@/lib/supabase/admin"

export type MonthlyPaymentBreakdown = {
  applicationId: string
  service: string
  amount: number
}

export const MEMBERSHIP_SALARY_RATE = 0.05

export function paymentMonthStart(value = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Gaborone",
    year: "numeric",
    month: "2-digit",
  })
  const parts = Object.fromEntries(formatter.formatToParts(value).map((part) => [part.type, part.value]))
  return `${parts.year}-${parts.month}-01`
}

export function previousPaymentMonth(value = new Date()) {
  const current = paymentMonthStart(value)
  const [year, month] = current.split("-").map(Number)
  return paymentMonthStart(new Date(Date.UTC(year, month - 2, 15)))
}

export function normalizePaymentMonth(value: string) {
  const match = value.trim().match(/^(\d{4})-(\d{1,2})(?:-\d{1,2})?$/)
  if (!match) return null
  const month = Number(match[2])
  if (month < 1 || month > 12) return null
  return `${match[1]}-${String(month).padStart(2, "0")}-01`
}

export async function getMembershipMonthlyCharge(
  admin: ReturnType<typeof createAdminClient>,
  memberId: string,
) {
  const { data: member, error } = await admin
    .from("members")
    .select("monthly_salary")
    .eq("id", memberId)
    .maybeSingle()

  if (error) throw error

  const salary = Number(member?.monthly_salary ?? 0)
  const total = salary > 0 ? Math.round(salary * MEMBERSHIP_SALARY_RATE * 100) / 100 : 0
  const breakdown: MonthlyPaymentBreakdown[] = total > 0
    ? [{ applicationId: "membership", service: "membership_fee", amount: total }]
    : []

  return { salary, rate: MEMBERSHIP_SALARY_RATE, total, breakdown }
}

export async function hasApprovedMembershipOnboarding(
  admin: ReturnType<typeof createAdminClient>,
  memberId: string,
) {
  const { data, error } = await admin
    .from("service_applications")
    .select("id")
    .eq("member_id", memberId)
    .eq("application_type", "membership")
    .in("status", ["approved", "fulfilled"])
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return Boolean(data)
}

export async function findMonthlyPayment(
  admin: ReturnType<typeof createAdminClient>,
  memberId: string,
  paymentMonth: string,
) {
  const { data, error } = await admin
    .from("payment_transactions")
    .select("*")
    .eq("member_id", memberId)
    .eq("payment_kind", "membership_monthly")
    .eq("payment_month", paymentMonth)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function getMemberPaymentTargetMonth(
  admin: ReturnType<typeof createAdminClient>,
  member: { id: string; status: string },
) {
  if (member.status !== "active" && member.status !== "suspended") {
    return paymentMonthStart()
  }

  const currentMonth = paymentMonthStart()
  const currentPayment = await findMonthlyPayment(admin, member.id, currentMonth)
  if (currentPayment?.status === "paid") {
    return currentMonth
  }

  const previousMonth = previousPaymentMonth()
  const previousPayment = await findMonthlyPayment(admin, member.id, previousMonth)
  return previousPayment?.status === "paid" ? currentMonth : previousMonth
}

export async function completeMonthlyPayment({
  admin,
  memberId,
  paymentMonth,
  amount,
  expectedAmount,
  source,
  paidAt,
  breakdown,
  stripeSessionId,
  stripePaymentIntentId,
  importBatchId,
  metadata = {},
}: {
  admin: ReturnType<typeof createAdminClient>
  memberId: string
  paymentMonth: string
  amount: number
  expectedAmount: number
  source: "stripe" | "csr_import"
  paidAt: string
  breakdown: MonthlyPaymentBreakdown[]
  stripeSessionId?: string | null
  stripePaymentIntentId?: string | null
  importBatchId?: string | null
  metadata?: Record<string, unknown>
}) {
  const { data: member, error: memberError } = await admin
    .from("members")
    .select("status")
    .eq("id", memberId)
    .maybeSingle()
  if (memberError) throw memberError

  if (!["active", "suspended"].includes(member?.status ?? "")) {
    const onboardingApproved = await hasApprovedMembershipOnboarding(admin, memberId)
    if (!onboardingApproved) {
      throw new Error("membership-onboarding-approval-required")
    }
  }

  const existing = await findMonthlyPayment(admin, memberId, paymentMonth)

  if (existing?.status === "paid") {
    return { status: "duplicate" as const, payment: existing }
  }

  const payload = {
    member_id: memberId,
    description: `BONU membership fee for ${paymentMonth.slice(0, 7)}`,
    amount,
    expected_amount: expectedAmount,
    currency: "BWP",
    status: "paid",
    paid_at: paidAt,
    payment_kind: "membership_monthly",
    payment_month: paymentMonth,
    payment_source: source,
    stripe_session_id: stripeSessionId ?? existing?.stripe_session_id ?? null,
    stripe_payment_intent_id: stripePaymentIntentId ?? existing?.stripe_payment_intent_id ?? null,
    import_batch_id: importBatchId ?? null,
    metadata: {
      ...metadata,
      breakdown,
      amountWarning: Math.abs(amount - expectedAmount) > 0.009,
    },
  }

  const result = existing
    ? await admin.from("payment_transactions").update(payload).eq("id", existing.id).select("*").single()
    : await admin.from("payment_transactions").insert(payload).select("*").single()

  if (result.error) {
    if (result.error.code === "23505") {
      return { status: "duplicate" as const, payment: await findMonthlyPayment(admin, memberId, paymentMonth) }
    }
    throw result.error
  }

  await admin.from("members").update({ status: "active", updated_at: new Date().toISOString() }).eq("id", memberId)
  await admin.from("notifications").insert({
    member_id: memberId,
    title: "Membership fee received",
    message: `Your BONU membership fee of P ${amount.toFixed(2)} for ${paymentMonth.slice(0, 7)} was received. Your membership is active.`,
    channel: "in_app",
  })

  return { status: "paid" as const, payment: result.data }
}

export async function completeStripeMonthlyPayment(
  admin: ReturnType<typeof createAdminClient>,
  session: {
    id: string
    payment_status: string
    amount_total: number | null
    payment_intent?: string | { id: string } | null
    metadata?: Record<string, string> | null
  },
) {
  const memberId = session.metadata?.memberId
  const paymentMonth = session.metadata?.paymentMonth

  if (!memberId || !paymentMonth || session.payment_status !== "paid") {
    return { status: "invalid" as const }
  }

  const charges = await getMembershipMonthlyCharge(admin, memberId)
  const amount = Number(session.amount_total ?? 0) / 100
  const paymentIntentId = typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.payment_intent?.id ?? null

  return completeMonthlyPayment({
    admin,
    memberId,
    paymentMonth,
    amount,
    expectedAmount: charges.total,
    source: "stripe",
    paidAt: new Date().toISOString(),
    breakdown: charges.breakdown,
    stripeSessionId: session.id,
    stripePaymentIntentId: paymentIntentId,
  })
}
