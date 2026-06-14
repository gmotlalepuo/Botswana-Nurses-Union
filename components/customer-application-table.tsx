"use client"

import { useMemo, useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { Eye, FileText, Search, X } from "lucide-react"
import { CasePulse } from "@/components/case-pulse"
import { StatusBadge } from "@/components/status-badge"
import type { MemberApplication } from "@/lib/member-data"
import { formatCurrency, friendlyService } from "@/lib/member-data"

export function CustomerApplicationTable({ title, applications }: { title: string; applications: MemberApplication[] }) {
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [serviceFilter, setServiceFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedApplication, setSelectedApplication] = useState<MemberApplication | null>(null)
  const services = useMemo(() => Array.from(new Set(applications.map((application) => application.application_type))).sort(), [applications])

  const rows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return applications
      .filter((application) => {
        const text = [friendlyService(application.application_type), application.status, ...Object.values(application.details ?? {})].join(" ").toLowerCase()
        return (!normalizedQuery || text.includes(normalizedQuery)) &&
          (statusFilter === "all" || application.status === statusFilter) &&
          (serviceFilter === "all" || application.application_type === serviceFilter)
      })
      .sort((left, right) => {
        if (sortBy === "oldest") return new Date(left.submitted_at).getTime() - new Date(right.submitted_at).getTime()
        if (sortBy === "service") return friendlyService(left.application_type).localeCompare(friendlyService(right.application_type))
        if (sortBy === "status") return left.status.localeCompare(right.status)
        if (sortBy === "deduction") return Number(right.monthly_deduction ?? 0) - Number(left.monthly_deduction ?? 0)
        return new Date(right.submitted_at).getTime() - new Date(left.submitted_at).getTime()
      })
  }, [applications, query, serviceFilter, sortBy, statusFilter])

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pageStart = (currentPage - 1) * pageSize
  const visibleRows = rows.slice(pageStart, pageStart + pageSize)

  return (
    <section className="min-w-0 rounded-lg border bg-white p-5 shadow-sm">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-[1fr_11rem_12rem_12rem_10rem]">
        <label className="flex items-center gap-2 rounded-md border bg-white px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input className="w-full bg-transparent text-sm outline-none" placeholder="Search applications" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} />
        </label>
        <select className="rounded-md border bg-white px-3 py-2 text-sm font-medium" value={serviceFilter} onChange={(event) => { setServiceFilter(event.target.value); setPage(1) }}>
          <option value="all">All services</option>
          {services.map((service) => <option key={service} value={service}>{friendlyService(service)}</option>)}
        </select>
        <select className="rounded-md border bg-white px-3 py-2 text-sm font-medium" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1) }}>
          <option value="all">All statuses</option>
          <option value="submitted">Submitted</option>
          <option value="in_review">In review</option>
          <option value="more_info_required">More info required</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="fulfilled">Fulfilled</option>
        </select>
        <select className="rounded-md border bg-white px-3 py-2 text-sm font-medium" value={sortBy} onChange={(event) => { setSortBy(event.target.value); setPage(1) }}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="service">Service A-Z</option>
          <option value="status">Status A-Z</option>
          <option value="deduction">Highest deduction</option>
        </select>
        <select className="rounded-md border bg-white px-3 py-2 text-sm font-medium" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }}>
          <option value={10}>10 per page</option>
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
        </select>
      </div>

      <div className="mt-4 max-w-full overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Monthly deduction</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Pulse</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((application) => (
              <tr key={application.id} className="border-t align-top">
                <td className="px-4 py-3 font-semibold">{friendlyService(application.application_type)}</td>
                <td className="px-4 py-3"><StatusBadge status={application.status} /></td>
                <td className="px-4 py-3">{application.monthly_deduction ? formatCurrency(Number(application.monthly_deduction)) : "Not set"}</td>
                <td className="px-4 py-3">{new Date(application.submitted_at).toLocaleDateString()}</td>
                <td className="px-4 py-3"><CasePulse applicationId={application.id} redirectTo={getPortalRedirect(application.application_type)} pulses={application.case_pulses ?? []} /></td>
                <td className="px-4 py-3">
                  <button className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 font-semibold text-primary hover:bg-muted" onClick={() => setSelectedApplication(application)}>
                    <Eye className="h-4 w-4" />
                    View details
                  </button>
                </td>
              </tr>
            ))}
            {visibleRows.length === 0 && <tr><td className="px-4 py-6 text-muted-foreground" colSpan={6}>No applications match your filters.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>Showing {rows.length === 0 ? 0 : pageStart + 1}-{Math.min(pageStart + pageSize, rows.length)} of {rows.length} applications</p>
        <div className="flex items-center gap-2">
          <button className="rounded-md border px-3 py-2 font-semibold text-foreground disabled:opacity-40" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button>
          <span className="px-2 font-semibold text-foreground">Page {currentPage} of {pageCount}</span>
          <button className="rounded-md border px-3 py-2 font-semibold text-foreground disabled:opacity-40" disabled={currentPage === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Next</button>
        </div>
      </div>

      {selectedApplication && <CustomerApplicationDetailsModal application={selectedApplication} onClose={() => setSelectedApplication(null)} />}
    </section>
  )
}

