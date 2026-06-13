import { createAdminClient } from "@/lib/supabase/admin"
import type { CasePulseItem } from "@/components/case-pulse"

export type MemberProfile = {
  id: string
  user_id: string | null
  membership_number: string | null
  full_name: string
  national_id: string | null
  date_of_birth: string | null
  gender: string | null
  marital_status: string | null
  occupation: string | null
  employer: string | null
  employee_number: string | null
  mobile_number: string
  alternative_contact_number: string | null
  email: string
  physical_address: string | null
  postal_address: string | null
  district: string | null
  region: string | null
  work_station: string | null
  department: string | null
  employment_date: string | null
  monthly_salary: number | null
  status: string
}

export type MemberApplication = {
  id: string
  application_type: string
  status: string
  requested_amount: number | null
  monthly_deduction: number | null
  term_months: number | null
  details: Record<string, unknown>
  submitted_at: string
  case_pulses?: CasePulseItem[]
}

export type MemberSubscription = {
  id: string
  service_name: string
  monthly_amount: number
  active: boolean
  started_on: string
}

export type MemberPayment = {
  id: string
  description: string
  amount: number
  currency: string
  status: string
  paid_at: string | null
  created_at: string
}

export type MemberMerchandiseOrderItem = {
  id: string
  product_name: string
  color: string | null
  quantity: number
  unit_amount: number
  discount_percent: number
  line_total: number
}

export type MemberMerchandiseOrder = {
  id: string
  order_number: string
  status: string
  payment_status: string
  payment_option: string
  delivery_method: string
  delivery_address: string | null
  collection_point: string | null
  total_amount: number
  amount_paid: number
  balance_remaining: number
  monthly_deduction: number | null
  fulfilment_status: string
  customer_signed_off_at: string | null
  paid_at: string | null
  created_at: string
  merchandise_order_items?: MemberMerchandiseOrderItem[]
}

export type MemberDocument = {
  id: string
  document_type: string
  file_path: string
  verified_at: string | null
  created_at: string
}

export type MonthlyDeductionLine = {
  id: string
  label: string
  amount: number
  source: string
  status: string
}

export type MemberPortalData = {
  profile: MemberProfile | null
  applications: MemberApplication[]
  subscriptions: MemberSubscription[]
  payments: MemberPayment[]
  merchandiseOrders: MemberMerchandiseOrder[]
  documents: MemberDocument[]
  monthlyLines: MonthlyDeductionLine[]
  monthlyTotal: number
  outstandingBalance: number
}

export async function getMemberPortalData(userId: string): Promise<MemberPortalData> {
  const supabase = createAdminClient()
  const { data: profile } = await supabase.from("members").select("*").eq("user_id", userId).maybeSingle()

  if (!profile) {
    return emptyPortalData()
  }

  const [applications, subscriptions, payments, documents, merchandiseOrders] = await Promise.all([
    supabase.from("service_applications").select("*").eq("member_id", profile.id).order("submitted_at", { ascending: false }),
    supabase.from("subscriptions").select("*").eq("member_id", profile.id).eq("active", true).order("started_on", { ascending: false }),
    supabase.from("payment_transactions").select("*").eq("member_id", profile.id).order("created_at", { ascending: false }).limit(100),
    supabase.from("member_documents").select("*").eq("member_id", profile.id).order("created_at", { ascending: false }),
    supabase.from("merchandise_orders").select("*, merchandise_order_items(*)").eq("member_id", profile.id).order("created_at", { ascending: false }).limit(100),
  ])

  const applicationRows = ((applications.data ?? []) as MemberApplication[])
  await attachCasePulses(supabase, applicationRows, userId)
  const subscriptionRows = ((subscriptions.data ?? []) as MemberSubscription[])
  const paymentRows = ((payments.data ?? []) as MemberPayment[])
  const monthlyLines = buildMonthlyLines(subscriptionRows, applicationRows)
  const outstandingBalance = paymentRows.filter((payment) => payment.status === "pending" || payment.status === "failed").reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0)

  return {
    profile: profile as MemberProfile,
    applications: applicationRows,
    subscriptions: subscriptionRows,
    payments: paymentRows,
    merchandiseOrders: normalizeMerchandiseOrders(merchandiseOrders.data ?? []),
    documents: (documents.data ?? []) as MemberDocument[],
    monthlyLines,
    monthlyTotal: monthlyLines.reduce((sum, line) => sum + line.amount, 0),
    outstandingBalance,
  }
}

