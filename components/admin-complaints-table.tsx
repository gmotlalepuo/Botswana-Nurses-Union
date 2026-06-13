"use client"

import { useMemo, useState } from "react"
import { ArrowDownUp, Download, Save, Search } from "lucide-react"
import type { ComplaintRow } from "@/lib/admin-complaints"

export function AdminComplaintsTable({ complaints }: { complaints: ComplaintRow[] }) {
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [sortKey, setSortKey] = useState<keyof ComplaintRow>("created_at")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  const visibleComplaints = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return complaints
      .filter((complaint) => {
        const member = complaint.members?.full_name ?? complaint.members?.email ?? ""
        const matchesSearch =
          !normalizedQuery ||
          [complaint.subject, complaint.category, complaint.description, complaint.status, complaint.priority, member].some((value) =>
            value.toLowerCase().includes(normalizedQuery),
          )
        const matchesStatus = statusFilter === "all" || complaint.status === statusFilter
        const matchesPriority = priorityFilter === "all" || complaint.priority === priorityFilter

        return matchesSearch && matchesStatus && matchesPriority
      })
      .sort((left, right) => {
        const result = String(left[sortKey] ?? "").localeCompare(String(right[sortKey] ?? ""), undefined, {
          numeric: true,
          sensitivity: "base",
        })

        return sortDirection === "asc" ? result : -result
      })
  }, [complaints, priorityFilter, query, sortDirection, sortKey, statusFilter])

  function updateSort(key: keyof ComplaintRow) {
    if (sortKey === key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"))
      return
    }

    setSortKey(key)
    setSortDirection("asc")
  }

  function exportCsv() {
    const header = ["Subject", "Member", "Category", "Priority", "Status", "Description", "Resolution"]
    const rows = visibleComplaints.map((complaint) => [
      complaint.subject,
      complaint.members?.full_name ?? complaint.members?.email ?? "Unassigned",
      complaint.category,
      complaint.priority,
      complaint.status,
      complaint.description,
      complaint.resolution_notes ?? "",
    ])
    const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "bonu-complaints.csv"
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-md border bg-white px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            className="w-full bg-transparent text-sm outline-none"
            placeholder="Search complaints"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <select className="rounded-md border bg-white px-3 py-2 text-sm font-medium" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All statuses</option>
            <option value="open">Open</option>
            <option value="in_review">In review</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select className="rounded-md border bg-white px-3 py-2 text-sm font-medium" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
            <option value="all">All priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <button className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm font-semibold hover:bg-muted" onClick={exportCsv}>
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <SortableHeader label="Subject" onClick={() => updateSort("subject")} />
              <th className="px-4 py-3 font-semibold">Member</th>
              <SortableHeader label="Category" onClick={() => updateSort("category")} />
              <SortableHeader label="Priority" onClick={() => updateSort("priority")} />
              <SortableHeader label="Status" onClick={() => updateSort("status")} />
              <th className="px-4 py-3 font-semibold">Resolution notes</th>
              <th className="px-4 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {visibleComplaints.length > 0 ? (
              visibleComplaints.map((complaint) => {
                const formId = `complaint-${complaint.id}`

                return (
                  <tr key={complaint.id} className="border-t align-top">
                    <td className="px-4 py-3">
                      <input form={formId} type="hidden" name="action" value="update" />
                      <input form={formId} type="hidden" name="complaintId" value={complaint.id} />
                      <p className="font-bold">{complaint.subject}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{complaint.description}</p>
                    </td>
                    <td className="px-4 py-3">{complaint.members?.full_name ?? complaint.members?.email ?? "Unassigned"}</td>
                    <td className="px-4 py-3">{complaint.category}</td>
                    <td className="px-4 py-3">
                      <select form={formId} className="w-full rounded-md border bg-white px-3 py-2 outline-none" name="priority" defaultValue={complaint.priority}>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select form={formId} className="w-full rounded-md border bg-white px-3 py-2 outline-none" name="status" defaultValue={complaint.status}>
                        <option value="open">Open</option>
                        <option value="in_review">In review</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <textarea
                        form={formId}
                        className="min-h-20 w-full rounded-md border px-3 py-2 outline-none"
                        name="resolutionNotes"
                        defaultValue={complaint.resolution_notes ?? ""}
                        placeholder="Resolution notes"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <form id={formId} action="/api/admin/complaints" method="post" />
                      <button form={formId} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 font-semibold text-primary-foreground hover:bg-primary/90">
                        <Save className="h-4 w-4" />
                        Save
                      </button>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={7}>
                  No complaints found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SortableHeader({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <th className="px-4 py-3 font-semibold">
      <button className="inline-flex items-center gap-2 text-left" onClick={onClick}>
        {label}
        <ArrowDownUp className="h-3.5 w-3.5" />
      </button>
    </th>
  )
}

function escapeCsv(value: string) {
  return `"${value.replace(/"/g, '""')}"`
}
