"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { memberPortalMenu } from "@/lib/member-portal-menu"

export function MemberTopMenu() {
  const pathname = usePathname()

  return (
    <nav className="border-t border-white/60 bg-white/45">
      <div className="bonu-nav mx-auto flex max-w-7xl gap-1 overflow-x-auto px-5 py-2">
        {memberPortalMenu.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              data-active={active}
              className={`bonu-nav-link inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${
                active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-white/70 hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
