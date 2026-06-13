import { createAdminClient } from "@/lib/supabase/admin"

type ApplicationRow = {
  id: string
  application_type: string
  status: string
  monthly_deduction: number | null
  submitted_at: string
  members?: { full_name: string | null; email: string | null } | null
}

type PaymentRow = {
  id: string
  description: string
  amount: number
  status: string
  created_at: string
  paid_at: string | null
  members?: { full_name: string | null; email: string | null } | null
}

type RoleRow = {
  user_id: string
  role: string
  created_at: string
}

export type StaffUser = {
  user_id: string
  email: string
  name: string
  role: string
  created_at: string
}

export type AdminReportData = {
  configured: boolean
  metrics: Array<{ label: string; value: string; detail: string }>
  queues: Array<{ name: string; count: number; owner: string; status: string }>
  revenueReports: Array<{ label: string; value: string; detail: string }>
  applicationStatus: Array<{ label: string; count: number }>
  serviceBreakdown: Array<{ label: string; count: number }>
  recentApplications: ApplicationRow[]
  recentPayments: PaymentRow[]
  staffUsers: RoleRow[]
}

const applicationLabels: Record<string, string> = {
  membership: "Membership",
  funeral_insurance: "Funeral insurance",
  legal_aid: "Legal aid",
  loan_assistance: "Loan assistance",
  micro_loan: "Micro-loans",
  merchandise: "Merchandise",
  electronic_contract: "Electronic contracts",
}

const statusLabels: Record<string, string> = {
  submitted: "Submitted",
  in_review: "In review",
  more_info_required: "More info required",
  approved: "Approved",
  rejected: "Rejected",
  fulfilled: "Fulfilled",
}

export async function getAdminReportData(): Promise<AdminReportData> {
  try {
    const supabase = createAdminClient()
    const [
      memberCount,
      activeMemberCount,
      applicationCount,
      openApplicationCount,
      paymentCount,
      paidPaymentCount,
      membersByStatus,
      applications,
      payments,
      roles,
    ] = await Promise.all([
      countRows(supabase, "members"),
      countRows(supabase, "members", "status", "active"),
      countRows(supabase, "service_applications"),
      countRows(supabase, "service_applications", "status", ["submitted", "in_review", "more_info_required"]),
      countRows(supabase, "payment_transactions"),
      countRows(supabase, "payment_transactions", "status", "paid"),
      supabase.from("members").select("status"),
      supabase
        .from("service_applications")
        .select("id, application_type, status, monthly_deduction, submitted_at, members(full_name, email)")
        .order("submitted_at", { ascending: false })
        .limit(1000),
      supabase
        .from("payment_transactions")
        .select("id, description, amount, status, created_at, paid_at, members(full_name, email)")
        .order("created_at", { ascending: false })
        .limit(1000),
      supabase.from("user_roles").select("user_id, role, created_at").order("created_at", { ascending: false }).limit(100),
    ])

    const applicationRows = ((applications.data ?? []) as unknown[]).map(normalizeApplicationRow)
    const paymentRows = ((payments.data ?? []) as unknown[]).map(normalizePaymentRow)
    const roleRows = (roles.data ?? []) as RoleRow[]
    const paidRows = paymentRows.filter((payment) => payment.status === "paid")
    const totalRevenue = paidRows.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0)
    const pendingRevenue = paymentRows
      .filter((payment) => payment.status === "pending")
      .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0)

    return {
      configured: true,
      metrics: [
        { label: "Total members", value: formatNumber(memberCount), detail: "Registered member profiles" },
        { label: "Active members", value: formatNumber(activeMemberCount), detail: "Membership status active" },
        { label: "Open applications", value: formatNumber(openApplicationCount), detail: "Awaiting action or review" },
        { label: "Payments recorded", value: formatNumber(paymentCount), detail: `${formatNumber(paidPaymentCount)} paid` },
      ],
      queues: buildQueues(applicationRows),
      revenueReports: [
        { label: "Total collected", value: formatCurrency(totalRevenue), detail: "Paid payment transactions" },
        { label: "Pending collections", value: formatCurrency(pendingRevenue), detail: "Pending payment transactions" },
        { label: "Monthly deductions", value: formatCurrency(sumDeductions(applicationRows)), detail: "Approved application deductions" },
        { label: "Application volume", value: formatNumber(applicationCount), detail: "All service requests" },
      ],
      applicationStatus: countBy(applicationRows, "status", statusLabels),
      serviceBreakdown: countBy(applicationRows, "application_type", applicationLabels),
      recentApplications: applicationRows.slice(0, 8),
      recentPayments: paymentRows.slice(0, 8),
      staffUsers: roleRows.filter((row) => row.role === "admin" || row.role === "csr"),
    }
  } catch {
    return emptyReport()
  }
}

