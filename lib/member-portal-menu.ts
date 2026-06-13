import {
  BadgeDollarSign,
  BriefcaseBusiness,
  FileText,
  Gavel,
  HeartHandshake,
  LayoutDashboard,
  PackageCheck,
  Smartphone,
  UserRound,
} from "lucide-react"

export const memberPortalMenu = [
  { title: "Dashboard", href: "/portal", icon: LayoutDashboard },
  { title: "Profile", href: "/portal/profile", icon: UserRound },
  { title: "Membership", href: "/portal/membership", icon: BadgeDollarSign },
  { title: "Funeral Insurance", href: "/portal/funeral-insurance", icon: HeartHandshake },
  { title: "Legal Aid", href: "/portal/legal-aid", icon: Gavel },
  { title: "External Loans", href: "/portal/external-loans", icon: BriefcaseBusiness },
  { title: "Micro-Lending", href: "/portal/micro-lending", icon: FileText },
  { title: "Shop", href: "/portal/merchandise", icon: PackageCheck },
  { title: "Electronic Contracts", href: "/portal/electronic-contracts", icon: Smartphone },
]
