import { createAdminClient } from "@/lib/supabase/admin"
import type { CasePulseItem } from "@/components/case-pulse"
import type { MerchandiseProduct } from "@/lib/merchandise-data"

export type CsrMember = {
  id: string
  membership_number: string | null
  full_name: string
  national_id: string | null
  date_of_birth: string | null
  gender: string | null
  marital_status: string | null
  occupation: string | null
  email: string
  mobile_number: string
  alternative_contact_number: string | null
  employer: string | null
  employee_number: string | null
  physical_address: string | null
  postal_address: string | null
  district: string | null
  region: string | null
  work_station: string | null
  department: string | null
  employment_date: string | null
  monthly_salary: number | null
  status: string
  created_at: string
  updated_at: string
}

export type CsrDocument = {
  id: string
  member_id: string
  document_type: string
  file_path: string
  verified_at: string | null
  created_at: string
  members?: { full_name: string | null; email: string | null } | null
}

export type CsrApplication = {
  id: string
  member_id: string
  application_type: string
  status: string
  requested_amount: number | null
  monthly_deduction: number | null
  term_months: number | null
  details: Record<string, unknown>
  submitted_at: string
  attachments: CsrDocument[]
  case_pulses?: CasePulseItem[]
  members?: { full_name: string | null; email: string | null } | null
}

export type CsrPayment = {
  id: string
  description: string
  amount: number
  currency: string
  status: string
  created_at: string
  members?: { full_name: string | null; email: string | null } | null
}

export type CsrComplaint = {
  id: string
  subject: string
  category: string
  priority: string
  status: string
  resolution_notes: string | null
  created_at: string
  members?: { full_name: string | null; email: string | null } | null
}

export type CsrMerchandiseOrder = {
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
  created_at: string
  members?: { full_name: string | null; email: string | null } | null
}

export type CsrPortalData = {
  configured: boolean
  metrics: Array<{ label: string; value: string; detail: string }>
  dashboard: CsrDashboardInsights
  members: CsrMember[]
  documents: CsrDocument[]
  applications: CsrApplication[]
  payments: CsrPayment[]
  complaints: CsrComplaint[]
  products: MerchandiseProduct[]
  merchandiseOrders: CsrMerchandiseOrder[]
}

export type CsrDashboardInsights = {
  applicationStatus: Array<{ label: string; value: number }>
  serviceVolume: Array<{ label: string; value: number }>
  paymentStatus: Array<{ label: string; value: number }>
  monthlyApplications: Array<{ label: string; value: number }>
  operations: Array<{ label: string; value: string; detail: string }>
}

export async function getCsrPortalData(currentUserId?: string): Promise<CsrPortalData> {
  try {
    const supabase = createAdminClient()
    const [members, documents, applications, payments, complaints, products, merchandiseOrders] = await Promise.all([
      supabase
        .from("members")
        .select("id, membership_number, full_name, national_id, date_of_birth, gender, marital_status, occupation, email, mobile_number, alternative_contact_number, employer, employee_number, physical_address, postal_address, district, region, work_station, department, employment_date, monthly_salary, status, created_at, updated_at")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase.from("member_documents").select("id, member_id, document_type, file_path, verified_at, created_at, members(full_name, email)").order("created_at", { ascending: false }).limit(500),
      supabase.from("service_applications").select("id, member_id, application_type, status, requested_amount, monthly_deduction, term_months, details, submitted_at, members(full_name, email)").order("submitted_at", { ascending: false }).limit(500),
      supabase.from("payment_transactions").select("id, description, amount, currency, status, created_at, members(full_name, email)").order("created_at", { ascending: false }).limit(500),
      supabase.from("complaints").select("id, subject, category, priority, status, resolution_notes, created_at, members(full_name, email)").order("created_at", { ascending: false }).limit(500),
      supabase.from("merchandise_products").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("merchandise_orders").select("id, order_number, status, payment_status, payment_option, delivery_method, delivery_address, collection_point, total_amount, amount_paid, balance_remaining, monthly_deduction, fulfilment_status, customer_signed_off_at, created_at, members(full_name, email)").order("created_at", { ascending: false }).limit(500),
    ])

    const memberRows = (members.data ?? []) as CsrMember[]
    const documentRows = ((documents.data ?? []) as unknown[]).map(normalizeDocument)
    const applicationRows = ((applications.data ?? []) as unknown[]).map(normalizeApplication)
    attachApplicationDocuments(applicationRows, documentRows)
    await attachCasePulses(supabase, applicationRows, currentUserId)
    const paymentRows = ((payments.data ?? []) as unknown[]).map(normalizePayment)
    const complaintRows = ((complaints.data ?? []) as unknown[]).map(normalizeComplaint)

    return {
      configured: true,
      metrics: [
        { label: "Pending members", value: formatNumber(memberRows.filter((member) => member.status === "pending").length), detail: "Profiles awaiting verification" },
        { label: "Unverified documents", value: formatNumber(documentRows.filter((document) => !document.verified_at).length), detail: "Documents to check" },
        { label: "Open applications", value: formatNumber(applicationRows.filter((application) => ["submitted", "in_review", "more_info_required"].includes(application.status)).length), detail: "CSR review queue" },
        { label: "Open complaints", value: formatNumber(complaintRows.filter((complaint) => ["open", "in_review"].includes(complaint.status)).length), detail: "Member issues requiring follow-up" },
      ],
      dashboard: buildDashboardInsights(memberRows, documentRows, applicationRows, paymentRows, complaintRows, ((merchandiseOrders.data ?? []) as unknown[]).map(normalizeMerchandiseOrder)),
      members: memberRows,
      documents: documentRows,
      applications: applicationRows,
      payments: paymentRows,
      complaints: complaintRows,
      products: (products.data ?? []) as MerchandiseProduct[],
      merchandiseOrders: ((merchandiseOrders.data ?? []) as unknown[]).map(normalizeMerchandiseOrder),
    }
  } catch {
    return {
      configured: false,
      metrics: [
        { label: "Pending members", value: "0", detail: "Connect Supabase to load data" },
        { label: "Unverified documents", value: "0", detail: "Connect Supabase to load data" },
        { label: "Open applications", value: "0", detail: "Connect Supabase to load data" },
        { label: "Open complaints", value: "0", detail: "Connect Supabase to load data" },
      ],
      dashboard: emptyDashboardInsights(),
      members: [],
      documents: [],
      applications: [],
      payments: [],
      complaints: [],
      products: [],
      merchandiseOrders: [],
    }
  }
}

