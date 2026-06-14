import {
  BadgeDollarSign,
  BriefcaseBusiness,
  ClipboardPlus,
  FileText,
  Gavel,
  HeartHandshake,
  LayoutDashboard,
  PackageCheck,
  MessageSquareWarning,
  RadioTower,
  Smartphone,
  UserRound,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

type MemberPortalLink = {
  title: string
  href: string
  icon: LucideIcon
  children?: never
}

type MemberPortalGroup = {
  title: string
  icon: LucideIcon
  children: MemberPortalLink[]
  href?: never
}

export const memberPortalMenu: Array<MemberPortalLink | MemberPortalGroup> = [
  { title: "Dashboard", href: "/portal", icon: LayoutDashboard },
  { title: "Profile", href: "/portal/profile", icon: UserRound },
  { title: "Membership", href: "/portal/membership", icon: BadgeDollarSign },
  {
    title: "New Application",
    icon: ClipboardPlus,
    children: [
      { title: "Funeral Insurance", href: "/portal/funeral-insurance", icon: HeartHandshake },
      { title: "Legal Aid", href: "/portal/legal-aid", icon: Gavel },
      { title: "External Loans", href: "/portal/external-loans", icon: BriefcaseBusiness },
      { title: "Micro-Lending", href: "/portal/micro-lending", icon: FileText },
    ],
  },
  { title: "Shop", href: "/portal/merchandise", icon: PackageCheck },
  { title: "Electronic Contracts", href: "/portal/electronic-contracts", icon: Smartphone },
  { title: "Bundles", href: "/portal/bundles", icon: RadioTower },
  { title: "Complaints", href: "/portal/complaints", icon: MessageSquareWarning },
]
