"use client"

import { useMemo, useState } from "react"
import {
  ArrowDownUp,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Clock3,
  CircleDollarSign,
  Download,
  Eye,
  FileText,
  IdCard,
  Mail,
  MapPin,
  Phone,
  Search,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react"
import { CasePulse } from "@/components/case-pulse"
import { CsrMerchandiseCatalog } from "@/components/csr-merchandise-catalog"
import type { CsrApplication, CsrComplaint, CsrDocument, CsrMember, CsrMerchandiseOrder, CsrPayment } from "@/lib/csr-data"
import { formatCurrency, friendlyService } from "@/lib/csr-data"
import type { MerchandiseProduct } from "@/lib/merchandise-data"

type Props = {
  members: CsrMember[]
  documents: CsrDocument[]
  applications: CsrApplication[]
  payments: CsrPayment[]
  complaints: CsrComplaint[]
  products: MerchandiseProduct[]
  merchandiseOrders: CsrMerchandiseOrder[]
  sections?: CsrWorkbenchSection[]
  applicationRedirectTo?: string
}

export type CsrWorkbenchSection = "members" | "documents" | "applications" | "products" | "orders" | "payments" | "complaints"

export function CsrWorkbench({ members, documents, applications, payments, complaints, products, merchandiseOrders, sections, applicationRedirectTo = "/csr/applications" }: Props) {
  const visibleSections = sections ?? ["members", "documents", "applications", "products", "orders", "payments", "complaints"]

  return (
    <div className="space-y-6">
      {visibleSections.includes("members") && <MembersSection members={members} />}
      {visibleSections.includes("documents") && <DocumentsSection documents={documents} />}
      {visibleSections.includes("applications") && <ApplicationsSection applications={applications} redirectTo={applicationRedirectTo} />}
      {visibleSections.includes("products") && <CsrMerchandiseCatalog products={products} />}
      {visibleSections.includes("orders") && <MerchandiseOrdersSection orders={merchandiseOrders} />}
      {visibleSections.includes("payments") && <PaymentsSection payments={payments} />}
      {visibleSections.includes("complaints") && <ComplaintsSection complaints={complaints} />}
    </div>
  )
}

function MerchandiseOrdersSection({ orders }: { orders: CsrMerchandiseOrder[] }) {
  const [query, setQuery] = useState("")
  const [paymentStatus, setPaymentStatus] = useState("all")
  const [fulfilmentStatus, setFulfilmentStatus] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const rows = useMemo(() => {
    const filtered = orders.filter((order) => {
      const text = [order.order_number, order.status, order.payment_status, order.fulfilment_status, order.members?.full_name ?? "", order.members?.email ?? ""].join(" ").toLowerCase()
      return text.includes(query.toLowerCase()) &&
        (paymentStatus === "all" || order.payment_status === paymentStatus) &&
        (fulfilmentStatus === "all" || order.fulfilment_status === fulfilmentStatus)
    })
    return [...filtered].sort((left, right) => {
      if (sortBy === "oldest") return new Date(left.created_at).getTime() - new Date(right.created_at).getTime()
      if (sortBy === "member") return (left.members?.full_name ?? "").localeCompare(right.members?.full_name ?? "")
      if (sortBy === "balance") return Number(right.balance_remaining) - Number(left.balance_remaining)
      if (sortBy === "total") return Number(right.total_amount) - Number(left.total_amount)
      return new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
    })
  }, [fulfilmentStatus, orders, paymentStatus, query, sortBy])
  const pagination = paginateRows(rows, page, pageSize)

  return (
    <section id="merchandise-orders" className="rounded-lg border bg-white p-5 shadow-sm">
      <SectionToolbar title="Merchandise orders" query={query} setQuery={(value) => { setQuery(value); setPage(1) }} onExport={() => exportCsv("csr-merchandise-orders.csv", rows)} />
      <div className="mb-4 flex flex-wrap gap-2">
        <TableSelect value={paymentStatus} onChange={(value) => { setPaymentStatus(value); setPage(1) }} options={[["all", "All payment statuses"], ["pending", "Pending payment"], ["paid", "Paid"], ["partially_paid", "Partially paid"], ["failed", "Failed"]]} />
        <TableSelect value={fulfilmentStatus} onChange={(value) => { setFulfilmentStatus(value); setPage(1) }} options={[["all", "All fulfilment statuses"], ["pending", "Pending"], ["processing", "Processing"], ["ready_for_collection", "Ready for collection"], ["out_for_delivery", "Out for delivery"], ["delivered", "Delivered"], ["collected", "Collected"], ["cancelled", "Cancelled"]]} />
        <TableSelect value={sortBy} onChange={(value) => { setSortBy(value); setPage(1) }} options={[["newest", "Newest first"], ["oldest", "Oldest first"], ["member", "Member A-Z"], ["total", "Highest total"], ["balance", "Highest balance"]]} />
        <PageSizeSelect value={pageSize} onChange={(value) => { setPageSize(value); setPage(1) }} />
      </div>
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full min-w-[1180px] text-left text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Delivery</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Paid</th>
              <th className="px-4 py-3">Balance</th>
              <th className="px-4 py-3">Fulfilment</th>
              <th className="px-4 py-3">Record payment</th>
            </tr>
          </thead>
          <tbody>
            {pagination.visibleRows.map((order) => (
              <tr key={order.id} className="border-t align-top">
                <td className="px-4 py-3">
                  <p className="font-bold">{order.order_number}</p>
                  <p className="text-xs capitalize text-muted-foreground">{order.status.replace(/_/g, " ")}</p>
                </td>
                <td className="px-4 py-3">{order.members?.full_name ?? order.members?.email ?? "Member"}</td>
                <td className="px-4 py-3">{order.payment_option === "credit" ? "Credit" : "Cash"} / {order.payment_status.replace(/_/g, " ")}</td>
                <td className="px-4 py-3">
                  <p className="font-semibold capitalize">{order.delivery_method}</p>
                  <p className="text-xs text-muted-foreground">{order.delivery_method === "delivery" ? (order.delivery_address ?? "No address") : (order.collection_point ?? "Collection point not set")}</p>
                </td>
                <td className="px-4 py-3">{formatCurrency(Number(order.total_amount ?? 0))}</td>
                <td className="px-4 py-3">{formatCurrency(Number(order.amount_paid ?? 0))}</td>
                <td className="px-4 py-3">{formatCurrency(Number(order.balance_remaining ?? 0))}</td>
                <td className="px-4 py-3">
                  <form action="/api/csr/merchandise/orders/fulfilment" method="post" className="flex gap-2">
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="redirectTo" value="/csr/orders" />
                    <select className="rounded-md border bg-white px-3 py-2" name="fulfilmentStatus" defaultValue={order.fulfilment_status ?? "pending"}>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="ready_for_collection">Ready for collection</option>
                      <option value="out_for_delivery">Out for delivery</option>
                      <option value="delivered">Delivered</option>
                      <option value="collected">Collected</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <button className="rounded-md bg-primary px-3 py-2 font-semibold text-primary-foreground">Save</button>
                  </form>
                  <p className="mt-2 text-xs text-muted-foreground">{order.customer_signed_off_at ? "Customer signed off" : "Awaiting customer sign-off"}</p>
                </td>
                <td className="px-4 py-3">
                  <form action="/api/csr/merchandise/orders/payment" method="post" className="flex gap-2">
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="redirectTo" value="/csr/orders" />
                    <input className="w-28 rounded-md border px-3 py-2" min={1} name="paymentAmount" type="number" defaultValue={order.monthly_deduction ?? order.balance_remaining ?? 0} />
                    <button className="rounded-md bg-primary px-3 py-2 font-semibold text-primary-foreground">Save</button>
                  </form>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <EmptyRow colSpan={9} text="No merchandise orders found." />}
          </tbody>
        </table>
      </div>
      <PaginationControls {...pagination} label="orders" onPageChange={setPage} />
    </section>
  )
}

function MembersSection({ members }: { members: CsrMember[] }) {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("all")
  const [district, setDistrict] = useState("all")
  const [sortKey, setSortKey] = useState<MemberSortKey>("created_at")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedMember, setSelectedMember] = useState<CsrMember | null>(null)
  const districts = useMemo(
    () => Array.from(new Set(members.map((member) => member.district).filter((value): value is string => Boolean(value)))).sort(),
    [members],
  )
  const rows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const filtered = members.filter((member) => {
      const matchesQuery = !normalizedQuery || Object.values(member).join(" ").toLowerCase().includes(normalizedQuery)
      return matchesQuery && (status === "all" || member.status === status) && (district === "all" || member.district === district)
    })

    return [...filtered].sort((left, right) => {
      const result = memberSortValue(left, sortKey).localeCompare(memberSortValue(right, sortKey), undefined, { numeric: true, sensitivity: "base" })
      return sortDirection === "asc" ? result : -result
    })
  }, [district, members, query, sortDirection, sortKey, status])
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pageStart = (currentPage - 1) * pageSize
  const visibleRows = rows.slice(pageStart, pageStart + pageSize)
  const showingStart = rows.length === 0 ? 0 : pageStart + 1
  const showingEnd = Math.min(pageStart + pageSize, rows.length)

  function updateSort(key: MemberSortKey) {
    setPage(1)
    if (sortKey === key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"))
      return
    }
    setSortKey(key)
    setSortDirection("asc")
  }

  return (
    <section id="members" className="rounded-lg border bg-white p-5 shadow-sm">
      <SectionToolbar title="Member verification" query={query} setQuery={(value) => { setQuery(value); setPage(1) }} onExport={() => exportCsv("csr-members.csv", rows)} />
      <div className="mb-4 flex flex-wrap gap-2">
        <select className="rounded-md border bg-white px-3 py-2 text-sm font-medium" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }}>
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select className="rounded-md border bg-white px-3 py-2 text-sm font-medium" value={district} onChange={(event) => { setDistrict(event.target.value); setPage(1) }}>
          <option value="all">All districts</option>
          {districts.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
        <select className="rounded-md border bg-white px-3 py-2 text-sm font-medium" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }}>
          <option value={10}>10 per page</option>
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
        </select>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[1050px] text-left text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <SortableMemberHeader label="Member" column="full_name" activeColumn={sortKey} onSort={updateSort} />
              <SortableMemberHeader label="Employer" column="employer" activeColumn={sortKey} onSort={updateSort} />
              <SortableMemberHeader label="Location" column="location" activeColumn={sortKey} onSort={updateSort} />
              <SortableMemberHeader label="Status" column="status" activeColumn={sortKey} onSort={updateSort} />
              <SortableMemberHeader label="Registered" column="created_at" activeColumn={sortKey} onSort={updateSort} />
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((member) => (
              <tr key={member.id} className="border-t">
                <td className="px-4 py-3">
                  <p className="font-bold">{member.full_name}</p>
                  <p className="text-xs text-muted-foreground">{member.email} · {member.mobile_number}</p>
                </td>
                <td className="px-4 py-3">{member.employer ?? "Not captured"}</td>
                <td className="px-4 py-3">{[member.district, member.region].filter(Boolean).join(", ") || "Not captured"}</td>
                <td className="px-4 py-3 capitalize">{member.status}</td>
                <td className="px-4 py-3">{formatDate(member.created_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 font-semibold text-primary hover:bg-muted" onClick={() => setSelectedMember(member)}>
                      <Eye className="h-4 w-4" />
                      View profile
                    </button>
                    <form action="/api/csr/members/update" method="post" className="flex gap-2">
                    <input type="hidden" name="memberId" value={member.id} />
                    <input type="hidden" name="redirectTo" value="/csr/members" />
                    <select className="rounded-md border bg-white px-3 py-2" name="status" defaultValue={member.status}>
                      <option value="pending">Pending</option>
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <button className="rounded-md bg-primary px-3 py-2 font-semibold text-primary-foreground">Save</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <EmptyRow colSpan={6} text="No members found." />}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>Showing {showingStart}-{showingEnd} of {rows.length} members</p>
        <div className="flex items-center gap-2">
          <button className="rounded-md border bg-white px-3 py-2 font-semibold text-foreground hover:bg-muted disabled:opacity-40" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button>
          <span className="px-2 font-semibold text-foreground">Page {currentPage} of {pageCount}</span>
          <button className="rounded-md border bg-white px-3 py-2 font-semibold text-foreground hover:bg-muted disabled:opacity-40" disabled={currentPage === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Next</button>
        </div>
      </div>
      {selectedMember && <MemberProfileModal member={selectedMember} onClose={() => setSelectedMember(null)} />}
    </section>
  )
}

type MemberSortKey = "full_name" | "employer" | "location" | "status" | "created_at"

function SortableMemberHeader({ label, column, activeColumn, onSort }: { label: string; column: MemberSortKey; activeColumn: MemberSortKey; onSort: (column: MemberSortKey) => void }) {
  return (
    <th className="px-4 py-3">
      <button className="inline-flex items-center gap-2 font-semibold" onClick={() => onSort(column)}>
        {label}
        <ArrowDownUp className={`h-3.5 w-3.5 ${activeColumn === column ? "text-primary" : ""}`} />
      </button>
    </th>
  )
}

function MemberProfileModal({ member, onClose }: { member: CsrMember; onClose: () => void }) {
  const initials = member.full_name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name[0])
    .join("")
    .toUpperCase()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-labelledby="member-profile-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border bg-slate-50 shadow-2xl">
        <header className="sticky top-0 z-10 border-b bg-white/95 px-5 py-5 backdrop-blur sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground shadow-sm">
                {initials || "M"}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 id="member-profile-title" className="truncate text-xl font-bold sm:text-2xl">{member.full_name}</h3>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${memberStatusClass(member.status)}`}>
                    {member.status}
                  </span>
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <BadgeCheck className="h-4 w-4 text-primary" />
                  {member.membership_number || "Membership number pending"}
                </p>
              </div>
            </div>
            <button className="shrink-0 rounded-full border bg-white p-2.5 text-muted-foreground shadow-sm transition hover:bg-muted hover:text-foreground" onClick={onClose} aria-label="Close profile">
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="space-y-5 p-5 sm:p-7">
          <div className="grid gap-3 md:grid-cols-3">
            <ProfileHighlight icon={Mail} label="Email address" value={member.email} />
            <ProfileHighlight icon={Phone} label="Mobile number" value={member.mobile_number} />
            <ProfileHighlight icon={Building2} label="Employer" value={member.employer} />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <ProfileSection icon={UserRound} title="Personal details">
              <ProfileField label="National ID" value={member.national_id} />
              <ProfileField label="Date of birth" value={formatDate(member.date_of_birth)} />
              <ProfileField label="Gender" value={member.gender} capitalize />
              <ProfileField label="Marital status" value={member.marital_status} capitalize />
              <ProfileField label="Alternative contact" value={member.alternative_contact_number} />
            </ProfileSection>

            <ProfileSection icon={BriefcaseBusiness} title="Employment details">
              <ProfileField label="Occupation" value={member.occupation} />
              <ProfileField label="Employee number" value={member.employee_number} />
              <ProfileField label="Work station" value={member.work_station} />
              <ProfileField label="Department" value={member.department} />
              <ProfileField label="Employment date" value={formatDate(member.employment_date)} />
              <ProfileField label="Monthly salary" value={member.monthly_salary == null ? null : formatCurrency(Number(member.monthly_salary))} />
            </ProfileSection>

            <ProfileSection icon={MapPin} title="Address and location">
              <ProfileField label="Physical address" value={member.physical_address} fullWidth />
              <ProfileField label="Postal address" value={member.postal_address} fullWidth />
              <ProfileField label="District" value={member.district} />
              <ProfileField label="Region" value={member.region} />
            </ProfileSection>

            <ProfileSection icon={IdCard} title="Membership record">
              <ProfileField label="Membership number" value={member.membership_number} />
              <ProfileField label="Member status" value={member.status} capitalize />
              <ProfileField label="Registered" value={formatDate(member.created_at)} icon={CalendarDays} />
              <ProfileField label="Last updated" value={formatDate(member.updated_at)} icon={Clock3} />
            </ProfileSection>
          </div>
        </div>

        <footer className="sticky bottom-0 flex justify-end border-t bg-white/95 px-5 py-4 backdrop-blur sm:px-7">
          <button className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90" onClick={onClose}>
            Close profile
          </button>
        </footer>
      </div>
    </div>
  )
}

function ProfileHighlight({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string | null }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border bg-white p-4 shadow-sm">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 truncate text-sm font-semibold">{value || "Not captured"}</p>
      </div>
    </div>
  )
}

function ProfileSection({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="flex items-center gap-2.5 border-b bg-muted/40 px-5 py-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <h4 className="font-bold">{title}</h4>
      </div>
      <dl className="grid gap-x-5 px-5 sm:grid-cols-2">
        {children}
      </dl>
    </section>
  )
}

function ProfileField({ label, value, capitalize = false, fullWidth = false, icon: Icon }: { label: string; value: string | number | null; capitalize?: boolean; fullWidth?: boolean; icon?: LucideIcon }) {
  return (
    <div className={`border-b py-4 last:border-b-0 ${fullWidth ? "sm:col-span-2" : ""}`}>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className={`mt-1.5 flex items-center gap-2 text-sm font-medium ${capitalize ? "capitalize" : ""}`}>
        {Icon && <Icon className="h-4 w-4 shrink-0 text-primary" />}
        <span className={value ? "text-foreground" : "italic text-muted-foreground"}>{value || "Not captured"}</span>
      </dd>
    </div>
  )
}

function memberStatusClass(status: string) {
  switch (status) {
    case "active":
      return "bg-emerald-100 text-emerald-800"
    case "pending":
      return "bg-amber-100 text-amber-800"
    case "suspended":
      return "bg-orange-100 text-orange-800"
    case "cancelled":
      return "bg-red-100 text-red-800"
    default:
      return "bg-slate-100 text-slate-700"
  }
}

function memberSortValue(member: CsrMember, key: MemberSortKey) {
  if (key === "location") return [member.district, member.region].filter(Boolean).join(" ")
  return String(member[key] ?? "")
}

function formatDate(value: string | null) {
  if (!value) return ""
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-BW", { dateStyle: "medium" }).format(date)
}

function DocumentsSection({ documents }: { documents: CsrDocument[] }) {
  const [query, setQuery] = useState("")
  const [verified, setVerified] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [page, setPage] = useState(1)
  const rows = useMemo(() => {
    const filtered = documents.filter((document) => {
      const text = [document.document_type, document.file_path, document.members?.full_name ?? "", document.members?.email ?? ""].join(" ").toLowerCase()
      const matchesQuery = text.includes(query.toLowerCase())
      const matchesVerified = verified === "all" || (verified === "verified" ? Boolean(document.verified_at) : !document.verified_at)
      return matchesQuery && matchesVerified
    })

    return [...filtered].sort((left, right) => {
      if (sortBy === "oldest") {
        return new Date(left.created_at).getTime() - new Date(right.created_at).getTime()
      }

      if (sortBy === "member") {
        return (left.members?.full_name ?? left.members?.email ?? "").localeCompare(right.members?.full_name ?? right.members?.email ?? "")
      }

      if (sortBy === "document") {
        return left.document_type.localeCompare(right.document_type)
      }

      if (sortBy === "verification") {
        return Number(Boolean(left.verified_at)) - Number(Boolean(right.verified_at))
      }

      return new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
    })
  }, [documents, query, sortBy, verified])
  const pageSize = 10
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pageStart = (currentPage - 1) * pageSize
  const visibleRows = rows.slice(pageStart, pageStart + pageSize)
  const showingStart = rows.length === 0 ? 0 : pageStart + 1
  const showingEnd = Math.min(pageStart + pageSize, rows.length)

  return (
    <section id="documents" className="rounded-lg border bg-white p-5 shadow-sm">
      <SectionToolbar title="Document verification" query={query} setQuery={(value) => { setQuery(value); setPage(1) }} onExport={() => exportCsv("csr-documents.csv", rows)} />
      <div className="mb-4 flex flex-wrap gap-2">
        <select className="rounded-md border bg-white px-3 py-2 text-sm font-medium" value={verified} onChange={(event) => { setVerified(event.target.value); setPage(1) }}>
          <option value="all">All documents</option>
          <option value="unverified">Unverified only</option>
          <option value="verified">Verified only</option>
        </select>
        <select className="rounded-md border bg-white px-3 py-2 text-sm font-medium" value={sortBy} onChange={(event) => { setSortBy(event.target.value); setPage(1) }}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="member">Member A-Z</option>
          <option value="document">Document A-Z</option>
          <option value="verification">Unverified first</option>
        </select>
      </div>
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Document</th>
              <th className="px-4 py-3">Verified</th>
              <th className="px-4 py-3">File</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((document) => (
              <tr key={document.id} className="border-t">
                <td className="px-4 py-3">{document.members?.full_name ?? document.members?.email ?? "Member"}</td>
                <td className="px-4 py-3">{document.document_type}</td>
                <td className="px-4 py-3">{document.verified_at ? "Yes" : "No"}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <a
                      className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-xs font-semibold text-primary hover:bg-muted"
                      href={`/api/csr/documents/file?documentId=${encodeURIComponent(document.id)}`}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </a>
                    <a
                      className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-xs font-semibold hover:bg-muted"
                      href={`/api/csr/documents/file?documentId=${encodeURIComponent(document.id)}&download=1`}
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </a>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <form action="/api/csr/documents/verify" method="post" className="flex gap-2">
                    <input type="hidden" name="documentId" value={document.id} />
                    <input type="hidden" name="redirectTo" value="/csr/documents" />
                    <select className="rounded-md border bg-white px-3 py-2" name="verified" defaultValue={document.verified_at ? "yes" : "no"}>
                      <option value="yes">Verified</option>
                      <option value="no">Not verified</option>
                    </select>
                    <button className="rounded-md bg-primary px-3 py-2 font-semibold text-primary-foreground">Save</button>
                  </form>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <EmptyRow colSpan={5} text="No documents found." />}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          Showing {showingStart}-{showingEnd} of {rows.length} documents
        </p>
        <div className="flex items-center gap-2">
          <button className="rounded-md border bg-white px-3 py-2 font-semibold text-foreground hover:bg-muted disabled:opacity-40" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
            Previous
          </button>
          <span className="px-2 font-semibold text-foreground">
            Page {currentPage} of {pageCount}
          </span>
          <button className="rounded-md border bg-white px-3 py-2 font-semibold text-foreground hover:bg-muted disabled:opacity-40" disabled={currentPage === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>
            Next
          </button>
        </div>
      </div>
    </section>
  )
}

function ApplicationsSection({ applications, redirectTo }: { applications: CsrApplication[]; redirectTo: string }) {
  const [query, setQuery] = useState("")
  const [selectedApplication, setSelectedApplication] = useState<CsrApplication | null>(null)
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const showInsuranceType = !["/micro-lending", "/external-loans"].some((path) => redirectTo.endsWith(path))
  const typeColumnLabel = redirectTo.endsWith("/electronic-contracts") ? "Requested" : "Insurance Type"
  const rows = useMemo(() => {
    const filtered = applications.filter((application) => {
      const text = [application.application_type, application.status, application.members?.full_name ?? "", application.members?.email ?? "", ...Object.values(application.details ?? {})].join(" ").toLowerCase()
      return text.includes(query.toLowerCase()) && (statusFilter === "all" || application.status === statusFilter)
    })
    return [...filtered].sort((left, right) => {
      if (sortBy === "oldest") return new Date(left.submitted_at).getTime() - new Date(right.submitted_at).getTime()
      if (sortBy === "member") return (left.members?.full_name ?? "").localeCompare(right.members?.full_name ?? "")
      if (sortBy === "deduction") return Number(right.monthly_deduction ?? 0) - Number(left.monthly_deduction ?? 0)
      if (sortBy === "status") return left.status.localeCompare(right.status)
      return new Date(right.submitted_at).getTime() - new Date(left.submitted_at).getTime()
    })
  }, [applications, query, sortBy, statusFilter])
  const pagination = paginateRows(rows, page, pageSize)

  return (
    <section id="applications" className="rounded-lg border bg-white p-5 shadow-sm">
      <SectionToolbar title="Application processing" query={query} setQuery={(value) => { setQuery(value); setPage(1) }} onExport={() => exportCsv("csr-applications.csv", rows)} />
      <div className="mb-4 flex flex-wrap gap-2">
        <TableSelect value={statusFilter} onChange={(value) => { setStatusFilter(value); setPage(1) }} options={[["all", "All statuses"], ["submitted", "Submitted"], ["in_review", "In review"], ["more_info_required", "More info required"], ["approved", "Approved"], ["rejected", "Rejected"], ["fulfilled", "Fulfilled"]]} />
        <TableSelect value={sortBy} onChange={(value) => { setSortBy(value); setPage(1) }} options={[["newest", "Newest first"], ["oldest", "Oldest first"], ["member", "Member A-Z"], ["status", "Status A-Z"], ["deduction", "Highest deduction"]]} />
        <PageSizeSelect value={pageSize} onChange={(value) => { setPageSize(value); setPage(1) }} />
      </div>
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Service</th>
              {showInsuranceType && <th className="px-4 py-3">{typeColumnLabel}</th>}
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Deduction</th>
              <th className="px-4 py-3">Pulse</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {pagination.visibleRows.map((application) => (
              <tr key={application.id} className="border-t align-top">
                <td className="px-4 py-3">{application.members?.full_name ?? application.members?.email ?? "Member"}</td>
                <td className="px-4 py-3">{friendlyService(application.application_type)}</td>
                {showInsuranceType && <td className="px-4 py-3 font-medium">{applicationPlanType(application)}</td>}
                <td className="px-4 py-3 capitalize">{application.status.replace(/_/g, " ")}</td>
                <td className="px-4 py-3">
                  <form id={`app-${application.id}`} action="/api/csr/applications/update" method="post" />
                  <input form={`app-${application.id}`} type="hidden" name="applicationId" value={application.id} />
                  <input form={`app-${application.id}`} type="hidden" name="redirectTo" value={redirectTo} />
                  <input form={`app-${application.id}`} className="w-28 rounded-md border px-3 py-2" name="monthlyDeduction" type="number" step="0.01" defaultValue={application.monthly_deduction ?? 0} />
                </td>
                <td className="px-4 py-3">
                  <CasePulse applicationId={application.id} redirectTo={redirectTo} pulses={application.case_pulses ?? []} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 font-semibold text-primary hover:bg-muted" onClick={() => setSelectedApplication(application)}>
                      <Eye className="h-4 w-4" />
                      View details
                    </button>
                    <select form={`app-${application.id}`} className="rounded-md border bg-white px-3 py-2" name="status" defaultValue={application.status}>
                      <option value="submitted">Submitted</option>
                      <option value="in_review">In review</option>
                      <option value="more_info_required">More info required</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="fulfilled">Fulfilled</option>
                    </select>
                    <button form={`app-${application.id}`} className="rounded-md bg-primary px-3 py-2 font-semibold text-primary-foreground">Save</button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <EmptyRow colSpan={showInsuranceType ? 7 : 6} text="No applications found." />}
          </tbody>
        </table>
      </div>
      <PaginationControls {...pagination} label="applications" onPageChange={setPage} />
      {selectedApplication && <ApplicationDetailsModal application={selectedApplication} onClose={() => setSelectedApplication(null)} />}
    </section>
  )
}

function ApplicationDetailsModal({ application, onClose }: { application: CsrApplication; onClose: () => void }) {
  const memberName = application.members?.full_name ?? "Member"
  const detailEntries = Object.entries(application.details ?? {}).filter(([key, value]) => !key.startsWith("__") && value !== null && value !== "")

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-labelledby="application-details-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border bg-slate-50 shadow-2xl">
        <header className="sticky top-0 z-10 border-b bg-white/95 px-5 py-5 backdrop-blur sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileText className="h-6 w-6" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 id="application-details-title" className="text-xl font-bold sm:text-2xl">{friendlyService(application.application_type)}</h3>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${applicationStatusClass(application.status)}`}>
                    {application.status.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">Submitted by {memberName} on {formatDate(application.submitted_at)}</p>
              </div>
            </div>
            <button className="shrink-0 rounded-full border bg-white p-2.5 text-muted-foreground shadow-sm hover:bg-muted hover:text-foreground" onClick={onClose} aria-label="Close application details">
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="space-y-5 p-5 sm:p-7">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ApplicationSummary icon={UserRound} label="Applicant" value={memberName} />
            <ApplicationSummary icon={BadgeCheck} label="Plan / Type" value={applicationPlanType(application)} />
            <ApplicationSummary icon={CircleDollarSign} label="Monthly deduction" value={application.monthly_deduction ? formatCurrency(Number(application.monthly_deduction)) : "Not set"} />
            <ApplicationSummary icon={CalendarDays} label="Term" value={application.term_months ? `${application.term_months} months` : "Not applicable"} />
          </div>

          <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
            <div className="flex items-center gap-2.5 border-b bg-muted/40 px-5 py-4">
              <IdCard className="h-5 w-5 text-primary" />
              <h4 className="font-bold">Submitted application information</h4>
            </div>
            {detailEntries.length > 0 ? (
              <dl className="grid gap-x-6 px-5 sm:grid-cols-2">
                {detailEntries.map(([key, value]) => (
                  <div key={key} className="border-b py-4">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{formatDetailLabel(key)}</dt>
                    <dd className="mt-1.5 whitespace-pre-wrap text-sm font-medium">{formatDetailValue(value)}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="p-5 text-sm text-muted-foreground">No additional form details were submitted.</p>
            )}
          </section>

          <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b bg-muted/40 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <FileText className="h-5 w-5 text-primary" />
                <h4 className="font-bold">Attachments</h4>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">{application.attachments.length}</span>
            </div>
            {application.attachments.length > 0 ? (
              <div className="divide-y">
                {application.attachments.map((document) => (
                  <div key={document.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold">{document.document_type}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Uploaded {formatDate(document.created_at)} | {document.verified_at ? "Verified" : "Awaiting verification"}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <a className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm font-semibold text-primary hover:bg-muted" href={`/api/csr/documents/file?documentId=${encodeURIComponent(document.id)}`} rel="noreferrer" target="_blank">
                        <Eye className="h-4 w-4" />
                        View
                      </a>
                      <a className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm font-semibold hover:bg-muted" href={`/api/csr/documents/file?documentId=${encodeURIComponent(document.id)}&download=1`}>
                        <Download className="h-4 w-4" />
                        Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="p-5 text-sm text-muted-foreground">No attachments were submitted with this application.</p>
            )}
          </section>

          <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
            <div className="flex items-center gap-2.5 border-b bg-muted/40 px-5 py-4">
              <BriefcaseBusiness className="h-5 w-5 text-primary" />
              <h4 className="font-bold">Processing information</h4>
            </div>
            <dl className="grid gap-x-6 px-5 sm:grid-cols-2">
              <ProfileField label="Application service" value={friendlyService(application.application_type)} />
              <ProfileField label="Current status" value={application.status.replace(/_/g, " ")} capitalize />
              <ProfileField label="Requested amount" value={application.requested_amount ? formatCurrency(Number(application.requested_amount)) : "Not applicable"} />
              <ProfileField label="Monthly deduction" value={application.monthly_deduction ? formatCurrency(Number(application.monthly_deduction)) : "Not set"} />
              <ProfileField label="Term" value={application.term_months ? `${application.term_months} months` : "Not applicable"} />
              <ProfileField label="Submitted date" value={formatDate(application.submitted_at)} />
            </dl>
          </section>
        </div>

        <footer className="sticky bottom-0 flex justify-end border-t bg-white/95 px-5 py-4 backdrop-blur sm:px-7">
          <button className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90" onClick={onClose}>Close details</button>
        </footer>
      </div>
    </div>
  )
}

function ApplicationSummary({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-bold">{value}</p>
    </div>
  )
}

function applicationPlanType(application: CsrApplication) {
  const details = application.details ?? {}
  const value = details.coverLevel ?? details.legalAidPlan ?? details.loanType ?? details.product
  return typeof value === "string" && value.trim() ? value : friendlyService(application.application_type)
}

function formatDetailLabel(key: string) {
  return key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatDetailValue(value: unknown) {
  if (Array.isArray(value)) return value.join(", ")
  if (value && typeof value === "object") return JSON.stringify(value, null, 2)
  return String(value)
}

function applicationStatusClass(status: string) {
  switch (status) {
    case "approved":
    case "fulfilled":
      return "bg-emerald-100 text-emerald-800"
    case "submitted":
      return "bg-blue-100 text-blue-800"
    case "in_review":
    case "more_info_required":
      return "bg-amber-100 text-amber-800"
    case "rejected":
      return "bg-red-100 text-red-800"
    default:
      return "bg-slate-100 text-slate-700"
  }
}

function PaymentsSection({ payments }: { payments: CsrPayment[] }) {
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const rows = useMemo(() => {
    const filtered = payments.filter((payment) => {
      const text = [payment.description, payment.status, payment.currency, payment.members?.full_name ?? "", payment.members?.email ?? ""].join(" ").toLowerCase()
      return text.includes(query.toLowerCase()) && (statusFilter === "all" || payment.status === statusFilter)
    })
    return [...filtered].sort((left, right) => {
      if (sortBy === "oldest") return new Date(left.created_at).getTime() - new Date(right.created_at).getTime()
      if (sortBy === "member") return (left.members?.full_name ?? "").localeCompare(right.members?.full_name ?? "")
      if (sortBy === "amount-high") return Number(right.amount) - Number(left.amount)
      if (sortBy === "amount-low") return Number(left.amount) - Number(right.amount)
      return new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
    })
  }, [payments, query, sortBy, statusFilter])
  const pagination = paginateRows(rows, page, pageSize)
  return (
    <section className="rounded-lg border bg-white p-5 shadow-sm">
      <SectionToolbar title="Payment records" query={query} setQuery={(value) => { setQuery(value); setPage(1) }} onExport={() => exportCsv("csr-payments.csv", rows)} />
      <div className="mb-4 flex flex-wrap gap-2">
        <TableSelect value={statusFilter} onChange={(value) => { setStatusFilter(value); setPage(1) }} options={[["all", "All statuses"], ["pending", "Pending"], ["paid", "Paid"], ["failed", "Failed"], ["refunded", "Refunded"]]} />
        <TableSelect value={sortBy} onChange={(value) => { setSortBy(value); setPage(1) }} options={[["newest", "Newest first"], ["oldest", "Oldest first"], ["member", "Member A-Z"], ["amount-high", "Highest amount"], ["amount-low", "Lowest amount"]]} />
        <PageSizeSelect value={pageSize} onChange={(value) => { setPageSize(value); setPage(1) }} />
      </div>
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr><th className="px-4 py-3">Member</th><th className="px-4 py-3">Description</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Status</th></tr>
          </thead>
          <tbody>
            {pagination.visibleRows.map((payment) => (
              <tr key={payment.id} className="border-t"><td className="px-4 py-3">{payment.members?.full_name ?? payment.members?.email ?? "Member"}</td><td className="px-4 py-3">{payment.description}</td><td className="px-4 py-3">{formatCurrency(Number(payment.amount), payment.currency)}</td><td className="px-4 py-3 capitalize">{payment.status}</td></tr>
            ))}
            {rows.length === 0 && <EmptyRow colSpan={4} text="No payment records found." />}
          </tbody>
        </table>
      </div>
      <PaginationControls {...pagination} label="payments" onPageChange={setPage} />
    </section>
  )
}

function ComplaintsSection({ complaints }: { complaints: CsrComplaint[] }) {
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const rows = useMemo(() => {
    const filtered = complaints.filter((complaint) => {
      const text = [complaint.subject, complaint.category, complaint.priority, complaint.status, complaint.members?.full_name ?? "", complaint.resolution_notes ?? ""].join(" ").toLowerCase()
      return text.includes(query.toLowerCase()) &&
        (statusFilter === "all" || complaint.status === statusFilter) &&
        (priorityFilter === "all" || complaint.priority === priorityFilter)
    })
    const priorityRank: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 }
    return [...filtered].sort((left, right) => {
      if (sortBy === "oldest") return new Date(left.created_at).getTime() - new Date(right.created_at).getTime()
      if (sortBy === "member") return (left.members?.full_name ?? "").localeCompare(right.members?.full_name ?? "")
      if (sortBy === "priority") return (priorityRank[right.priority] ?? 0) - (priorityRank[left.priority] ?? 0)
      if (sortBy === "status") return left.status.localeCompare(right.status)
      return new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
    })
  }, [complaints, priorityFilter, query, sortBy, statusFilter])
  const pagination = paginateRows(rows, page, pageSize)
  return (
    <section id="complaints" className="rounded-lg border bg-white p-5 shadow-sm">
      <SectionToolbar title="Complaints follow-up" query={query} setQuery={(value) => { setQuery(value); setPage(1) }} onExport={() => exportCsv("csr-complaints.csv", rows)} />
      <div className="mb-4 flex flex-wrap gap-2">
        <TableSelect value={statusFilter} onChange={(value) => { setStatusFilter(value); setPage(1) }} options={[["all", "All statuses"], ["open", "Open"], ["in_review", "In review"], ["resolved", "Resolved"], ["closed", "Closed"]]} />
        <TableSelect value={priorityFilter} onChange={(value) => { setPriorityFilter(value); setPage(1) }} options={[["all", "All priorities"], ["urgent", "Urgent"], ["high", "High"], ["medium", "Medium"], ["low", "Low"]]} />
        <TableSelect value={sortBy} onChange={(value) => { setSortBy(value); setPage(1) }} options={[["newest", "Newest first"], ["oldest", "Oldest first"], ["member", "Member A-Z"], ["priority", "Highest priority"], ["status", "Status A-Z"]]} />
        <PageSizeSelect value={pageSize} onChange={(value) => { setPageSize(value); setPage(1) }} />
      </div>
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr><th className="px-4 py-3">Member</th><th className="px-4 py-3">Subject</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Priority</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Resolution notes</th><th className="px-4 py-3">Action</th></tr>
          </thead>
          <tbody>
            {pagination.visibleRows.map((complaint) => (
              <tr key={complaint.id} className="border-t align-top">
                <td className="px-4 py-3">{complaint.members?.full_name ?? complaint.members?.email ?? "Member"}</td>
                <td className="px-4 py-3 font-semibold">{complaint.subject}</td>
                <td className="px-4 py-3">{complaint.category}</td>
                <td className="px-4 py-3 capitalize">{complaint.priority}</td>
                <td className="px-4 py-3 capitalize">{complaint.status.replace(/_/g, " ")}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{complaint.resolution_notes || "No notes yet."}</td>
                <td className="px-4 py-3">
                  <form action="/api/csr/complaints/update" method="post" className="grid min-w-72 gap-2">
                    <input type="hidden" name="complaintId" value={complaint.id} />
                    <input type="hidden" name="redirectTo" value="/csr/complaints" />
                    <div className="flex gap-2">
                      <select className="rounded-md border bg-white px-3 py-2" name="priority" defaultValue={complaint.priority}>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                      <select className="rounded-md border bg-white px-3 py-2" name="status" defaultValue={complaint.status}>
                        <option value="open">Open</option>
                        <option value="in_review">In review</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                    <textarea className="min-h-20 rounded-md border px-3 py-2" name="resolutionNotes" defaultValue={complaint.resolution_notes ?? ""} placeholder="Resolution notes" />
                    <button className="rounded-md bg-primary px-3 py-2 font-semibold text-primary-foreground">Save</button>
                  </form>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <EmptyRow colSpan={7} text="No complaints found." />}
          </tbody>
        </table>
      </div>
      <PaginationControls {...pagination} label="complaints" onPageChange={setPage} />
    </section>
  )
}

function TableSelect({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: Array<[string, string]> }) {
  return (
    <select className="rounded-md border bg-white px-3 py-2 text-sm font-medium" value={value} onChange={(event) => onChange(event.target.value)}>
      {options.map(([optionValue, label]) => <option key={optionValue} value={optionValue}>{label}</option>)}
    </select>
  )
}

function PageSizeSelect({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <select className="rounded-md border bg-white px-3 py-2 text-sm font-medium" value={value} onChange={(event) => onChange(Number(event.target.value))}>
      <option value={10}>10 per page</option>
      <option value={25}>25 per page</option>
      <option value={50}>50 per page</option>
    </select>
  )
}

function paginateRows<T>(rows: T[], page: number, pageSize: number) {
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pageStart = (currentPage - 1) * pageSize
  return {
    visibleRows: rows.slice(pageStart, pageStart + pageSize),
    currentPage,
    pageCount,
    showingStart: rows.length === 0 ? 0 : pageStart + 1,
    showingEnd: Math.min(pageStart + pageSize, rows.length),
    totalRows: rows.length,
  }
}

function PaginationControls({ currentPage, pageCount, showingStart, showingEnd, totalRows, label, onPageChange }: ReturnType<typeof paginateRows<unknown>> & { label: string; onPageChange: (page: number) => void }) {
  return (
    <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <p>Showing {showingStart}-{showingEnd} of {totalRows} {label}</p>
      <div className="flex items-center gap-2">
        <button className="rounded-md border bg-white px-3 py-2 font-semibold text-foreground hover:bg-muted disabled:opacity-40" disabled={currentPage === 1} onClick={() => onPageChange(Math.max(1, currentPage - 1))}>Previous</button>
        <span className="px-2 font-semibold text-foreground">Page {currentPage} of {pageCount}</span>
        <button className="rounded-md border bg-white px-3 py-2 font-semibold text-foreground hover:bg-muted disabled:opacity-40" disabled={currentPage === pageCount} onClick={() => onPageChange(Math.min(pageCount, currentPage + 1))}>Next</button>
      </div>
    </div>
  )
}

function SectionToolbar({ title, query, setQuery, onExport }: { title: string; query: string; setQuery: (value: string) => void; onExport: () => void }) {
  return (
    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="flex flex-wrap gap-2">
        <label className="flex items-center gap-2 rounded-md border bg-white px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input className="w-64 bg-transparent text-sm outline-none" placeholder="Search" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <button className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm font-semibold hover:bg-muted" onClick={onExport}>
          <Download className="h-4 w-4" />
          Export
        </button>
      </div>
    </div>
  )
}

function EmptyRow({ colSpan, text }: { colSpan: number; text: string }) {
  return <tr><td className="px-4 py-6 text-muted-foreground" colSpan={colSpan}>{text}</td></tr>
}

function exportCsv(fileName: string, rows: unknown[]) {
  const normalizedRows = rows.map((row) => flatten(row as Record<string, unknown>))
  const headers = Array.from(new Set(normalizedRows.flatMap((row) => Object.keys(row))))
  const csv = [headers.join(","), ...normalizedRows.map((row) => headers.map((header) => escapeCsv(row[header])).join(","))].join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}

function flatten(row: Record<string, unknown>) {
  const flat: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      for (const [nestedKey, nestedValue] of Object.entries(value as Record<string, unknown>)) {
        flat[`${key}_${nestedKey}`] = nestedValue
      }
    } else {
      flat[key] = value
    }
  }
  return flat
}

function escapeCsv(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`
}