export function CustomerApplicationDetailsModal({ application, onClose }: { application: MemberApplication; onClose: () => void }) {
  const details = Object.entries(application.details ?? {}).filter(([key, value]) => !key.startsWith("__") && value !== null && value !== "")

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[200] bg-slate-950/60 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[201] max-h-[92dvh] w-[calc(100vw-1.5rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-slate-50 shadow-2xl focus:outline-none"
          aria-describedby="customer-application-description"
        >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b bg-white/95 px-5 py-5 backdrop-blur sm:px-7">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><FileText className="h-5 w-5" /></span>
            <div>
              <Dialog.Title className="text-xl font-bold">{friendlyService(application.application_type)}</Dialog.Title>
              <Dialog.Description id="customer-application-description" className="mt-1 text-sm text-muted-foreground">
                Submitted {new Date(application.submitted_at).toLocaleDateString()}
              </Dialog.Description>
            </div>
          </div>
          <Dialog.Close asChild>
            <button className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border bg-white text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close details" type="button">
              <X className="h-5 w-5" />
            </button>
          </Dialog.Close>
        </header>

        <div className="space-y-5 p-5 sm:p-7">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <DetailCard label="Status"><StatusBadge status={application.status} /></DetailCard>
            <DetailCard label="Requested amount">{application.requested_amount ? formatCurrency(Number(application.requested_amount)) : "Not applicable"}</DetailCard>
            <DetailCard label="Monthly deduction">{application.monthly_deduction ? formatCurrency(Number(application.monthly_deduction)) : "Not set"}</DetailCard>
            <DetailCard label="Term">{application.term_months ? `${application.term_months} months` : "Not applicable"}</DetailCard>
          </div>

          <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
            <div className="border-b bg-muted/40 px-5 py-4"><h4 className="font-bold">Submitted information</h4></div>
            {details.length > 0 ? (
              <dl className="grid gap-x-6 px-5 sm:grid-cols-2">
                {details.map(([key, value]) => (
                  <div key={key} className="border-b py-4">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{formatDetailLabel(key)}</dt>
                    <dd className="mt-1.5 whitespace-pre-wrap text-sm font-medium">{formatDetailValue(value)}</dd>
                  </div>
                ))}
              </dl>
            ) : <p className="p-5 text-sm text-muted-foreground">No additional application details were submitted.</p>}
          </section>
        </div>

        <footer className="sticky bottom-0 flex justify-end border-t bg-white/95 px-5 py-4 backdrop-blur sm:px-7">
          <Dialog.Close asChild>
            <button className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground" type="button">Close details</button>
          </Dialog.Close>
        </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function DetailCard({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="rounded-xl border bg-white p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><div className="mt-2 text-sm font-bold">{children}</div></div>
}

function formatDetailLabel(key: string) {
  return key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatDetailValue(value: unknown) {
  if (Array.isArray(value)) return value.join(", ")
  if (value && typeof value === "object") return JSON.stringify(value, null, 2)
  return String(value)
}

function getPortalRedirect(applicationType: string) {
  const redirects: Record<string, string> = {
    electronic_contract: "/portal/electronic-contracts",
    funeral_insurance: "/portal/funeral-insurance",
    legal_aid: "/portal/legal-aid",
    loan_assistance: "/portal/external-loans",
    merchandise: "/portal/merchandise",
    micro_loan: "/portal/micro-lending",
    bundle: "/portal/bundles",
  }
  return redirects[applicationType] ?? "/portal"
}
