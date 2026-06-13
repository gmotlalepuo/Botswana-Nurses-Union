"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Boxes, ChevronDown, ClipboardCheck, CreditCard, FileCheck2, MessageSquareWarning, ShoppingBag, UsersRound } from "lucide-react"
import { csrApplicationTypes } from "@/lib/csr-application-types"

const primaryMenu = [
  { href: "/csr", label: "Overview", icon: BarChart3 },
  { href: "/csr/members", label: "Members", icon: UsersRound },
  { href: "/csr/documents", label: "Documents", icon: FileCheck2 },
]

const secondaryMenu = [
  { href: "/csr/products", label: "Merchandise", icon: Boxes },
  { href: "/csr/orders", label: "Orders", icon: ShoppingBag },
  { href: "/csr/payments", label: "Payments", icon: CreditCard },
  { href: "/csr/complaints", label: "Complaints", icon: MessageSquareWarning },
]

export function CsrNavMenu() {
  const pathname = usePathname()

  return (
    <>
      {primaryMenu.map((item) => {
        const Icon = item.icon
        const active = pathname === item.href

        return (
          <Link
            key={item.href}
            data-active={active}
            className={`bonu-nav-link inline-flex items-center gap-2 rounded-md px-3 py-2 ${
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            href={item.href}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        )
      })}
      <details className="group relative">
        <summary
          className={`bonu-nav-link flex cursor-pointer list-none items-center gap-2 rounded-md px-3 py-2 [&::-webkit-details-marker]:hidden ${
            pathname.startsWith("/csr/applications")
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <ClipboardCheck className="h-4 w-4" />
          Applications
          <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
        </summary>
        <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-lg border bg-white p-2 text-foreground shadow-xl">
          {csrApplicationTypes.map((application) => {
            const href = `/csr/applications/${application.slug}`
            return (
              <Link
                key={application.type}
                className={`block rounded-md px-3 py-2 ${pathname === href ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}
                href={href}
              >
                {application.label}
              </Link>
            )
          })}
        </div>
      </details>
      {secondaryMenu.map((item) => {
        const Icon = item.icon
        const active = pathname === item.href

        return (
          <Link
            key={item.href}
            data-active={active}
            className={`bonu-nav-link inline-flex items-center gap-2 rounded-md px-3 py-2 ${
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            href={item.href}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        )
      })}
    </>
  )
}
