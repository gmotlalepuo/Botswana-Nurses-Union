import Link from "next/link"
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  CreditCard,
  FileCheck2,
  FileText,
  Gavel,
  HeartHandshake,
  LayoutDashboard,
} from "lucide-react"
import { CustomerApplicationTable } from "@/components/customer-application-table"
import { InteractiveTable } from "@/components/interactive-table"
import { MemberDashboardCharts } from "@/components/member-dashboard-charts"
import { MemberPortalShell } from "@/components/member-portal-shell"
import { formatCurrency, getMemberPortalData, isMemberProfileComplete } from "@/lib/member-data"
import { requireMemberPage } from "@/lib/member-auth"

export default async function MemberPortalPage() {
  const user = await requireMemberPage()
  const data = await getMemberPortalData(user.id)
  const profileComplete = isMemberProfileComplete(data.profile)
  const deductionTotal = data.monthlyLines.reduce((sum, line) => sum + line.amount, 0)
  const deductionChart = data.monthlyLines.map((line) => ({
    name: line.label,
    value: deductionTotal > 0 ? (line.amount / deductionTotal) * 100 : 0,
  }))
  const applicationChart = countBy(data.applications.map((application) => application.status.replace(/_/g, " ")))
  const paymentChart = sumByStatus(data.payments.map((payment) => ({ status: payment.status, amount: Number(payment.amount ?? 0) })))

  return (
    <MemberPortalShell profile={data.profile} profileComplete={profileComplete} showProfileGate>
      <div className="space-y-5">
        <section className="rounded-xl border bg-gradient-to-br from-white to-primary/5 p-5 shadow-sm">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-primary">Member services</p>
            <h1 className="mt-1 text-2xl font-bold tracking-normal">Start a new application</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.profile?.status === "active"
                ? "Choose the service you need and complete its application form."
                : "Pay your 5% membership fee to activate your account and unlock new applications."}
            </p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <ApplicationCard
              description="Apply for member funeral cover and related benefits."
              href="/portal/funeral-insurance"
              icon={HeartHandshake}
              title="Funeral Insurance"
              locked={data.profile?.status !== "active"}
            />
            <ApplicationCard
              description="Request legal support through the BONU member service."
              href="/portal/legal-aid"
              icon={Gavel}
              title="Legal Aid"
              locked={data.profile?.status !== "active"}
            />
            <ApplicationCard
              description="Submit an external loan assistance application."
              href="/portal/external-loans"
              icon={BriefcaseBusiness}
              title="External Loans"
              locked={data.profile?.status !== "active"}
            />
            <ApplicationCard
              description="Apply for short-term member micro-lending support."
              href="/portal/micro-lending"
              icon={FileText}
              title="Micro-Lending"
              locked={data.profile?.status !== "active"}
            />
          </div>
        </section>

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
            <a href="/portal/membership" className="rounded-md bg-primary px-4 py-3 font-semibold text-primary-foreground">Manage membership payment</a>
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
              emptyMessage="Complete your profile to calculate the 5% membership fee. Approved service deductions will appear here later."
              exportFileName="bonu-monthly-deductions.csv"
            />
          </div>
          <div className="mt-4 rounded-lg bg-muted p-4 text-right">
            <p className="text-sm text-muted-foreground">Total monthly payment</p>
            <p className="text-2xl font-bold">{formatCurrency(data.monthlyTotal)}</p>
          </div>
        </section>

        <section className="grid gap-5 2xl:grid-cols-2">
          <CustomerApplicationTable title="Application statuses" applications={data.applications} dashboardMode />

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

function ApplicationCard({
  description,
  href,
  icon: Icon,
  title,
  locked = false,
}: {
  description: string
  href: string
  icon: typeof LayoutDashboard
  title: string
  locked?: boolean
}) {
  if (locked) {
    return (
      <div className="flex min-h-44 cursor-not-allowed flex-col rounded-lg border bg-muted/40 p-4 opacity-70">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="mt-4 text-lg font-bold">{title}</h2>
        <p className="mt-1 flex-1 text-sm leading-6 text-muted-foreground">{description}</p>
        <span className="mt-3 text-sm font-bold text-muted-foreground">Locked until membership is active</span>
      </div>
    )
  }

  return (
    <Link
      href={href}
      className="group flex min-h-44 flex-col rounded-lg border bg-white p-4 shadow-sm outline-none transition-colors hover:border-primary/40 hover:bg-primary/[0.03] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h2 className="mt-4 text-lg font-bold">{title}</h2>
      <p className="mt-1 flex-1 text-sm leading-6 text-muted-foreground">{description}</p>
      <span className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-primary">
        Apply now
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
      </span>
    </Link>
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
