import Image from "next/image"
import Link from "next/link"
import { LogOut } from "lucide-react"
import { CsrLoadingIndicator } from "@/components/csr-loading-indicator"
import { CsrNavMenu } from "@/components/csr-nav-menu"
import { NotificationsMenu } from "@/components/notifications-menu"
import { getAdminNotifications } from "@/lib/admin-notifications"

export async function CsrHeader() {
  const notifications = await getAdminNotifications()

  return (
    <>
      <CsrLoadingIndicator />
      <header className="bonu-header border-b bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <Link href="/csr" className="flex items-center gap-3 text-foreground">
            <Image src="/bonu-logo.jpg" alt="BONU logo" width={44} height={44} className="bonu-brand-logo h-11 w-11 rounded-md object-contain" />
            <div>
              <p className="text-sm font-semibold text-primary">BONU CSR Portal</p>
              <p className="text-xs text-muted-foreground">Member service processing</p>
            </div>
          </Link>

          <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold">
            <CsrNavMenu />
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
    </>
  )
}
