export function StatusBadge({ status }: { status: string }) {
  const normalized = status.trim().toLowerCase().replace(/\s+/g, "_")
  const label = normalized.replace(/_/g, " ")

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize ${statusClass(normalized)}`}>
      {label}
    </span>
  )
}

function statusClass(status: string) {
  if (["approved", "fulfilled"].includes(status)) {
    return "bg-emerald-100 text-emerald-800"
  }

  if (status === "rejected") {
    return "bg-red-100 text-red-800"
  }

  if (["submitted", "pending", "in_review", "more_info_required"].includes(status)) {
    return "bg-amber-100 text-amber-800"
  }

  return "bg-slate-100 text-slate-700"
}
