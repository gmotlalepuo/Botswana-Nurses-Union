import Link from "next/link"
import {
  BadgeDollarSign,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  FileCheck2,
  Settings2,
  UsersRound,
} from "lucide-react"
import { AdminHeader } from "@/components/admin-header"
import { InteractiveTable } from "@/components/interactive-table"
import { requireAdminPage } from "@/lib/admin-auth"
import {
  formatCurrency,
  friendlyApplicationType,
  friendlyStatus,
  getAdminReportData,
} from "@/lib/admin-reports"
import { workflows } from "@/lib/bonu-data"

const metricIcons = [UsersRound, CheckCircle2, ClipboardList, CreditCard]

export default async function BackOfficePage() {
  await requireAdminPage()
  const report = await getAdminReportData()

  return (
    <main className="bonu-shell min-h-screen bg-background">
      <AdminHeader />

      <section className="bonu-content mx-auto max-w-7xl px-5 py-7">
        {!report.configured && (
          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-950">
            Admin reports need Supabase credentials and the database schema applied before live data can load.
          </div>
        )}

        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-normal text-primary">Back Office Portal</p>
            <h1 className="text-3xl font-bold tracking-normal">CSR workbench and management reports</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-3 font-semibold text-primary-foreground">
              <Settings2 className="h-4 w-4" />
              Configure deductions
            </button>
            <Link className="inline-flex items-center gap-2 rounded-md border bg-white px-4 py-3 font-semibold text-foreground hover:bg-muted" href="/admin/users">
              Manage users
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {report.metrics.map((stat, index) => {
            const Icon = metricIcons[index] ?? BarChart3
            return (
              <article key={stat.label} className="rounded-lg border bg-white p-4">
                <Icon className="h-5 w-5 text-primary" />
                <p className="mt-4 text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{stat.detail}</p>
              </article>
            )
          })}
        </div>

        <section className="mt-6 rounded-lg border bg-white p-5">
          <div className="flex items-center gap-2">
            <BadgeDollarSign className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Financial reports</h2>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {report.revenueReports.map((item) => (
              <article key={item.label} className="rounded-lg border bg-muted/60 p-4">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-2xl font-bold">{item.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_380px]">
          <section className="rounded-lg border bg-white p-5">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Processing queues</h2>
            </div>
            <div className="mt-4">
              <InteractiveTable
                columns={[
                  { key: "name", label: "Queue" },
                  { key: "count", label: "Open" },
                  { key: "owner", label: "Owner", filterable: true },
                  { key: "status", label: "Status", filterable: true },
                ]}
                rows={report.queues.map((queue) => ({ id: queue.name, ...queue }))}
                emptyMessage="No processing queues found."
                exportFileName="bonu-processing-queues.csv"
              />
            </div>
          </section>

          <aside className="space-y-5">
            <BreakdownCard title="Application status" items={report.applicationStatus} />
            <BreakdownCard title="Service breakdown" items={report.serviceBreakdown} />
          </aside>
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          <section className="rounded-lg border bg-white p-5">
            <div className="flex items-center gap-2">
              <FileCheck2 className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Recent applications</h2>
            </div>
            <div className="mt-4">
              <InteractiveTable
                columns={[
                  { key: "member", label: "Member" },
                  { key: "service", label: "Service", filterable: true },
                  { key: "status", label: "Status", filterable: true },
                  { key: "deduction", label: "Deduction" },
                ]}
                rows={report.recentApplications.map((application) => ({
                  id: application.id,
                  member: application.members?.full_name ?? application.members?.email ?? "Member",
                  service: friendlyApplicationType(application.application_type),
                  status: friendlyStatus(application.status),
                  deduction: formatCurrency(Number(application.monthly_deduction ?? 0)),
                }))}
                emptyMessage="No applications have been submitted yet."
                exportFileName="bonu-recent-applications.csv"
              />
            </div>
          </section>

          <section className="rounded-lg border bg-white p-5">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Recent payments</h2>
            </div>
            <div className="mt-4">
              <InteractiveTable
                columns={[
                  { key: "member", label: "Member" },
                  { key: "description", label: "Description" },
                  { key: "amount", label: "Amount" },
                  { key: "status", label: "Status", filterable: true },
                ]}
                rows={report.recentPayments.map((payment) => ({
                  id: payment.id,
                  member: payment.members?.full_name ?? payment.members?.email ?? "Member",
                  description: payment.description,
                  amount: formatCurrency(Number(payment.amount ?? 0)),
                  status: payment.status,
                }))}
                emptyMessage="No payments have been recorded yet."
                exportFileName="bonu-recent-payments.csv"
              />
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-lg border bg-surface-strong p-5 text-white">
          <h2 className="text-xl font-bold">Configured workflows</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {workflows.map((workflow) => (
              <div key={workflow} className="rounded-md bg-white/10 px-3 py-3 text-sm font-semibold">
                {workflow}
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}

function BreakdownCard({ title, items }: { title: string; items: Array<{ label: string; count: number }> }) {
  const total = items.reduce((sum, item) => sum + item.count, 0)

  return (
    <article className="rounded-lg border bg-white p-5">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      <div className="mt-4 space-y-3">
        {items.map((item) => {
          const width = total > 0 ? `${Math.max((item.count / total) * 100, 4)}%` : "0%"

          return (
            <div key={item.label}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium">{item.label}</span>
                <span className="text-muted-foreground">{item.count}</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-muted">
                <div className="h-2 rounded-full bg-primary" style={{ width }} />
              </div>
            </div>
          )
        })}
      </div>
    </article>
  )
}