function buildDashboardInsights(
  members: CsrMember[],
  documents: CsrDocument[],
  applications: CsrApplication[],
  payments: CsrPayment[],
  complaints: CsrComplaint[],
  merchandiseOrders: CsrMerchandiseOrder[],
): CsrDashboardInsights {
  const paidTotal = payments.filter((payment) => payment.status === "paid").reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0)
  const pendingPaymentTotal = payments.filter((payment) => payment.status === "pending").reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0)
  const creditBalance = merchandiseOrders.reduce((sum, order) => sum + Number(order.balance_remaining ?? 0), 0)
  const unsignedOrders = merchandiseOrders.filter((order) => !order.customer_signed_off_at && ["delivered", "collected"].includes(order.fulfilment_status)).length

  return {
    applicationStatus: countBy(applications, (application) => application.status.replace(/_/g, " ")),
    serviceVolume: countBy(applications, (application) => friendlyService(application.application_type)).slice(0, 6),
    paymentStatus: countBy(payments, (payment) => payment.status.replace(/_/g, " ")),
    monthlyApplications: applicationsByMonth(applications),
    operations: [
      { label: "Paid collections", value: formatCurrency(paidTotal), detail: "Confirmed payment transactions" },
      { label: "Pending payments", value: formatCurrency(pendingPaymentTotal), detail: "Payments awaiting completion" },
      { label: "Credit balance", value: formatCurrency(creditBalance), detail: "Outstanding merchandise credit" },
      { label: "Unsigned deliveries", value: formatNumber(unsignedOrders), detail: "Delivered or collected orders awaiting customer sign-off" },
      { label: "Verified documents", value: `${documents.filter((document) => document.verified_at).length}/${documents.length}`, detail: "Document verification coverage" },
      { label: "Active members", value: `${members.filter((member) => member.status === "active").length}/${members.length}`, detail: "Activated membership profiles" },
      { label: "High priority complaints", value: formatNumber(complaints.filter((complaint) => ["high", "urgent"].includes(complaint.priority) && complaint.status !== "closed").length), detail: "Needs close follow-up" },
    ],
  }
}

function emptyDashboardInsights(): CsrDashboardInsights {
  return {
    applicationStatus: [],
    serviceVolume: [],
    paymentStatus: [],
    monthlyApplications: [],
    operations: [],
  }
}

