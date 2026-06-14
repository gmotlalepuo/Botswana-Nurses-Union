import Image from "next/image"
import Link from "next/link"
import { LogOut } from "lucide-react"
import { MemberLoadingIndicator } from "@/components/member-loading-indicator"
import { MemberTopMenu } from "@/components/member-top-menu"
import { NotificationsMenu } from "@/components/notifications-menu"
import type { MemberProfile } from "@/lib/member-data"
import { getMemberNotifications } from "@/lib/member-notifications"

export async function MemberPortalShell({
  profile,
  children,
}: {
  profile: MemberProfile | null
  children: React.ReactNode
}) {
  const isActive = profile?.status === "active"
  const notifications = await getMemberNotifications(profile?.id ?? "")

  return (
    <main className="bonu-shell min-h-screen bg-background">
      <MemberLoadingIndicator />
      <header className="bonu-header border-b bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <Link href="/portal" className="flex items-center gap-3 text-foreground">
            <Image src="/bonu-logo.jpg" alt="BONU logo" width={44} height={44} className="bonu-brand-logo h-11 w-11 rounded-md object-contain" />
            <div>
              <p className="text-sm font-semibold text-primary">BONU Self Service</p>
              <p className="text-xs text-muted-foreground">{profile?.full_name ?? "Member self-service"}</p>
            </div>
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <div className={`rounded-md border px-3 py-2 text-sm ${isActive ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-transparent bg-muted text-foreground"}`}>
              <span className={isActive ? "text-emerald-700" : "text-muted-foreground"}>Status: </span>
              <span className="font-bold capitalize">{profile?.status ?? "Pending profile"}</span>
            </div>
            <NotificationsMenu actionPath="/api/member/notifications/read" notifications={notifications} />
            <form action="/api/auth/logout" method="post">
              <button className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-950 hover:bg-red-100">
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </form>
          </div>
        </div>
        <MemberTopMenu />
      </header>
      <section className="bonu-content mx-auto max-w-7xl px-5 py-7">
        <div className="min-w-0">{children}</div>
      </section>
    </main>
  )
}
