import { RadioTower } from "lucide-react"
import { BundlePaymentHistory, type BundlePaymentHistoryRow } from "@/components/bundle-payment-history"
import { BundleRequestForm } from "@/components/bundle-request-form"
import { CustomerApplicationTable } from "@/components/customer-application-table"
import { MemberPortalShell } from "@/components/member-portal-shell"
import { formatCurrency, getMemberPortalData, type MemberApplication } from "@/lib/member-data"
import { requireMemberPage } from "@/lib/member-auth"

export default async function BundlesPage() {
  const user = await requireMemberPage()
  const data = await getMemberPortalData(user.id)
  const applications = data.applications.filter((application) => application.application_type === "bundle")
  const applicationsById = new Map(applications.map((application) => [application.id, application]))
  const paymentRows = getBundlePaymentRows(data.payments, applicationsById)

  return (
    <MemberPortalShell profile={data.profile}>
      <div className="space-y-5">
        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="rounded-lg bg-primary/10 p-3 text-primary"><RadioTower className="h-6 w-6" /></span>
            <div>
              <h1 className="text-3xl font-bold tracking-normal">Airtime and data bundles</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                Request a recurring bundle from a BONU partner provider. CSR will verify the request and approve the monthly deduction before it is billed.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {["Botswana partner providers", "CSR approval before billing", "Included in one monthly payment"].map((item) => (
              <p key={item} className="rounded-md bg-muted p-3 text-sm font-semibold">{item}</p>
            ))}
          </div>
          <BundleRequestForm />
        </section>

        <CustomerApplicationTable title="Bundle request history" applications={applications} />

        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold">Bundle payment history</h2>
          <p className="mt-1 text-sm text-muted-foreground">Review the bundle portion included in each completed combined monthly payment.</p>
          <div className="mt-4">
            <BundlePaymentHistory payments={paymentRows} />
          </div>
        </section>
      </div>
    </MemberPortalShell>
  )
}

function getBundlePaymentRows(
  payments: Awaited<ReturnType<typeof getMemberPortalData>>["payments"],
  applicationsById: Map<string, MemberApplication>,
): BundlePaymentHistoryRow[] {
  return payments.flatMap((payment) => {
    const breakdown = Array.isArray(payment.metadata?.breakdown) ? payment.metadata.breakdown : []

    return breakdown.flatMap((item, index) => {
      if (!item || typeof item !== "object") return []
      const line = item as { applicationId?: string; service?: string; amount?: number }
      if (line.service !== "bundle") return []

      const application = line.applicationId ? applicationsById.get(line.applicationId) : undefined
      return [{
        id: `${payment.id}-${line.applicationId ?? index}`,
        reference: `PAY-${payment.id.slice(0, 8).toUpperCase()}`,
        month: payment.payment_month?.slice(0, 7) ?? "Not assigned",
        provider: String(application?.details?.provider ?? "Provider not recorded"),
        bundleType: String(application?.details?.bundleType ?? "Bundle"),
        amount: formatCurrency(Number(line.amount ?? 0), payment.currency),
        source: payment.payment_source === "csr_import" ? "CSR bulk upload" : payment.payment_source === "stripe" ? "Stripe" : "Other",
        status: payment.status,
        paidOn: new Date(payment.paid_at ?? payment.created_at).toLocaleDateString("en-BW"),
      }]
    })
  })
}
