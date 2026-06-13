import { CalendarClock, CreditCard, FileCheck2, LayoutDashboard } from "lucide-react"
import { CustomerApplicationTable } from "@/components/customer-application-table"
import { InteractiveTable } from "@/components/interactive-table"
import { MemberDashboardCharts } from "@/components/member-dashboard-charts"
import { MemberPortalShell } from "@/components/member-portal-shell"
import { formatCurrency, getMemberPortalData } from "@/lib/member-data"
import { requireMemberPage } from "@/lib/member-auth"

export default async function MemberPortalPage() {
  const user = await requireMemberPage()
  const data = await getMemberPortalData(user.id)
  const deductionTotal = data.monthlyLines.reduce((sum, line) => sum + line.amount, 0)
  const deductionChart = data.monthlyLines.map((line) => ({
    name: line.label,
    value: deductionTotal > 0 ? (line.amount / deductionTotal) * 100 : 0,
  }))
  const applicationChart = countBy(data.applications.map((application) => application.status.replace(/_/g, " ")))
  const paymentChart = sumByStatus(data.payments.map((payment) => ({ status: payment.status, amount: Number(payment.amount ?? 0) })))

  return (
    <MemberPortalShell profile={data.profile}>
      <div className="space-y-5">
        <section className="grid gap-4 md:grid-cols-4">
          <Metric icon={LayoutDashboard} label="Membership status" value={data.profile?.status ?? "Profile pending"} />
          <Metric icon={CalendarClock} label="Active deductions" value={String(data.monthlyLines.length)} />
          <Metric icon={CreditCard} label="Monthly total" value={formatCurrency(data.monthlyTotal)} />
          <Metric icon={FileCheck2} label="Outstanding balance" value={formatCurrency(data.outstandingBalance)} />
        </section>

        <MemberDashboardCharts deductions={deductionChart} applications={applicationChart} payments={paymentChart} />

        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-normal text-primary">Monthly membership payments</p>
              <h1 className="text-3xl font-bold tracking-normal">Deduction breakdown</h1>
            </div>
            <form action="/api/payments/create-checkout" method="post">
              <input type="hidden" name="itemId" value="membership" />
              <input type="hidden" name="memberId" value={data.profile?.id ?? user.id} />
              <button className="rounded-md bg-primary px-4 py-3 font-semibold text-primary-foreground">Pay monthly amount</button>
            </form>
          </div>
          <div className="mt-5">
            <InteractiveTable
              columns={[
                { key: "label", label: "Service" },
                { key: "source", label: "Source", filterable: true },
                { key: "status", label: "Status", filterable: true },
                { key: "amount", label: "Monthly amount" },
              ]}
              rows={data.monthlyLines.map((line) => ({
                id: line.id,
                label: line.label,
                source: line.source,
                status: line.status,
                amount: formatCurrency(line.amount),
              }))}
              emptyMessage="No active monthly deductions yet. Approved billable services will appear here after CSR configures them."
              exportFileName="bonu-monthly-deductions.csv"
            />
          </div>
          <div className="mt-4 rounded-lg bg-muted p-4 text-right">
            <p className="text-sm text-muted-foreground">Total monthly payment</p>
            <p className="text-2xl font-bold">{formatCurrency(data.monthlyTotal)}</p>
          </div>
        </section>

        <section className="grid gap-5 2xl:grid-cols-2">
          <CustomerApplicationTable title="Application statuses" applications={data.applications} />

          <article className="min-w-0 rounded-lg border bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold">Payment history</h2>
            <div className="mt-4">
              <InteractiveTable
                columns={[
                  { key: "description", label: "Description" },
                  { key: "amount", label: "Amount" },
                  { key: "status", label: "Status", filterable: true },
                  { key: "createdAt", label: "Date" },
                ]}
                rows={data.payments.map((payment) => ({
                  id: payment.id,
                  description: payment.description,
                  amount: formatCurrency(Number(payment.amount), payment.currency),
                  status: payment.status,
                  createdAt: new Date(payment.created_at).toLocaleDateString(),
                }))}
                emptyMessage="No payment history yet."
                exportFileName="bonu-payment-history.csv"
              />
            </div>
          </article>
        </section>
      </div>
    </MemberPortalShell>
  )
}

function Metric({ icon: Icon, label, value }: { icon: typeof LayoutDashboard; label: string; value: string }) {
  return (
    <article className="group rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary transition-transform group-hover:scale-105">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold capitalize">{value}</p>
    </article>
  )
}

function countBy(values: string[]) {
  const counts = new Map<string, number>()
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1)
  }
  return Array.from(counts.entries()).map(([name, value]) => ({ name, value }))
}

function sumByStatus(values: Array<{ status: string; amount: number }>) {
  const totals = new Map<string, number>()
  for (const value of values) {
    totals.set(value.status, (totals.get(value.status) ?? 0) + value.amount)
  }
  return Array.from(totals.entries()).map(([name, value]) => ({ name, value }))
}
