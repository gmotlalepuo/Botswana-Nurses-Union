"use client"

import { useMemo, useState } from "react"
import { Eye, Search } from "lucide-react"
import { CasePulse } from "@/components/case-pulse"
import { CustomerApplicationDetailsModal } from "@/components/customer-application-table"
import { StatusBadge } from "@/components/status-badge"
import type { MemberApplication } from "@/lib/member-data"
import { formatCurrency } from "@/lib/member-data"

export function ElectronicContractHistory({ applications }: { applications: MemberApplication[] }) {
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sort, setSort] = useState("newest")
  const [page, setPage] = useState(1)
  const [selectedApplication, setSelectedApplication] = useState<MemberApplication | null>(null)
  const pageSize = 8
  const visibleApplications = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return applications
      .filter((application) => {
        const details = application.details ?? {}
        const text = [
          "Electronic Contract",
          application.status,
          displayProduct(application),
          String(details.brandModel ?? ""),
          String(application.requested_amount ?? ""),
          String(application.monthly_deduction ?? ""),
        ].join(" ").toLowerCase()
        const matchesQuery = !normalizedQuery || text.includes(normalizedQuery)
        const matchesStatus = statusFilter === "all" || application.status === statusFilter
        return matchesQuery && matchesStatus
      })
      .sort((left, right) => {
        if (sort === "oldest") return new Date(left.submitted_at).getTime() - new Date(right.submitted_at).getTime()
        if (sort === "balance-high") return balanceLeft(right) - balanceLeft(left)
        if (sort === "balance-low") return balanceLeft(left) - balanceLeft(right)
        if (sort === "monthly-high") return Number(right.monthly_deduction ?? 0) - Number(left.monthly_deduction ?? 0)
        if (sort === "monthly-low") return Number(left.monthly_deduction ?? 0) - Number(right.monthly_deduction ?? 0)
        if (sort === "status") return left.status.localeCompare(right.status)
        return new Date(right.submitted_at).getTime() - new Date(left.submitted_at).getTime()
      })
  }, [applications, query, sort, statusFilter])
  const pageCount = Math.max(1, Math.ceil(visibleApplications.length / pageSize))
  const pagedApplications = visibleApplications.slice((page - 1) * pageSize, page * pageSize)

  return (
    <section className="rounded-lg border bg-white p-5 shadow-sm">
      <h2 className="text-xl font-bold">Electronic contract status</h2>
      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_12rem_14rem]">
        <label className="flex items-center gap-2 rounded-md border bg-white px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input className="w-full bg-transparent text-sm outline-none" placeholder="Search product, model, amount, status" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} />
        </label>
        <select className="rounded-md border bg-white px-3 py-2 text-sm font-medium" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1) }}>
          <option value="all">All statuses</option>
          <option value="submitted">Submitted</option>
          <option value="in_review">In review</option>
          <option value="more_info_required">More info required</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="fulfilled">Fulfilled</option>
        </select>
        <select className="rounded-md border bg-white px-3 py-2 text-sm font-medium" value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="balance-high">Balance high to low</option>
          <option value="balance-low">Balance low to high</option>
          <option value="monthly-high">Monthly high to low</option>
          <option value="monthly-low">Monthly low to high</option>
          <option value="status">Status</option>
        </select>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Balance left</th>
              <th className="px-4 py-3">Monthly deduction</th>
              <th className="px-4 py-3">Term</th>
              <th className="px-4 py-3">Pulse</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {pagedApplications.map((application) => (
              <tr key={application.id} className="border-t">
                <td className="px-4 py-3">Electronic Contract</td>
                <td className="px-4 py-3">
                  <p className="font-semibold">{displayProduct(application)}</p>
                  {application.details?.brandModel ? <p className="text-xs text-muted-foreground">{String(application.details.brandModel)}</p> : null}
                </td>
                <td className="px-4 py-3"><StatusBadge status={application.status} /></td>
                <td className="px-4 py-3">{new Date(application.submitted_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">{formatCurrency(balanceLeft(application))}</td>
                <td className="px-4 py-3">{application.monthly_deduction ? formatCurrency(Number(application.monthly_deduction)) : "N/A"}</td>
                <td className="px-4 py-3">{application.term_months ? `${application.term_months} months` : "N/A"}</td>
                <td className="px-4 py-3">
                  <CasePulse applicationId={application.id} redirectTo="/portal/electronic-contracts" pulses={application.case_pulses ?? []} />
                </td>
                <td className="px-4 py-3">
                  <button className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 font-semibold text-primary hover:bg-muted" onClick={() => setSelectedApplication(application)}>
                    <Eye className="h-4 w-4" />
                    View details
                  </button>
                </td>
              </tr>
            ))}
            {pagedApplications.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={9}>No electronic contract applications found.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border bg-white p-3">
        <p className="text-sm text-muted-foreground">Page {page} of {pageCount} - {visibleApplications.length} contracts</p>
        <div className="flex gap-2">
          <button className="rounded-md border bg-white px-3 py-2 text-sm font-semibold disabled:opacity-40" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button>
          <button className="rounded-md border bg-white px-3 py-2 text-sm font-semibold disabled:opacity-40" disabled={page === pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>Next</button>
        </div>
      </div>
      {selectedApplication && <CustomerApplicationDetailsModal application={selectedApplication} onClose={() => setSelectedApplication(null)} />}
    </section>
  )
}

function balanceLeft(application: MemberApplication) {
  if (application.status === "fulfilled") {
    return 0
  }

  return Number(application.requested_amount ?? 0)
}

function displayProduct(application: MemberApplication) {
  const product = String(application.details?.product ?? "Device")
  const otherProductName = String(application.details?.otherProductName ?? "").trim()

  return product === "Other approved electronic device" && otherProductName ? otherProductName : product
}
