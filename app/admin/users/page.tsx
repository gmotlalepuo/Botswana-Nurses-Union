import Link from "next/link"
import { ShieldCheck, UserPlus } from "lucide-react"
import { AdminHeader } from "@/components/admin-header"
import { AdminUsersTable } from "@/components/admin-users-table"
import { requireAdminPage } from "@/lib/admin-auth"
import { getStaffUsers } from "@/lib/admin-reports"

export default async function AdminUsersPage() {
  await requireAdminPage()
  const staffUsers = await getStaffUsers()

  return (
    <main className="bonu-shell min-h-screen bg-background">
      <AdminHeader />
      <section className="bonu-content mx-auto max-w-5xl px-5 py-8">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="mt-6 flex items-start gap-3">
          <div className="rounded-md bg-primary/10 p-3 text-primary">
            <UserPlus className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-normal text-primary">Admin</p>
            <h1 className="text-3xl font-bold tracking-normal">Create staff user</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Admin users can create CSR and admin staff accounts. Nurse/member accounts should use the public registration page.
            </p>
          </div>
        </div>

        <form action="/api/admin/users" method="post" className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className="text-sm font-semibold">Full name</span>
            <input className="mt-2 w-full rounded-md border px-3 py-2 outline-none" name="fullName" placeholder="Staff full name" required />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Email address</span>
            <input className="mt-2 w-full rounded-md border px-3 py-2 outline-none" name="email" type="email" placeholder="staff@bonu.org.bw" required />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Temporary password</span>
            <input className="mt-2 w-full rounded-md border px-3 py-2 outline-none" name="password" type="password" required />
          </label>
          <label className="block md:col-span-2">
            <span className="text-sm font-semibold">Role</span>
            <select className="mt-2 w-full rounded-md border bg-white px-3 py-2 outline-none" name="role" defaultValue="csr">
              <option value="csr">CSR</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <button className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 font-semibold text-primary-foreground md:col-span-2">
            <ShieldCheck className="h-4 w-4" />
            Create user
          </button>
        </form>

        <section className="mt-8">
          <h2 className="text-xl font-bold">Users</h2>
          <div className="mt-4">
            <AdminUsersTable users={staffUsers} />
          </div>
        </section>
        </div>
      </section>
    </main>
  )
}
