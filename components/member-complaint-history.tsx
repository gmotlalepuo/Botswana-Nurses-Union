"use client"

import { useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { Eye, MessageSquareWarning, X } from "lucide-react"
import { InteractiveTable } from "@/components/interactive-table"
import { StatusBadge } from "@/components/status-badge"
import { formatDate } from "@/lib/complaint-format"
import type { MemberComplaint } from "@/lib/member-data"

export function MemberComplaintHistory({ complaints }: { complaints: MemberComplaint[] }) {
  const [selectedComplaint, setSelectedComplaint] = useState<MemberComplaint | null>(null)
  const rows = complaints.map((complaint) => ({
    id: complaint.id,
    reference: `CMP-${complaint.id.slice(0, 8).toUpperCase()}`,
    subject: complaint.subject,
    status: complaint.status,
    submitted: formatDate(complaint.created_at),
    actions: complaint.id,
  }))

  return (
    <>
      <InteractiveTable
        columns={[
          { key: "reference", label: "Reference" },
          { key: "subject", label: "Subject" },
          { key: "status", label: "Status", filterable: true },
          { key: "submitted", label: "Submitted" },
          { key: "actions", label: "Details" },
        ]}
        rows={rows}
        emptyMessage="You have not submitted any complaints."
        exportFileName="bonu-member-complaints.csv"
        minTableWidth={680}
        renderCell={(row, column) => {
          if (column.key === "status") {
            return <StatusBadge status={String(row.status)} />
          }

          if (column.key === "actions") {
            const complaint = complaints.find((item) => item.id === row.id)
            return (
              <button
                className="inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-md border border-primary/25 bg-primary/5 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                onClick={() => complaint && setSelectedComplaint(complaint)}
                type="button"
              >
                <Eye className="h-4 w-4" />
                View full details
              </button>
            )
          }

          return row[column.key] ?? ""
        }}
      />

      <ComplaintDetailsDialog
        complaint={selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
      />
    </>
  )
}

function ComplaintDetailsDialog({
  complaint,
  onClose,
}: {
  complaint: MemberComplaint | null
  onClose: () => void
}) {
  return (
    <Dialog.Root open={Boolean(complaint)} onOpenChange={(open) => { if (!open) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[200] bg-slate-950/60 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[201] max-h-[90dvh] w-[calc(100vw-1.5rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-slate-50 shadow-2xl focus:outline-none"
          aria-describedby="complaint-details-description"
        >
          {complaint && (
            <>
              <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b bg-white/95 px-5 py-5 backdrop-blur sm:px-7">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <MessageSquareWarning className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <Dialog.Title className="text-xl font-bold">Complaint details</Dialog.Title>
                    <Dialog.Description id="complaint-details-description" className="mt-1 text-sm text-muted-foreground">
                      {`CMP-${complaint.id.slice(0, 8).toUpperCase()}`}
                    </Dialog.Description>
                  </div>
                </div>
                <Dialog.Close asChild>
                  <button
                    aria-label="Close complaint details"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border bg-white text-muted-foreground hover:bg-muted hover:text-foreground"
                    type="button"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </Dialog.Close>
              </header>

              <div className="space-y-5 p-5 sm:p-7">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Detail label="Category" value={complaint.category} />
                  <Detail label="Priority" value={complaint.priority} capitalize />
                  <div className="rounded-lg border bg-white p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Status</p>
                    <div className="mt-2"><StatusBadge status={complaint.status} /></div>
                  </div>
                  <Detail label="Submitted" value={formatDate(complaint.created_at)} />
                </div>

                <DetailSection label="Subject" value={complaint.subject} />
                <DetailSection label="Full description" value={complaint.description} />
                <DetailSection
                  label="CSR response"
                  value={complaint.resolution_notes || "Awaiting CSR response"}
                  muted={!complaint.resolution_notes}
                />
                {complaint.resolved_at && (
                  <DetailSection label="Resolved on" value={formatDate(complaint.resolved_at)} />
                )}
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function Detail({ label, value, capitalize = false }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-2 text-sm font-semibold ${capitalize ? "capitalize" : ""}`}>{value}</p>
    </div>
  )
}

function DetailSection({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <section className="rounded-lg border bg-white p-4">
      <h3 className="text-sm font-bold">{label}</h3>
      <p className={`mt-2 whitespace-pre-wrap break-words text-sm leading-6 ${muted ? "text-muted-foreground" : "text-foreground"}`}>
        {value}
      </p>
    </section>
  )
}
