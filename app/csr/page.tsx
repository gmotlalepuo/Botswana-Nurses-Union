import { BadgeDollarSign, Boxes, ClipboardCheck, FileCheck2, Megaphone, MessageSquareWarning, ShoppingBag, TrendingUp, UsersRound } from "lucide-react"
import { CsrHeader } from "@/components/csr-header"
import { requireCsrPage } from "@/lib/admin-auth"
import { getCsrPortalData } from "@/lib/csr-data"

const metricIcons = [UsersRound, FileCheck2, ClipboardCheck, Megaphone]
const actionLinks = [
  { href: "/csr/members", label: "Members", icon: UsersRound },
  { href: "/csr/documents", label: "Documents", icon: FileCheck2 },
  { href: "/csr/applications", label: "Applications", icon: ClipboardCheck },
  { href: "/csr/products", label: "Products", icon: Boxes },
  { href: "/csr/orders", label: "Orders", icon: ShoppingBag },
  { href: "/csr/complaints", label: "Complaints", icon: MessageSquareWarning },
]

export default async function CsrPortalPage() {
  const user = await requireCsrPage()
  const data = await getCsrPortalData(user.id)

  return (
    <main className="bonu-shell min-h-screen bg-background">
      <CsrHeader />
      <section className="bonu-content mx-auto max-w-7xl px-5 py-8">
        {!data.configured && (
          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-950">
            CSR portal needs Supabase credentials and schema tables before live data can load.
          </div>
        )}

        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-normal text-primary">CSR Portal</p>
            <h1 className="text-3xl font-bold tracking-normal">Member service processing workspace</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              CSR users can manage member verification, documents, applications, payment queries, complaints, and campaign support.
            </p>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <div className="flex items-center gap-2">
              <BadgeDollarSign className="h-5 w-5 text-primary" />
              <p className="font-bold">CSR scope</p>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">No admin user management or system configuration access.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {data.metrics.map((metric, index) => {
            const Icon = metricIcons[index] ?? ClipboardCheck
            return (
              <article key={metric.label} className="rounded-lg border bg-white p-4 shadow-sm">
                <Icon className="h-5 w-5 text-primary" />
                <p className="mt-4 text-sm text-muted-foreground">{metric.label}</p>
                <p className="text-2xl font-bold">{metric.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{metric.detail}</p>
              </article>
            )
          })}
        </div>

        <section className="mt-6 rounded-lg border bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold">CSR action center</h2>
              <p className="mt-1 text-sm text-muted-foreground">Jump directly to the processing area you need.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {actionLinks.map((link) => {
                const Icon = link.icon
                return (
                  <a key={link.href} className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm font-semibold hover:bg-muted" href={link.href}>
                    <Icon className="h-4 w-4 text-primary" />
                    {link.label}
                  </a>
                )
              })}
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-[1.35fr_1fr]">
          <div className="rounded-lg border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Application workload</h2>
                <p className="mt-1 text-sm text-muted-foreground">Status and service mix across submitted customer requests.</p>
              </div>
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <BarList title="By status" rows={data.dashboard.applicationStatus} />
              <BarList title="By service" rows={data.dashboard.serviceVolume} />
            </div>
          </div>

          <div className="rounded-lg border bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold">Operations metrics</h2>
            <div className="mt-4 grid gap-3">
              {data.dashboard.operations.slice(0, 5).map((metric) => (
                <div key={metric.label} className="rounded-md border bg-muted/25 px-3 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-muted-foreground">{metric.label}</p>
                    <p className="text-sm font-bold">{metric.value}</p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{metric.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold">Application trend</h2>
            <ColumnChart rows={data.dashboard.monthlyApplications} />
          </div>
          <div className="rounded-lg border bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold">Payment status</h2>
            <BarList title="Transactions" rows={data.dashboard.paymentStatus} />
          </div>
        </section>
      </section>
    </main>
  )
}

function BarList({ title, rows }: { title: string; rows: Array<{ label: string; value: number }> }) {
  const maxValue = Math.max(...rows.map((row) => row.value), 1)

  return (
    <div>
      <p className="text-sm font-bold">{title}</p>
      <div className="mt-3 space-y-3">
        {rows.length > 0 ? (
          rows.map((row) => (
            <div key={row.label}>
              <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                <span className="font-semibold capitalize text-muted-foreground">{row.label}</span>
                <span className="font-bold">{row.value}</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.max(6, (row.value / maxValue) * 100)}%` }} />
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">No data yet.</p>
        )}
      </div>
    </div>
  )
}

function ColumnChart({ rows }: { rows: Array<{ label: string; value: number }> }) {
  const maxValue = Math.max(...rows.map((row) => row.value), 1)

  return (
    <div className="mt-5 flex h-56 items-end gap-3">
      {rows.map((row) => (
        <div key={row.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
          <div className="flex w-full flex-1 items-end rounded-md bg-muted px-1">
            <div className="w-full rounded-t-md bg-primary" style={{ height: `${Math.max(4, (row.value / maxValue) * 100)}%` }} />
          </div>
          <div className="text-center">
            <p className="text-xs font-bold">{row.value}</p>
            <p className="text-xs text-muted-foreground">{row.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
