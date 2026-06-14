import { MemberProfileForm } from "@/components/member-profile-form"
import { MemberPortalShell } from "@/components/member-portal-shell"
import { ProfilePreviewTrigger } from "@/components/profile-preview-trigger"
import { calculateProfileCompletion, getMemberPortalData } from "@/lib/member-data"
import { requireMemberPage } from "@/lib/member-auth"

export default async function ProfilePage() {
  const user = await requireMemberPage()
  const data = await getMemberPortalData(user.id)
  const completion = calculateProfileCompletion(data.profile, data.documents)

  return (
    <MemberPortalShell profile={data.profile}>
      <div className="space-y-5">
        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold tracking-normal">Manage profile</h1>
                <ProfilePreviewTrigger />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Keep your personal, contact, employment, and supporting document information up to date.</p>
            </div>
            <div className="w-full max-w-xs rounded-lg bg-muted p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">Profile completion</p>
                <p className="text-xl font-bold">{completion}%</p>
              </div>
              <div className="mt-3 h-2 rounded-full bg-white">
                <div className="h-2 rounded-full bg-primary" style={{ width: `${completion}%` }} />
              </div>
            </div>
          </div>
        </section>

        <MemberProfileForm profile={data.profile} email={user.email} memberDocuments={data.documents} />
      </div>
    </MemberPortalShell>
  )
}
