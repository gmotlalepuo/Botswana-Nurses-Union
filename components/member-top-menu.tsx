"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { Check, ChevronDown } from "lucide-react"
import { memberPortalMenu } from "@/lib/member-portal-menu"

export function MemberTopMenu() {
  const pathname = usePathname()

  return (
    <nav className="border-t border-white/60 bg-white/45">
      <div className="bonu-nav mx-auto flex max-w-7xl gap-1 overflow-x-auto px-5 py-2">
        {memberPortalMenu.map((item) => {
          const Icon = item.icon
          const active = item.children
            ? item.children.some((child) => pathname === child.href)
            : pathname === item.href

          if (item.children) {
            return (
              <DropdownMenu.Root key={item.title}>
                <DropdownMenu.Trigger asChild>
                  <button
                    aria-label="Choose a new application"
                    data-active={active}
                    className={`bonu-nav-link inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                      active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-white/70 hover:text-foreground"
                    }`}
                    type="button"
                  >
                    <Icon className="h-4 w-4" />
                    {item.title}
                    <ChevronDown className="h-4 w-4" aria-hidden="true" />
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
