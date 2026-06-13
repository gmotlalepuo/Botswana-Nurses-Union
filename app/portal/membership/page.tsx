import { MemberPortalShell } from "@/components/member-portal-shell"
import { InteractiveTable } from "@/components/interactive-table"
import { CustomerApplicationTable } from "@/components/customer-application-table"
import { getMemberPortalData, formatCurrency } from "@/lib/member-data"
import { requireMemberPage } from "@/lib/member-auth"

const billableServiceTypes = new Set(["funeral_insurance", "legal_aid", "loan_assistance", "micro_loan", "merchandise", "electronic_contract"])
const approvedStatuses = new Set(["approved", "fulfilled"])

export default async function MembershipPage() {
  const user = await requireMemberPage()
  const data = await getMemberPortalData(user.id)
  const approvedBillableApplications = data.applications.filter(
    (application) =>
      billableServiceTypes.has(application.application_type) &&
      approvedStatuses.has(application.status) &&
      Number(application.monthly_deduction ?? 0) > 0,
  )
  const approvedMonthlyTotal = approvedBillableApplications.reduce((sum, application) => sum + Number(application.monthly_deduction ?? 0), 0)
  const hasApprovedBillableServices = approvedBillableApplications.length > 0
  const isMembershipActive = data.profile?.status === "active"

  return (
    <MemberPortalShell profile={data.profile}>
      <div className="space-y-5">
        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <h1 className="text-3xl font-bold tracking-normal">Membership</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Manage your BONU membership subscription and review the monthly services currently attached to your account.
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <Info label="Membership status" value={data.profile?.status ?? "Pending"} />
            <Info label="Approved monthly deductibles" value={formatCurrency(approvedMonthlyTotal)} />
            <Info label="Approved billable services" value={String(approvedBillableApplications.length)} />
            <Info label="Outstanding balance" value={formatCurrency(data.outstandingBalance)} />
          </div>
          <form action="/api/member/membership/subscribe" method="post" className="mt-5 rounded-lg border bg-muted/50 p-4">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <h2 className="font-bold">{isMembershipActive ? "Membership is active" : "Activate membership"}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Activation is available only after CSR approves at least one billable service with a monthly deduction.
                </p>
                <p className="mt-3 text-sm font-semibold">Amount to be billed monthly: {formatCurrency(approvedMonthlyTotal)}</p>
                {!hasApprovedBillableServices ? (
                  <p className="mt-2 text-sm text-amber-700">Apply for Funeral Insurance, Legal Aid, External Loans, Micro-Lending, Shop, or Electronic Contracts and wait for CSR approval.</p>
                ) : null}
              </div>
              <button
                className="rounded-md bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:bg-muted-foreground/40"
                disabled={!hasApprovedBillableServices || isMembershipActive}
                type="submit"
              >
                {isMembershipActive ? "Already active" : "Activate membership"}
              </button>
            </div>
          </form>
        </section>
        <CustomerApplicationTable title="Approved billed services" applications={approvedBillableApplications} />
        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold">Subscription payment history</h2>
          <div className="mt-4">
            <InteractiveTable
              columns={[
                { key: "description", label: "Description" },
                { key: "amount", label: "Amount" },
                { key: "status", label: "Status", filterable: true },
                { key: "date", label: "Date" },
              ]}
              rows={data.payments.map((payment) => ({
                id: payment.id,
                description: payment.description,
                amount: formatCurrency(Number(payment.amount), payment.currency),
                status: payment.status,
                date: new Date(payment.created_at).toLocaleDateString(),
              }))}
              emptyMessage="No payment records yet."
              exportFileName="bonu-subscription-payments.csv"
            />
          </div>
        </section>
        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold">Membership benefits</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {["Union representation", "Funeral insurance access", "Legal aid services", "Loan application assistance", "Merchandise and device contract access", "Campaign and branch support"].map((benefit) => (
              <p key={benefit} className="rounded-md bg-muted p-3 text-sm font-semibold">{benefit}</p>
            ))}
          </div>
        </section>
      </div>
    </MemberPortalShell>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-xl font-bold capitalize">{value}</p></div>
}
