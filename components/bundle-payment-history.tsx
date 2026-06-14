"use client"

import { useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { Eye, RadioTower, X } from "lucide-react"
import { InteractiveTable } from "@/components/interactive-table"
import { StatusBadge } from "@/components/status-badge"

export type BundlePaymentHistoryRow = {
  id: string
  reference: string
  month: string
  provider: string
  bundleType: string
  amount: string
  source: string
  status: string
  paidOn: string
}

export function BundlePaymentHistory({ payments }: { payments: BundlePaymentHistoryRow[] }) {
  const [selectedPayment, setSelectedPayment] = useState<BundlePaymentHistoryRow | null>(null)

  return (
    <>
      <InteractiveTable
        columns={[
          { key: "month", label: "Month" },
          { key: "provider", label: "Provider", filterable: true },
          { key: "amount", label: "Amount" },
          { key: "status", label: "Status", filterable: true },
          { key: "actions", label: "Details" },
        ]}
        rows={payments.map((payment) => ({ ...payment, actions: payment.id }))}
        emptyMessage="No bundle payments have been processed yet."
        exportFileName="bonu-bundle-payments.csv"
        minTableWidth={0}
        renderCell={(row, column) => {
          if (column.key === "status") {
            return <StatusBadge status={String(row.status)} />
          }

          if (column.key === "actions") {
            const payment = payments.find((item) => item.id === row.id)
            return (
              <button
                className="inline-flex min-h-10 items-center gap-2 rounded-md border border-primary/25 bg-primary/5 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                onClick={() => payment && setSelectedPayment(payment)}
                type="button"
              >
                <Eye className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">View full details</span>
                <span className="sm:hidden">View</span>
              </button>
            )
          }

          return row[column.key] ?? ""
        }}
      />

      <BundlePaymentDialog payment={selectedPayment} onClose={() => setSelectedPayment(null)} />
    </>
  )
}

function BundlePaymentDialog({
  payment,
  onClose,
}: {
  payment: BundlePaymentHistoryRow | null
  onClose: () => void
}) {
  return (
    <Dialog.Root open={Boolean(payment)} onOpenChange={(open) => { if (!open) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[200] bg-slate-950/60 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[201] max-h-[90dvh] w-[calc(100vw-1.5rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-slate-50 shadow-2xl focus:outline-none"
          aria-describedby="bundle-payment-description"
        >
          {payment && (
            <>
              <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b bg-white/95 px-5 py-5 backdrop-blur sm:px-7">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <RadioTower className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <Dialog.Title className="text-xl font-bold">Bundle payment details</Dialog.Title>
                    <Dialog.Description id="bundle-payment-description" className="mt-1 break-all text-sm text-muted-foreground">
                      {payment.reference}
                    </Dialog.Description>
                  </div>
                </div>
                <Dialog.Close asChild>
                  <button
                    aria-label="Close bundle payment details"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border bg-white text-muted-foreground hover:bg-muted hover:text-foreground"
                    type="button"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </Dialog.Close>
              </header>

              <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-7">
                <Detail label="Payment month" value={payment.month} />
                <Detail label="Amount" value={payment.amount} />
                <Detail label="Provider" value={payment.provider} />
                <Detail label="Bundle type" value={payment.bundleType} />
                <Detail label="Payment source" value={payment.source} />
                <Detail label="Paid on" value={payment.paidOn} />
                <div className="rounded-lg border bg-white p-4 sm:col-span-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Status</p>
                  <div className="mt-2"><StatusBadge status={payment.status} /></div>
                </div>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 break-words text-sm font-semibold">{value}</p>
    </div>
  )
}
