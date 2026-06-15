import { ApplicationHistory, FormAttachment, FormField, FormTextArea, HiddenApplicationFields } from "@/components/member-application-form"
import { MemberPortalShell } from "@/components/member-portal-shell"
import { getMemberPortalData } from "@/lib/member-data"
import { requireActiveMemberPage } from "@/lib/member-auth"
import { AiMimicButton } from "@/components/ai-mimic-button"

export default async function MicroLendingPage() {
  const { user } = await requireActiveMemberPage()
  const data = await getMemberPortalData(user.id)
  const applications = data.applications.filter((item) => item.application_type === "micro_loan")

  return (
    <MemberPortalShell profile={data.profile}>
      <div className="space-y-5">
        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <h1 className="text-3xl font-bold tracking-normal">Apply for internal micro-loan</h1>
          <form id="micro-loan-application" action="/api/member/applications/create" method="post" encType="multipart/form-data" className="mt-5 grid gap-4 md:grid-cols-3">
            <HiddenApplicationFields applicationType="micro_loan" redirectTo="/portal/micro-lending" />
            <AiMimicButton
              formId="micro-loan-application"
              values={{
                requestedAmount: "12000",
                termMonths: "12",
                monthlyDeduction: "1100",
                loanPurpose: "Emergency household repairs and school expenses for dependents in Gaborone.",
              }}
              note="File attachments cannot be filled automatically. Select the required documents before submitting."
            />
            <FormField name="requestedAmount" label="Requested amount" type="number" required />
            <FormField name="termMonths" label="Repayment term in months" type="number" required />
            <FormField name="monthlyDeduction" label="Proposed monthly repayment" type="number" required />
            <FormAttachment label="Active BONU membership required" required />
            <FormAttachment label="Recent payslip required" required />
            <FormAttachment label="Repayment deducted monthly" required />
            <div className="md:col-span-3">
              <FormTextArea name="loanPurpose" label="Loan purpose" required />
            </div>
            <button className="rounded-md bg-primary px-4 py-3 font-semibold text-primary-foreground md:col-span-3">Submit micro-loan application</button>
          </form>
        </section>
        <ApplicationHistory title="Micro-loan status" applications={applications} />
      </div>
    </MemberPortalShell>
  )
}