async function attachCasePulses(supabase: ReturnType<typeof createAdminClient>, applications: MemberApplication[], currentUserId: string) {
  const applicationIds = applications.map((application) => application.id)

  if (applicationIds.length === 0) {
    return
  }

  const { data } = await supabase
    .from("case_pulses")
    .select("id, application_id, author_role, comment, file_path, created_at")
    .in("application_id", applicationIds)
    .order("created_at", { ascending: false })

  const pulsesByApplication = new Map<string, CasePulseItem[]>()
  await attachPulseLikes(supabase, (data ?? []) as Array<CasePulseItem & { application_id: string }>, currentUserId)

  for (const pulse of (data ?? []) as Array<CasePulseItem & { application_id: string }>) {
    const pulses = pulsesByApplication.get(pulse.application_id) ?? []
    pulses.push(pulse)
    pulsesByApplication.set(pulse.application_id, pulses)
  }

  for (const application of applications) {
    application.case_pulses = pulsesByApplication.get(application.id) ?? []
  }
}

async function attachPulseLikes(supabase: ReturnType<typeof createAdminClient>, pulses: Array<CasePulseItem & { application_id: string }>, currentUserId: string) {
  const pulseIds = pulses.map((pulse) => pulse.id)

  if (pulseIds.length === 0) {
    return
  }

  const { data } = await supabase.from("case_pulse_likes").select("pulse_id, user_id").in("pulse_id", pulseIds)
  const counts = new Map<string, number>()
  const likedByMe = new Set<string>()

  for (const like of (data ?? []) as Array<{ pulse_id: string; user_id: string }>) {
    counts.set(like.pulse_id, (counts.get(like.pulse_id) ?? 0) + 1)
    if (like.user_id === currentUserId) {
      likedByMe.add(like.pulse_id)
    }
  }

  for (const pulse of pulses) {
    pulse.like_count = counts.get(pulse.id) ?? 0
    pulse.liked_by_me = likedByMe.has(pulse.id)
  }
}

function buildMonthlyLines(subscriptions: MemberSubscription[], applications: MemberApplication[]) {
  const lines: MonthlyDeductionLine[] = subscriptions.map((subscription) => ({
    id: `subscription-${subscription.id}`,
    label: subscription.service_name,
    amount: Number(subscription.monthly_amount ?? 0),
    source: "Subscription",
    status: "active",
  }))

  for (const application of applications) {
    if (!["approved", "fulfilled"].includes(application.status) || !application.monthly_deduction) {
      continue
    }

    lines.push({
      id: `application-${application.id}`,
      label: friendlyService(application.application_type),
      amount: Number(application.monthly_deduction),
      source: "Approved service",
      status: application.status,
    })
  }

  return lines
}

function emptyPortalData(): MemberPortalData {
  return {
    profile: null,
    applications: [],
    subscriptions: [],
    payments: [],
    merchandiseOrders: [],
    documents: [],
    monthlyLines: [],
    monthlyTotal: 0,
    outstandingBalance: 0,
  }
}

function normalizeMerchandiseOrders(rows: unknown[]): MemberMerchandiseOrder[] {
  return rows.map((row) => {
    const record = row as MemberMerchandiseOrder & { merchandise_order_items?: MemberMerchandiseOrderItem | MemberMerchandiseOrderItem[] }
    return {
      ...record,
      merchandise_order_items: Array.isArray(record.merchandise_order_items)
        ? record.merchandise_order_items
        : record.merchandise_order_items
          ? [record.merchandise_order_items]
          : [],
    }
  })
}

export function friendlyService(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function formatCurrency(value: number, currency = "BWP") {
  return new Intl.NumberFormat("en-BW", { style: "currency", currency }).format(value)
}

export function calculateProfileCompletion(profile: MemberProfile | null, documents: MemberDocument[]) {
  const profileFields: Array<keyof MemberProfile> = [
    "full_name",
    "national_id",
    "date_of_birth",
    "gender",
    "marital_status",
    "occupation",
    "employer",
    "employee_number",
    "mobile_number",
    "email",
    "physical_address",
    "postal_address",
    "district",
    "region",
    "work_station",
    "department",
    "employment_date",
    "monthly_salary",
  ]
  const completedFields = profile
    ? profileFields.filter((field) => {
        const value = profile[field]
        return value !== null && value !== undefined && String(value).trim() !== ""
      }).length
    : 0
  const requiredDocuments = ["National ID copy", "Passport photo", "Employment confirmation letter", "Recent payslip"]
  const uploadedTypes = new Set(documents.map((document) => document.document_type.toLowerCase()))
  const completedDocuments = requiredDocuments.filter((document) => uploadedTypes.has(document.toLowerCase())).length
  const totalItems = profileFields.length + requiredDocuments.length

  return Math.round(((completedFields + completedDocuments) / totalItems) * 100)
}
