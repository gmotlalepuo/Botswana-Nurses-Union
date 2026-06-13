import { ElectronicContractHistory } from "@/components/electronic-contract-history"
import { ElectronicContractForm } from "@/components/electronic-contract-form"
import { MemberPortalShell } from "@/components/member-portal-shell"
import { getMemberPortalData } from "@/lib/member-data"
import { requireMemberPage } from "@/lib/member-auth"

export default async function ElectronicContractsPage() {
  const user = await requireMemberPage()
  const data = await getMemberPortalData(user.id)
  const applications = data.applications.filter((item) => item.application_type === "electronic_contract")

  return (
    <MemberPortalShell profile={data.profile}>
      <div className="space-y-5">
        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <h1 className="text-3xl font-bold tracking-normal">Request devices on installment contract</h1>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {["Installment plan calculation", "Electronic agreement generation", "Monthly deductions tracking"].map((item) => <p key={item} className="rounded-md bg-muted p-3 text-sm font-semibold">{item}</p>)}
          </div>
          <ElectronicContractForm />
        </section>
        <ElectronicContractHistory applications={applications} />
      </div>
    </MemberPortalShell>
  )
}
