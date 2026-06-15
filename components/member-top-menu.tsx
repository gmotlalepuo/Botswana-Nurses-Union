"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { Check, ChevronDown, ChevronUp, LockKeyhole, Menu, X } from "lucide-react"
import { memberPortalMenu } from "@/lib/member-portal-menu"

export function MemberTopMenu({
  isActive,
  profileComplete,
}: {
  isActive: boolean
  profileComplete: boolean
}) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileApplicationsOpen, setMobileApplicationsOpen] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
    setMobileApplicationsOpen(false)
  }, [pathname])

  return (
    <nav className="border-t border-white/60 bg-white/45">
      <div className="mx-auto max-w-7xl px-5 py-2 lg:hidden">
        <button
          aria-controls="member-mobile-navigation"
          aria-expanded={mobileOpen}
          className="flex min-h-11 w-full items-center justify-between gap-3 rounded-md border border-white/70 bg-white/75 px-4 py-2 text-sm font-bold text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          onClick={() => setMobileOpen((open) => !open)}
          type="button"
        >
          <span className="flex items-center gap-2">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            Portal menu
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${mobileOpen ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>

        {mobileOpen && (
          <div id="member-mobile-navigation" className="mt-2 space-y-1 rounded-lg border bg-white p-2 shadow-lg">
            {memberPortalMenu.map((item) => {
              const Icon = item.icon
              const active = item.children
                ? item.children.some((child) => pathname === child.href)
                : pathname === item.href
              const locked = item.children
                ? !isActive
                : item.href === "/portal/membership"
                  ? !profileComplete
                  : ["/portal/merchandise", "/portal/electronic-contracts", "/portal/bundles"].includes(item.href)
                    ? !isActive
                    : false

              if (item.children) {
                return (
                  <div key={item.title}>
                    <button
                      aria-expanded={!locked && mobileApplicationsOpen}
                      className={`flex min-h-11 w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
                        active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
                      }`}
                      disabled={locked}
                      onClick={() => setMobileApplicationsOpen((open) => !open)}
                      type="button"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="flex-1">{item.title}</span>
                      {locked ? (
                        <LockKeyhole className="h-4 w-4" aria-label="Locked until membership is active" />
                      ) : mobileApplicationsOpen ? (
                        <ChevronUp className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                    {!locked && mobileApplicationsOpen && (
                      <div className="ml-4 mt-1 space-y-1 border-l pl-2">
                        {item.children.map((child) => {
                          const ChildIcon = child.icon
                          const childActive = pathname === child.href

                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={`flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold ${
                                childActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
                              }`}
                              onClick={() => setMobileOpen(false)}
                            >
                              <ChildIcon className="h-4 w-4" />
                              <span className="flex-1">{child.title}</span>
                              {childActive && <Check className="h-4 w-4" aria-label="Current page" />}
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              }

              if (locked) {
                return (
                  <span
                    key={item.href}
                    className="flex min-h-11 cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground opacity-50"
                    title={profileComplete ? "Activate membership to unlock this service" : "Complete your profile to unlock membership"}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="flex-1">{item.title}</span>
                    <LockKeyhole className="h-4 w-4" />
                  </span>
                )
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold ${
                    active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <div className="bonu-nav mx-auto hidden max-w-7xl gap-1 overflow-x-auto px-5 py-2 lg:flex">
        {memberPortalMenu.map((item) => {
          const Icon = item.icon
          const active = item.children
            ? item.children.some((child) => pathname === child.href)
            : pathname === item.href
          const locked = item.children
            ? !isActive
            : item.href === "/portal/membership"
              ? !profileComplete
              : ["/portal/merchandise", "/portal/electronic-contracts", "/portal/bundles"].includes(item.href)
                ? !isActive
                : false

          if (item.children) {
            return (
              <DropdownMenu.Root key={item.title}>
                <DropdownMenu.Trigger asChild>
                  <button
                    aria-label="Choose a new application"
                    data-active={active}
                    className={`bonu-nav-link inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                      active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-white/70 hover:text-foreground"
                    }`}
                    disabled={locked}
                    type="button"
                  >
                    <Icon className="h-4 w-4" />
                    {item.title}
                    {locked ? <LockKeyhole className="h-4 w-4" aria-label="Locked until membership is active" /> : <ChevronDown className="h-4 w-4" aria-hidden="true" />}
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    align="start"
                    className="z-[80] min-w-64 rounded-lg border bg-white p-2 shadow-xl"
                    sideOffset={8}
                  >
                    <DropdownMenu.Label className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Select a service
                    </DropdownMenu.Label>
                    {item.children.map((child) => {
                      const ChildIcon = child.icon
                      const childActive = pathname === child.href

                      return (
                        <DropdownMenu.Item key={child.href} asChild>
                          <Link
                            href={child.href}
                            className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-foreground outline-none hover:bg-primary/10 focus:bg-primary/10"
                          >
                            <ChildIcon className="h-4 w-4 text-primary" />
                            <span className="flex-1">{child.title}</span>
                            {childActive && <Check className="h-4 w-4 text-primary" aria-label="Current page" />}
                          </Link>
                        </DropdownMenu.Item>
                      )
                    })}
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            )
          }

          if (locked) {
            return (
              <span
                key={item.href}
                className="bonu-nav-link inline-flex shrink-0 cursor-not-allowed items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground opacity-50"
                title={profileComplete ? "Activate membership to unlock this service" : "Complete your profile to unlock membership"}
              >
                <Icon className="h-4 w-4" />
                {item.title}
                <LockKeyhole className="h-3.5 w-3.5" />
              </span>
            )
          }

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
