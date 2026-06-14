import { CsrHeader } from "@/components/csr-header"
import { CsrWorkbench, type CsrWorkbenchSection } from "@/components/csr-workbench"
import { requireCsrPage } from "@/lib/admin-auth"
import { getCsrPortalData } from "@/lib/csr-data"
import { CsrPaymentImport } from "@/components/csr-payment-import"

type Props = {
  title: string
  description: string
  section: CsrWorkbenchSection
  applicationType?: string
  applicationRedirectTo?: string
}

export async function CsrSectionPage({ title, description, section, applicationType, applicationRedirectTo }: Props) {
  const user = await requireCsrPage()
  const data = await getCsrPortalData(user.id)
  const applications = applicationType
    ? data.applications.filter((application) => application.application_type === applicationType)
    : data.applications

  return (
    <main className="bonu-shell min-h-screen bg-background">
      <CsrHeader />
      <section className="bonu-content mx-auto max-w-7xl px-5 py-8">
        {!data.configured && (
          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-950">
            CSR portal needs Supabase credentials and schema tables before live data can load.
          </div>
        )}

        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-normal">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>

        {section === "payments" && <CsrPaymentImport />}

        <CsrWorkbench
          members={data.members}
          documents={data.documents}
          applications={applications}
          payments={data.payments}
          complaints={data.complaints}
          products={data.products}
          merchandiseOrders={data.merchandiseOrders}
          sections={[section]}
          applicationRedirectTo={applicationRedirectTo}
        />
      </section>
    </main>
  )
}
