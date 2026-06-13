import {
  BadgeDollarSign,
  Bell,
  BriefcaseBusiness,
  FileCheck2,
  Gavel,
  HeartHandshake,
  Landmark,
  PackageCheck,
  ShieldCheck,
  Smartphone,
  UsersRound,
} from "lucide-react"

export const contact = {
  address: "Phiri Crescent, Ext 9, Plot 2684, Gaborone, Botswana",
  phone: "395 3840",
  email: "info@bonu.org.bw",
  messenger: "Botswana Nurses Union",
  whatsapp: "+267 76 042 587",
}

export const workflows = [
  "Member Registration",
  "Membership Subscription",
  "Funeral Insurance Application",
  "Legal Aid Application",
  "Loan Application",
  "Micro-Loan Issuance",
  "Merchandise Order",
  "Electronic Contract Purchase",
  "Member Campaign Activation",
]

export const services = [
  {
    title: "Membership",
    icon: UsersRound,
    description: "Register, update KYC, upload documents, track status, and download confirmation letters.",
    metric: "Active subscription",
  },
  {
    title: "Funeral Insurance",
    icon: HeartHandshake,
    description: "Apply for cover, add dependents, monitor premiums, and keep policy documents current.",
    metric: "Premium deducted monthly",
  },
  {
    title: "Legal Aid",
    icon: Gavel,
    description: "Submit legal aid requests for family, civil, labour, and complimentary legal matters.",
    metric: "Advisor assignment",
  },
  {
    title: "Loan Assistance",
    icon: Landmark,
    description: "Request support with partner-bank loans, document verification, and approval tracking.",
    metric: "Bank handoff ready",
  },
  {
    title: "BONU Micro-Loans",
    icon: BadgeDollarSign,
    description: "Apply for internal micro-loans with schedules, balances, and repayment monitoring.",
    metric: "Eligibility checked",
  },
  {
    title: "Merchandise Store",
    icon: PackageCheck,
    description: "Order uniforms, branded clothing, bags, accessories, and campaign stock.",
    metric: "Cash or credit purchase",
  },
  {
    title: "Electronic Contracts",
    icon: Smartphone,
    description: "Request phones, laptops, tablets, routers, and other approved devices on installments.",
    metric: "Agreement generated",
  },
  {
    title: "Notifications",
    icon: Bell,
    description: "Receive in-app, SMS, and email updates for approvals, payments, orders, and cases.",
    metric: "Member informed",
  },
]

export const dashboardStats = [
  { label: "Total members", value: "18,420", detail: "Across districts and regions", icon: ShieldCheck },
  { label: "Open applications", value: "236", detail: "CSR review queue", icon: FileCheck2 },
  { label: "Monthly collections", value: "P 1.8M", detail: "Subscriptions and service deductions", icon: BadgeDollarSign },
  { label: "Campaign sites", value: "14", detail: "Facility activations in progress", icon: BriefcaseBusiness },
]

export const backOfficeQueues = [
  { name: "New registrations", count: 42, sla: "4h avg", owner: "CSR Team" },
  { name: "Document verification", count: 68, sla: "1d avg", owner: "Membership Desk" },
  { name: "Loan reviews", count: 29, sla: "2d avg", owner: "Finance Desk" },
  { name: "Legal aid cases", count: 17, sla: "3d avg", owner: "Legal Partner" },
  { name: "Merchandise orders", count: 51, sla: "6h avg", owner: "Supplier Desk" },
]

export const reports = [
  "Membership revenue",
  "Funeral cover revenue",
  "Legal aid revenue",
  "Approved loans",
  "Micro-loan performance",
  "Outstanding balances",
  "Regional statistics",
  "Branch performance",
]

export const documents = [
  "National ID copy",
  "Recent payslip",
  "Employment confirmation letter",
  "Passport photo",
  "Additional supporting documents",
]

export const legalAidMatters = [
  "Child custody",
  "Divorce",
  "Breach of contracts",
  "Debt collection",
  "Unfair dismissal",
  "Disciplinary hearings",
  "Will drafting",
  "General legal advice",
]

export const dataObjects = [
  "Member profile",
  "Membership subscription",
  "Funeral insurance policy",
  "Legal aid service",
  "Loan application",
  "Micro-loan account",
  "Merchandise order",
  "Electronic contract",
  "Payment transaction",
  "Notification",
  "Report",
]

export const applicationStages = [
  { label: "Submitted", description: "Member submitted request and supporting documents." },
  { label: "CSR review", description: "Back office verifies details, documents, and service eligibility." },
  { label: "Approval", description: "Authorized officer approves, rejects, or requests more information." },
  { label: "Deduction setup", description: "Subscription, premium, loan, or installment is allocated to monthly payments." },
]

export const checkoutItems = [
  { id: "membership", name: "Monthly membership subscription", amount: 15000 },
  { id: "funeral", name: "Funeral cover premium", amount: 8500 },
  { id: "legal-aid", name: "Legal aid premium", amount: 6000 },
]

export const quickActions = [
  "Apply for membership",
  "Upload documents",
  "Pay subscription",
  "Request funeral cover",
  "Submit legal aid case",
  "Apply for micro-loan",
]
