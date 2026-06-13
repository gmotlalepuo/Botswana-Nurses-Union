import { ApplicationHistory } from "@/components/member-application-form"
import { LegalAidForm } from "@/components/legal-aid-form"
import { MemberPortalShell } from "@/components/member-portal-shell"
import { getMemberPortalData } from "@/lib/member-data"
import { requireMemberPage } from "@/lib/member-auth"

export default async function LegalAidPage() {
  const user = await requireMemberPage()
  const data = await getMemberPortalData(user.id)
  const applications = data.applications.filter((item) => item.application_type === "legal_aid")

  return (
    <MemberPortalShell profile={data.profile}>
      <div className="space-y-5">
        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <h1 className="text-3xl font-bold tracking-normal">Apply for legal aid insurance</h1>
          <LegalAidForm />
        </section>
        <ApplicationHistory title="Legal aid progress" applications={applications} />
      </div>
    </MemberPortalShell>
  )
}
