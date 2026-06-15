import { ApplicationHistory } from "@/components/member-application-form"
import { ExternalLoansForm } from "@/components/external-loans-form"
import { MemberPortalShell } from "@/components/member-portal-shell"
import { getMemberPortalData } from "@/lib/member-data"
import { requireActiveMemberPage } from "@/lib/member-auth"

export default async function ExternalLoansPage() {
  const { user } = await requireActiveMemberPage()
  const data = await getMemberPortalData(user.id)
  const applications = data.applications.filter((item) => item.application_type === "loan_assistance")

  return (
    <MemberPortalShell profile={data.profile}>
      <div className="space-y-5">
        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <h1 className="text-3xl font-bold tracking-normal">Request partner-bank loan assistance</h1>
          <ExternalLoansForm />
        </section>
        <ApplicationHistory title="External loan status" applications={applications} />
      </div>
    </MemberPortalShell>
  )
}
