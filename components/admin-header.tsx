import Image from "next/image"
import Link from "next/link"
import { ClipboardList, LayoutDashboard, LogOut, UsersRound } from "lucide-react"
import { NotificationsMenu } from "@/components/notifications-menu"
import { getAdminNotifications } from "@/lib/admin-notifications"

export async function AdminHeader() {
  const notifications = await getAdminNotifications()

  return (
    <header className="bonu-header border-b bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4">
        <Link href="/back-office" className="flex items-center gap-3 text-foreground">
          <Image src="/bonu-logo.jpg" alt="BONU logo" width={44} height={44} className="bonu-brand-logo h-11 w-11 rounded-md object-contain" />
          <div>
            <p className="text-sm font-semibold text-primary">BONU Admin</p>
            <p className="text-xs text-muted-foreground">Back-office workspace</p>
          </div>
        </Link>

        <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold">
          <Link className="bonu-nav-link inline-flex items-center gap-2 rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground" href="/back-office">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <Link className="bonu-nav-link inline-flex items-center gap-2 rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground" href="/admin/complaints">
            <ClipboardList className="h-4 w-4" />
            Complaints
          </Link>
          <Link className="bonu-nav-link inline-flex items-center gap-2 rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground" href="/admin/users">
            <UsersRound className="h-4 w-4" />
            Users
          </Link>
          <NotificationsMenu actionPath="/api/admin/notifications/read" label="Alerts" notifications={notifications} />
          <form action="/api/auth/logout" method="post">
            <button className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-950 hover:bg-red-100">
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </form>
        </nav>
      </div>
    </header>
  )
}
