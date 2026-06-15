import { MemberPortalShell } from "@/components/member-portal-shell"
import { InteractiveTable } from "@/components/interactive-table"
import { CustomerApplicationTable } from "@/components/customer-application-table"
import { getMemberPortalData, formatCurrency } from "@/lib/member-data"
import { requireCompleteMemberPage } from "@/lib/member-auth"
import { MEMBERSHIP_SALARY_RATE, previousPaymentMonth, paymentMonthStart } from "@/lib/membership-payments"
import { MembershipDocumentFlow } from "@/components/membership-document-flow"

const billableServiceTypes = new Set(["funeral_insurance", "legal_aid", "loan_assistance", "micro_loan", "merchandise", "electronic_contract", "bundle"])
const approvedStatuses = new Set(["approved", "fulfilled"])

export default async function MembershipPage() {
  const { user } = await requireCompleteMemberPage()
  const data = await getMemberPortalData(user.id)
  const approvedBillableApplications = data.applications.filter(
    (application) =>
      billableServiceTypes.has(application.application_type) &&
      approvedStatuses.has(application.status) &&
      Number(application.monthly_deduction ?? 0) > 0,
  )
  const membershipApplications = data.applications.filter((application) => application.application_type === "membership")
  const hasApprovedMembershipOnboarding = membershipApplications.some((application) =>
    ["approved", "fulfilled"].includes(application.status),
  )
  const approvedMonthlyTotal = approvedBillableApplications.reduce((sum, application) => sum + Number(application.monthly_deduction ?? 0), 0)
  const monthlySalary = Number(data.profile?.monthly_salary ?? 0)
  const membershipFee = Math.round(monthlySalary * MEMBERSHIP_SALARY_RATE * 100) / 100
  const currentPaymentMonth = paymentMonthStart()
  const previousMonth = previousPaymentMonth()
  const currentMonthPaid = data.payments.some(
    (payment) =>
      payment.payment_kind === "membership_monthly" &&
      payment.payment_month === currentPaymentMonth &&
      payment.status === "paid",
  )
  const previousMonthPaid = data.payments.some(
    (payment) =>
      payment.payment_kind === "membership_monthly" &&
      payment.payment_month === previousMonth &&
      payment.status === "paid",
  )
  const paymentTargetMonth = currentMonthPaid
    ? currentPaymentMonth
    : ["active", "suspended"].includes(data.profile?.status ?? "") && !previousMonthPaid
      ? previousMonth
      : currentPaymentMonth
  const currentMonthPayment = data.payments.find(
    (payment) =>
      payment.payment_kind === "membership_monthly" &&
      payment.payment_month === paymentTargetMonth &&
      payment.status === "paid",
  )
  const isMembershipActive = data.profile?.status === "active"
  const isSuspended = data.profile?.status === "suspended"
  const requiresOnboardingApproval = !isMembershipActive && !isSuspended
  const canPayMembership = membershipFee > 0 && (!requiresOnboardingApproval || hasApprovedMembershipOnboarding)
  const membershipStatus = isMembershipActive
    ? "Active"
    : isSuspended
      ? "Suspended"
      : hasApprovedMembershipOnboarding
        ? "Ready to activate"
        : membershipApplications.length > 0
          ? "Onboarding under review"
          : "Onboarding required"
  const actionLabel = isSuspended ? "Reactivate and pay" : data.profile?.status === "active" ? "Pay this month" : "Activate membership"

  return (
    <MemberPortalShell profile={data.profile}>
      <div className="space-y-5">
        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <h1 className="text-3xl font-bold tracking-normal">Membership</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Pay your BONU membership fee and review the monthly services attached to your account.
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <Info label="Membership status" value={membershipStatus} />
            <Info label="Monthly salary" value={formatCurrency(monthlySalary)} />
            <Info label="Membership rate" value="5%" />
            <Info label="Monthly membership fee" value={formatCurrency(membershipFee)} />
            <Info label="Outstanding balance" value={formatCurrency(data.outstandingBalance)} />
          </div>
          <form action="/api/member/membership/subscribe" method="post" className="mt-5 rounded-lg border bg-muted/50 p-4">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <h2 className="font-bold">{isMembershipActive ? "Membership is active" : membershipStatus}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your membership fee is calculated as 5% of the monthly salary saved in your profile. CSR must approve your membership onboarding forms before payment can activate your account.
                </p>
                <p className="mt-3 text-sm font-semibold">Membership fee due: {formatCurrency(membershipFee)}</p>
                {requiresOnboardingApproval && !hasApprovedMembershipOnboarding ? (
                  <p className="mt-2 text-sm font-medium text-amber-700">
                    Submit the membership onboarding form below and wait for CSR approval. The activation payment button will unlock after approval.
                  </p>
                ) : currentMonthPayment ? (
                  <p className="mt-2 text-sm font-medium text-emerald-700">
                    Payment for {paymentTargetMonth.slice(0, 7)} has been processed via {currentMonthPayment.payment_source === "csr_import" ? "CSR bulk payment" : "Stripe"}.
                  </p>
                ) : (
                  <p className="mt-2 text-sm font-medium text-emerald-700">
                    Pay the membership fee for {paymentTargetMonth.slice(0, 7)} to {isMembershipActive ? "keep your membership current" : "activate your membership"}.
                  </p>
                )}
              </div>
              {!currentMonthPayment ? (
                <button
                  className="rounded-md bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:bg-muted-foreground/40"
                  disabled={!canPayMembership}
                  type="submit"
                >
                  {canPayMembership
                    ? `${actionLabel} - ${formatCurrency(membershipFee)}`
                    : membershipFee <= 0
                      ? "Salary required"
                      : "Awaiting CSR approval"}
                </button>
              ) : (
                <span className="rounded-md bg-emerald-100 px-4 py-3 text-center font-semibold text-emerald-800">Paid for this month</span>
              )}
            </div>
          </form>
        </section>
        <MembershipDocumentFlow membershipApplications={membershipApplications} />
        {membershipApplications.length > 0 && (
          <CustomerApplicationTable title="Membership form submissions" applications={membershipApplications} />
        )}
        {approvedBillableApplications.length > 0 && (
          <CustomerApplicationTable title={`Approved billed services (${formatCurrency(approvedMonthlyTotal)} monthly)`} applications={approvedBillableApplications} />
        )}
        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold">Subscription payment history</h2>
          <div className="mt-4">
            <InteractiveTable
              columns={[
                { key: "description", label: "Description" },
                { key: "services", label: "Payment breakdown" },
                { key: "amount", label: "Amount" },
                { key: "status", label: "Status", filterable: true },
                { key: "source", label: "Source", filterable: true },
                { key: "month", label: "Payment month" },
                { key: "date", label: "Date" },
              ]}
              rows={data.payments.map((payment) => ({
                id: payment.id,
                description: payment.description,
                services: paymentBreakdown(payment.metadata),
                amount: formatCurrency(Number(payment.amount), payment.currency),
                status: payment.status,
                source: payment.payment_source === "csr_import" ? "CSR bulk upload" : payment.payment_source === "stripe" ? "Stripe" : "Other",
                month: payment.payment_month?.slice(0, 7) ?? "Not assigned",
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

function paymentBreakdown(metadata: Record<string, unknown>) {
  const breakdown = metadata?.breakdown
  if (!Array.isArray(breakdown)) return "-"
  return breakdown
    .map((line) => {
      if (!line || typeof line !== "object") return ""
      const record = line as { service?: string; amount?: number }
      const service = String(record.service ?? "").replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
      return service ? `${service}: ${formatCurrency(Number(record.amount ?? 0))}` : ""
    })
    .filter(Boolean)
    .join("; ") || "-"
}
