"use client"

import { useMemo, useState } from "react"
import { ArrowDownUp, Download, KeyRound, Search, Trash2, UserRoundCheck } from "lucide-react"
import type { StaffUser } from "@/lib/admin-reports"

export function AdminUsersTable({ users }: { users: StaffUser[] }) {
  const [query, setQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [sortKey, setSortKey] = useState<keyof StaffUser>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const visibleUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return users
      .filter((user) => {
        const matchesSearch =
          !normalizedQuery ||
          [user.name, user.email, user.role, user.user_id].some((value) => value.toLowerCase().includes(normalizedQuery))
        const matchesRole = roleFilter === "all" || user.role === roleFilter

        return matchesSearch && matchesRole
      })
      .sort((left, right) => {
        const result = String(left[sortKey]).localeCompare(String(right[sortKey]), undefined, {
          numeric: true,
          sensitivity: "base",
        })

        return sortDirection === "asc" ? result : -result
      })
  }, [query, roleFilter, sortDirection, sortKey, users])

  function updateSort(key: keyof StaffUser) {
    if (sortKey === key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"))
      return
    }

    setSortKey(key)
    setSortDirection("asc")
  }

  function exportCsv() {
    const header = ["Name", "Email", "Role", "User ID"]
    const rows = visibleUsers.map((user) => [user.name, user.email, user.role, user.user_id])
    const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "bonu-staff-users.csv"
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
            placeholder="Search staff users"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <select
            className="rounded-md border bg-white px-3 py-2 text-sm font-medium"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
          >
            <option value="all">All roles</option>
            <option value="admin">Admin</option>
            <option value="csr">CSR</option>
            <option value="member">Member</option>
          </select>
          <button className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm font-semibold hover:bg-muted" onClick={exportCsv}>
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <SortableHeader label="Name" onClick={() => updateSort("name")} />
              <SortableHeader label="Email" onClick={() => updateSort("email")} />
              <SortableHeader label="Role" onClick={() => updateSort("role")} />
              <th className="px-4 py-3 font-semibold">Reset password</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleUsers.length > 0 ? (
              visibleUsers.map((user) => {
                const editFormId = `edit-${user.user_id}`

                return (
                  <tr key={user.user_id} className="border-t align-top">
                    <td className="px-4 py-3">
                      <form id={editFormId} action="/api/admin/users/update" method="post" />
                      <input form={editFormId} type="hidden" name="userId" value={user.user_id} />
                      <input form={editFormId} className="w-full rounded-md border px-3 py-2 font-medium outline-none" name="fullName" defaultValue={user.name} required />
                      <p className="font-mono text-xs text-muted-foreground">{user.user_id}</p>
                    </td>
                    <td className="px-4 py-3">
                      <input form={editFormId} className="w-full rounded-md border px-3 py-2 outline-none" name="email" type="email" defaultValue={user.email} required />
                    </td>
                    <td className="px-4 py-3">
                      <select form={editFormId} className="w-full rounded-md border bg-white px-3 py-2 outline-none" name="role" defaultValue={user.role}>
                        <option value="member">Member</option>
                        <option value="csr">CSR</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <form action="/api/admin/users/reset-password" method="post" className="space-y-2">
                        <input type="hidden" name="userId" value={user.user_id} />
                        <input className="w-full rounded-md border px-3 py-2 outline-none" name="password" type="password" placeholder="New password" required />
                        <button className="inline-flex w-full items-center justify-center gap-2 rounded-md border bg-white px-3 py-2 font-semibold hover:bg-muted">
                          <KeyRound className="h-4 w-4" />
                          Reset
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-3">
                      <button form={editFormId} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 font-semibold text-primary-foreground hover:bg-primary/90">
                        <UserRoundCheck className="h-4 w-4" />
                        Save
                      </button>
                      <form action="/api/admin/users/delete" method="post" className="mt-2">
                        <input type="hidden" name="userId" value={user.user_id} />
                        <button className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 font-semibold text-red-950 hover:bg-red-100">
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </form>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={5}>
                  No staff users found.
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