function countBy<T>(rows: T[], getLabel: (row: T) => string) {
  const counts = new Map<string, number>()
  for (const row of rows) {
    const label = getLabel(row)
    counts.set(label, (counts.get(label) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => right.value - left.value || left.label.localeCompare(right.label))
}

function applicationsByMonth(applications: CsrApplication[]) {
  const formatter = new Intl.DateTimeFormat("en-BW", { month: "short" })
  const months = new Map<string, number>()
  const now = new Date()

  for (let index = 5; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1)
    months.set(formatter.format(date), 0)
  }

  for (const application of applications) {
    const submitted = new Date(application.submitted_at)
    const monthKey = formatter.format(submitted)
    if (months.has(monthKey)) {
      months.set(monthKey, (months.get(monthKey) ?? 0) + 1)
    }
  }

  return Array.from(months.entries()).map(([label, value]) => ({ label, value }))
}

function normalizeMerchandiseOrder(row: unknown): CsrMerchandiseOrder {
  const record = row as CsrMerchandiseOrder & { members?: CsrMerchandiseOrder["members"] | CsrMerchandiseOrder["members"][] }
  return { ...record, members: Array.isArray(record.members) ? (record.members[0] ?? null) : (record.members ?? null) }
}

async function attachCasePulses(supabase: ReturnType<typeof createAdminClient>, applications: CsrApplication[], currentUserId?: string) {
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

async function attachPulseLikes(supabase: ReturnType<typeof createAdminClient>, pulses: Array<CasePulseItem & { application_id: string }>, currentUserId?: string) {
  const pulseIds = pulses.map((pulse) => pulse.id)

  if (pulseIds.length === 0) {
    return
  }

  const { data } = await supabase.from("case_pulse_likes").select("pulse_id, user_id").in("pulse_id", pulseIds)
  const counts = new Map<string, number>()
  const likedByMe = new Set<string>()

  for (const like of (data ?? []) as Array<{ pulse_id: string; user_id: string }>) {
    counts.set(like.pulse_id, (counts.get(like.pulse_id) ?? 0) + 1)
    if (currentUserId && like.user_id === currentUserId) {
      likedByMe.add(like.pulse_id)
    }
  }

  for (const pulse of pulses) {
    pulse.like_count = counts.get(pulse.id) ?? 0
    pulse.liked_by_me = likedByMe.has(pulse.id)
  }
}

function normalizeDocument(row: unknown): CsrDocument {
  const record = row as CsrDocument & { members?: CsrDocument["members"] | CsrDocument["members"][] }
  return { ...record, members: Array.isArray(record.members) ? (record.members[0] ?? null) : (record.members ?? null) }
}

function normalizeApplication(row: unknown): CsrApplication {
  const record = row as CsrApplication & { members?: CsrApplication["members"] | CsrApplication["members"][] }
  return {
    ...record,
    details: record.details ?? {},
    attachments: [],
    members: Array.isArray(record.members) ? (record.members[0] ?? null) : (record.members ?? null),
  }
}

function attachApplicationDocuments(applications: CsrApplication[], documents: CsrDocument[]) {
  const documentsById = new Map(documents.map((document) => [document.id, document]))
  const explicitlyAssigned = new Set<string>()
  const applicationsWithExplicitLinks = new Set<string>()

  for (const application of applications) {
    const attachmentIds = application.details.__attachmentDocumentIds
    if (!Array.isArray(attachmentIds)) continue
    applicationsWithExplicitLinks.add(application.id)

    application.attachments = attachmentIds
      .map((id) => documentsById.get(String(id)))
      .filter((document): document is CsrDocument => Boolean(document))

    for (const document of application.attachments) {
      explicitlyAssigned.add(document.id)
    }
  }

  for (const document of documents) {
    if (explicitlyAssigned.has(document.id)) continue

    const documentTime = new Date(document.created_at).getTime()
    const closestApplication = applications
      .filter((application) => application.member_id === document.member_id && !applicationsWithExplicitLinks.has(application.id))
      .map((application) => ({ application, delay: documentTime - new Date(application.submitted_at).getTime() }))
      .filter(({ delay }) => delay >= 0 && delay <= 20 * 60 * 1000)
      .sort((left, right) => left.delay - right.delay)[0]?.application

    if (closestApplication) {
      closestApplication.attachments.push(document)
    }
  }
}

function normalizePayment(row: unknown): CsrPayment {
  const record = row as CsrPayment & { members?: CsrPayment["members"] | CsrPayment["members"][] }
  return { ...record, members: Array.isArray(record.members) ? (record.members[0] ?? null) : (record.members ?? null) }
}

function normalizeComplaint(row: unknown): CsrComplaint {
  const record = row as CsrComplaint & { members?: CsrComplaint["members"] | CsrComplaint["members"][] }
  return { ...record, members: Array.isArray(record.members) ? (record.members[0] ?? null) : (record.members ?? null) }
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-BW").format(value)
}

export function formatCurrency(value: number, currency = "BWP") {
  return new Intl.NumberFormat("en-BW", { style: "currency", currency }).format(value)
}

export function friendlyService(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}
