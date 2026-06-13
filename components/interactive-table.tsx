"use client"

import { useMemo, useState } from "react"
import { ArrowDownUp, Download, Search } from "lucide-react"
import { StatusBadge } from "@/components/status-badge"

export type TableColumn = {
  key: string
  label: string
  filterable?: boolean
}

type InteractiveTableProps = {
  columns: TableColumn[]
  rows: Record<string, string | number | null | undefined>[]
  emptyMessage: string
  exportFileName: string
}

export function InteractiveTable({ columns, rows, emptyMessage, exportFileName }: InteractiveTableProps) {
  const [query, setQuery] = useState("")
  const [filterKey, setFilterKey] = useState("all")
  const [filterValue, setFilterValue] = useState("all")
  const [sortKey, setSortKey] = useState(columns[0]?.key ?? "")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const filterableColumns = columns.filter((column) => column.filterable)
  const filterOptions = useMemo(() => {
    if (filterKey === "all") {
      return []
    }

    return Array.from(new Set(rows.map((row) => String(row[filterKey] ?? "")).filter(Boolean))).sort()
  }, [filterKey, rows])

  const visibleRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return rows
      .filter((row) => {
        const matchesSearch =
          !normalizedQuery ||
          columns.some((column) => String(row[column.key] ?? "").toLowerCase().includes(normalizedQuery))
        const matchesFilter = filterKey === "all" || filterValue === "all" || String(row[filterKey] ?? "") === filterValue

        return matchesSearch && matchesFilter
      })
      .sort((left, right) => {
        const leftValue = String(left[sortKey] ?? "")
        const rightValue = String(right[sortKey] ?? "")
        const result = leftValue.localeCompare(rightValue, undefined, { numeric: true, sensitivity: "base" })

        return sortDirection === "asc" ? result : -result
      })
  }, [columns, filterKey, filterValue, query, rows, sortDirection, sortKey])

  function updateSort(key: string) {
    if (sortKey === key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"))
      return
    }

    setSortKey(key)
    setSortDirection("asc")
  }

  function exportCsv() {
    const csvRows = [
      columns.map((column) => escapeCsv(column.label)).join(","),
      ...visibleRows.map((row) => columns.map((column) => escapeCsv(row[column.key])).join(",")),
    ]
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = exportFileName
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-w-0">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-md border bg-white/85 px-3 py-2 shadow-sm backdrop-blur">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            className="w-full bg-transparent text-sm outline-none"
            placeholder="Search table"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <select
            className="rounded-md border bg-white/85 px-3 py-2 text-sm font-medium shadow-sm"
            value={filterKey}
            onChange={(event) => {
              setFilterKey(event.target.value)
              setFilterValue("all")
            }}
          >
            <option value="all">No filter</option>
            {filterableColumns.map((column) => (
              <option key={column.key} value={column.key}>
                Filter by {column.label}
              </option>
            ))}
          </select>
          {filterKey !== "all" && (
            <select
              className="rounded-md border bg-white/85 px-3 py-2 text-sm font-medium shadow-sm"
              value={filterValue}
              onChange={(event) => setFilterValue(event.target.value)}
            >
              <option value="all">All</option>
              {filterOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )}
          <button className="inline-flex items-center gap-2 rounded-md border bg-white/85 px-3 py-2 text-sm font-semibold shadow-sm hover:border-primary/30 hover:bg-white" onClick={exportCsv}>
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto rounded-lg border bg-white/72 shadow-sm backdrop-blur">
        <table
          className="w-full text-left text-sm"
          style={{ minWidth: `${Math.max(680, columns.length * 180)}px` }}
        >
          <thead className="bg-muted text-muted-foreground">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="whitespace-nowrap px-4 py-3 font-semibold">
                  <button className="inline-flex items-center gap-2 text-left" onClick={() => updateSort(column.key)}>
                    {column.label}
                    <ArrowDownUp className="h-3.5 w-3.5 shrink-0" />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.length > 0 ? (
              visibleRows.map((row, index) => (
                <tr key={String(row.id ?? index)} className="border-t border-border/70">
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 align-top">
                      {column.key === "status" && row[column.key] ? <StatusBadge status={String(row[column.key])} /> : (row[column.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={columns.length}>
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function escapeCsv(value: unknown) {
  const text = String(value ?? "")
  return `"${text.replace(/"/g, '""')}"`
}
