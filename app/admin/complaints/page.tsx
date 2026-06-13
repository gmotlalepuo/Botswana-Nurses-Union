import { ClipboardList, PlusCircle } from "lucide-react"
import { AdminComplaintsTable } from "@/components/admin-complaints-table"
import { AdminHeader } from "@/components/admin-header"
import { requireAdminPage } from "@/lib/admin-auth"
import { getAdminComplaints } from "@/lib/admin-complaints"

export default async function AdminComplaintsPage() {
  await requireAdminPage()
  const complaints = await getAdminComplaints()

  return (
    <main className="bonu-shell min-h-screen bg-background">
      <AdminHeader />
      <section className="bonu-content mx-auto max-w-7xl px-5 py-8">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-primary/10 p-3 text-primary">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-normal text-primary">Complaints</p>
            <h1 className="text-3xl font-bold tracking-normal">Complaint management</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Log, triage, update, resolve, search, filter, sort, and export member complaints.
            </p>
          </div>
        </div>

        <section className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Create complaint</h2>
          </div>
          <form action="/api/admin/complaints" method="post" className="mt-4 grid gap-4 md:grid-cols-2">
            <input type="hidden" name="action" value="create" />
            <label className="block md:col-span-2">
              <span className="text-sm font-semibold">Subject</span>
              <input className="mt-2 w-full rounded-md border px-3 py-2 outline-none" name="subject" placeholder="Complaint subject" required />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Category</span>
              <input className="mt-2 w-full rounded-md border px-3 py-2 outline-none" name="category" placeholder="Membership, payments, legal aid..." defaultValue="General" required />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Priority</span>
              <select className="mt-2 w-full rounded-md border bg-white px-3 py-2 outline-none" name="priority" defaultValue="medium">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm font-semibold">Description</span>
              <textarea className="mt-2 min-h-28 w-full rounded-md border px-3 py-2 outline-none" name="description" placeholder="Describe the complaint" required />
            </label>
            <button className="rounded-md bg-primary px-4 py-3 font-semibold text-primary-foreground md:col-span-2">Create complaint</button>
          </form>
        </section>

        <section className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Complaints register</h2>
          <div className="mt-4">
            <AdminComplaintsTable complaints={complaints} />
          </div>
        </section>
      </section>
    </main>
  )
}
