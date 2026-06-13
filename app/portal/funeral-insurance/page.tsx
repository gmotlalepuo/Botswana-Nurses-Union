import { ApplicationHistory } from "@/components/member-application-form"
import { FuneralCoverForm } from "@/components/funeral-cover-form"
import { MemberPortalShell } from "@/components/member-portal-shell"
import { getMemberPortalData } from "@/lib/member-data"
import { requireMemberPage } from "@/lib/member-auth"

export default async function FuneralInsurancePage() {
  const user = await requireMemberPage()
  const data = await getMemberPortalData(user.id)
  const applications = data.applications.filter((item) => item.application_type === "funeral_insurance")

  return (
    <MemberPortalShell profile={data.profile}>
      <div className="space-y-5">
        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <h1 className="text-3xl font-bold tracking-normal">Apply for funeral cover</h1>
          <FuneralCoverForm />
        </section>
        <ApplicationHistory title="Funeral cover status" applications={applications} />
      </div>
    </MemberPortalShell>
  )
}
