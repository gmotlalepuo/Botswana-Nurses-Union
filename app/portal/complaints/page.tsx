import { MessageSquareWarning, Send } from "lucide-react"
import { AiMimicButton } from "@/components/ai-mimic-button"
import { MemberComplaintHistory } from "@/components/member-complaint-history"
import { MemberPortalShell } from "@/components/member-portal-shell"
import { getMemberPortalData } from "@/lib/member-data"
import { requireCompleteMemberPage } from "@/lib/member-auth"

const categories = ["Membership", "Payments", "Funeral Insurance", "Legal Aid", "External Loans", "Micro-Lending", "Shop", "Electronic Contracts", "Bundles", "Profile", "Other"]

export default async function MemberComplaintsPage() {
  const { user } = await requireCompleteMemberPage()
  const data = await getMemberPortalData(user.id)

  return (
    <MemberPortalShell profile={data.profile}>
      <div className="space-y-5">
        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="rounded-lg bg-primary/10 p-3 text-primary">
              <MessageSquareWarning className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-3xl font-bold tracking-normal">Complaints</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                Submit a complaint to the CSR team and follow its status, response, and resolution.
              </p>
            </div>
          </div>

          <form id="member-complaint-form" action="/api/member/complaints" method="post" className="mt-6 grid gap-4 md:grid-cols-2">
            <AiMimicButton
              formId="member-complaint-form"
              values={{
                subject: "Monthly deduction is not showing in my payment history",
                category: "Payments",
                priority: "high",
                description: "My June 2026 BONU deduction was processed through Gaborone City Council payroll, but it is not reflected in my member payment history. The deduction appears on my payslip under BONU member services. Please verify the payment against my Omang details and update my membership record.",
              }}
              note="This is demonstration information. Replace it with the member's actual complaint before submitting."
            />
            <label className="block md:col-span-2">
              <span className="text-sm font-semibold">Subject</span>
              <input className="mt-2 min-h-11 w-full rounded-md border px-3 py-2 outline-none focus:border-primary" name="subject" maxLength={160} required placeholder="Brief summary of the issue" />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Category</span>
              <select className="mt-2 min-h-11 w-full rounded-md border bg-white px-3 py-2 outline-none focus:border-primary" name="category" required defaultValue="">
                <option value="" disabled>Select a category</option>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Priority</span>
              <select className="mt-2 min-h-11 w-full rounded-md border bg-white px-3 py-2 outline-none focus:border-primary" name="priority" defaultValue="medium">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm font-semibold">Description</span>
              <textarea className="mt-2 min-h-36 w-full rounded-md border px-3 py-2 outline-none focus:border-primary" name="description" maxLength={3000} required placeholder="Explain what happened, when it happened, and what assistance you need." />
            </label>
            <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 font-semibold text-primary-foreground md:col-span-2">
              <Send className="h-4 w-4" />
              Submit complaint
            </button>
          </form>
        </section>

        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold">Complaint history</h2>
          <p className="mt-1 text-sm text-muted-foreground">Search, filter, sort, and review updates from the CSR team.</p>
          <div className="mt-4">
            <MemberComplaintHistory complaints={data.complaints} />
          </div>
        </section>
      </div>
    </MemberPortalShell>
  )
}