function normalizeApplicationRow(row: unknown): ApplicationRow {
  const record = row as ApplicationRow & { members?: ApplicationRow["members"] | ApplicationRow["members"][] }

  return {
    ...record,
    members: Array.isArray(record.members) ? (record.members[0] ?? null) : (record.members ?? null),
  }
}

function normalizePaymentRow(row: unknown): PaymentRow {
  const record = row as PaymentRow & { members?: PaymentRow["members"] | PaymentRow["members"][] }

  return {
    ...record,
    members: Array.isArray(record.members) ? (record.members[0] ?? null) : (record.members ?? null),
  }
}

export async function getStaffUsers(): Promise<StaffUser[]> {
  try {
    const supabase = createAdminClient()
    const [{ data: roles }, { data: users }] = await Promise.all([
      supabase.from("user_roles").select("user_id, role, created_at").order("created_at", {
        ascending: false,
      }),
      supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ])
    const authUsers = new Map((users.users ?? []).map((user) => [user.id, user]))
    const roleRows = new Map(((roles ?? []) as RoleRow[]).map((role) => [role.user_id, role]))

    return (users.users ?? []).map((user) => {
      const role = roleRows.get(user.id)
      return {
        user_id: user.id,
        email: user?.email ?? "Unknown email",
        name: String(user?.user_metadata?.full_name ?? user?.email ?? "Staff user"),
        role: role?.role ?? "member",
        created_at: role?.created_at ?? user.created_at,
      }
    })
  } catch {
    return []
  }
}

async function countRows(
  supabase: ReturnType<typeof createAdminClient>,
  table: string,
  column?: string,
  value?: string | string[],
) {
  let query = supabase.from(table).select("*", { count: "exact", head: true })

  if (column && Array.isArray(value)) {
    query = query.in(column, value)
  } else if (column && value) {
    query = query.eq(column, value)
  }

  const { count } = await query
  return count ?? 0
}

function buildQueues(rows: ApplicationRow[]) {
  return [
    { name: "New registrations", type: "membership", owner: "Membership Desk" },
    { name: "Funeral insurance", type: "funeral_insurance", owner: "Benefits Desk" },
    { name: "Legal aid cases", type: "legal_aid", owner: "Legal Partner" },
    { name: "Loan reviews", type: "loan_assistance", owner: "Finance Desk" },
    { name: "Micro-loans", type: "micro_loan", owner: "Finance Desk" },
    { name: "Merchandise orders", type: "merchandise", owner: "Supplier Desk" },
    { name: "Electronic contracts", type: "electronic_contract", owner: "Contracts Desk" },
  ].map((queue) => {
    const count = rows.filter(
      (row) => row.application_type === queue.type && ["submitted", "in_review", "more_info_required"].includes(row.status),
    ).length

    return {
      name: queue.name,
      count,
      owner: queue.owner,
      status: count > 0 ? "Open" : "Clear",
    }
  })
}

function countBy<T extends Record<string, unknown>>(rows: T[], key: keyof T, labels: Record<string, string>) {
  const counts = new Map<string, number>()

  for (const row of rows) {
    const value = String(row[key] ?? "unknown")
    counts.set(value, (counts.get(value) ?? 0) + 1)
  }

  return Object.entries(labels).map(([value, label]) => ({
    label,
    count: counts.get(value) ?? 0,
  }))
}

function sumDeductions(rows: ApplicationRow[]) {
  return rows
    .filter((row) => row.status === "approved" || row.status === "fulfilled")
    .reduce((sum, row) => sum + Number(row.monthly_deduction ?? 0), 0)
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-BW", {
    style: "currency",
    currency: "BWP",
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-BW").format(value)
}

export function friendlyApplicationType(value: string) {
  return applicationLabels[value] ?? value
}

export function friendlyStatus(value: string) {
  return statusLabels[value] ?? value
}

function emptyReport(): AdminReportData {
  return {
    configured: false,
    metrics: [
      { label: "Total members", value: "0", detail: "Connect Supabase to load data" },
      { label: "Active members", value: "0", detail: "Connect Supabase to load data" },
      { label: "Open applications", value: "0", detail: "Connect Supabase to load data" },
      { label: "Payments recorded", value: "0", detail: "Connect Supabase to load data" },
    ],
    queues: buildQueues([]),
    revenueReports: [
      { label: "Total collected", value: formatCurrency(0), detail: "Paid payment transactions" },
      { label: "Pending collections", value: formatCurrency(0), detail: "Pending payment transactions" },
      { label: "Monthly deductions", value: formatCurrency(0), detail: "Approved application deductions" },
      { label: "Application volume", value: "0", detail: "All service requests" },
    ],
    applicationStatus: countBy([], "status", statusLabels),
    serviceBreakdown: countBy([], "application_type", applicationLabels),
    recentApplications: [],
    recentPayments: [],
    staffUsers: [],
  }
}
