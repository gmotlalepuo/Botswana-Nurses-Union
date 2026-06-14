export const csrApplicationTypes = [
  { slug: "membership", type: "membership", label: "Membership" },
  { slug: "funeral-insurance", type: "funeral_insurance", label: "Funeral Insurance" },
  { slug: "legal-aid", type: "legal_aid", label: "Legal Aid" },
  { slug: "external-loans", type: "loan_assistance", label: "External Loans" },
  { slug: "micro-lending", type: "micro_loan", label: "Micro-Lending" },
  { slug: "electronic-contracts", type: "electronic_contract", label: "Electronic Contracts" },
  { slug: "bundles", type: "bundle", label: "Bundles" },
] as const

export type CsrApplicationType = (typeof csrApplicationTypes)[number]

export function getCsrApplicationType(slug: string) {
  return csrApplicationTypes.find((application) => application.slug === slug)
}
