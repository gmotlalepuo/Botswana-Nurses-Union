"use client"

import { useState } from "react"
import { FormField, FormTextArea, HiddenApplicationFields } from "@/components/member-application-form"
import { AiMimicButton } from "@/components/ai-mimic-button"

const legalAidPlans = [
  {
    label: "Basic",
    premium: 60,
    coverValue: "Up to P5,000 annual legal support value",
    covered: "Principal member only",
    suitedFor: "Members who mainly need advice, basic document review, and early guidance.",
    benefit: "Affordable legal assistance for common workplace and personal legal questions.",
    details: [
      "Initial legal consultation for covered matters",
      "Basic review of letters, agreements, and employment notices",
      "Guidance on labour issues, debt queries, and general civil questions",
      "Referral support where the matter requires external representation",
    ],
  },
  {
    label: "Standard",
    premium: 100,
    coverValue: "Up to P12,000 annual legal support value",
    covered: "Principal member and spouse",
    suitedFor: "Members who want dependable support for work, family, and civil matters.",
    benefit: "Stronger legal support with broader matter coverage and follow-up assistance.",
    details: [
      "Consultations for labour, family, civil, and contract matters",
      "Preparation or review of basic legal correspondence",
      "Support for disciplinary hearings and workplace dispute preparation",
      "Spouse included for eligible family or civil legal matters",
    ],
  },
  {
    label: "Family",
    premium: 150,
    coverValue: "Up to P25,000 annual legal support value",
    covered: "Principal member, spouse, and dependent children",
    suitedFor: "Members who need protection for household legal needs.",
    benefit: "Family-focused legal aid for the member and immediate dependents.",
    details: [
      "Covers eligible family, custody, maintenance, civil, and labour matters",
      "Legal document preparation support for covered household matters",
      "Priority case assessment when children or dependents are affected",
      "Guidance through mediation, hearings, and settlement preparation",
    ],
  },
  {
    label: "Executive",
    premium: 220,
    coverValue: "Up to P45,000 annual legal support value",
    covered: "Principal member, spouse, children, and approved dependents",
    suitedFor: "Members who want the widest legal protection and higher support limits.",
    benefit: "Premium legal assistance with the broadest household cover and priority handling.",
    details: [
      "Highest support limit for covered labour, civil, family, and contract matters",
      "Priority legal partner assignment after CSR verification",
      "Enhanced preparation for hearings, negotiations, and settlement discussions",
      "Extended dependent consideration for approved household legal matters",
    ],
  },
]

export function LegalAidForm() {
  const [plan, setPlan] = useState("")
  const [visiblePlan, setVisiblePlan] = useState("")
  const selectedPlan = legalAidPlans.find((item) => item.label === plan)
  const premium = selectedPlan?.premium ?? 0

  return (
    <div className="mt-5 space-y-5">
      <section className="rounded-lg border bg-muted/40 p-4">
        <div className="flex flex-wrap gap-2">
          {legalAidPlans.map((item) => (
            <button
              className="rounded-md border bg-white px-3 py-2 text-sm font-semibold text-foreground hover:border-primary hover:text-primary"
              key={item.label}
              onClick={() => setVisiblePlan((current) => (current === item.label ? "" : item.label))}
              type="button"
            >
              {visiblePlan === item.label ? `Hide ${item.label}` : `View ${item.label}`}
            </button>
          ))}
        </div>
        {visiblePlan ? (
          <div className="mt-4 rounded-lg border bg-white p-4">
            {legalAidPlans
              .filter((item) => item.label === visiblePlan)
              .map((item) => (
                <div key={item.label}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold">{item.label} legal aid</h2>
                      <p className="mt-1 text-sm text-muted-foreground">{item.benefit}</p>
                    </div>
                    <p className="rounded-md bg-primary/10 px-3 py-2 text-sm font-bold text-primary">P{item.premium} monthly</p>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-md border bg-muted/30 p-3">
                      <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">Support value</p>
                      <p className="mt-1 text-sm font-bold">{item.coverValue}</p>
                    </div>
                    <div className="rounded-md border bg-muted/30 p-3">
                      <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">Who is covered</p>
                      <p className="mt-1 text-sm font-bold">{item.covered}</p>
                    </div>
                    <div className="rounded-md border bg-muted/30 p-3">
                      <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">Best suited for</p>
                      <p className="mt-1 text-sm font-bold">{item.suitedFor}</p>
                    </div>
                  </div>
                  <ul className="mt-4 grid gap-2 md:grid-cols-2">
                    {item.details.map((detail) => (
                      <li className="rounded-md border bg-muted/30 p-3 text-sm" key={detail}>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        ) : null}
      </section>

      <form id="legal-aid-application" action="/api/member/applications/create" method="post" className="grid gap-4 md:grid-cols-2">
        <HiddenApplicationFields applicationType="legal_aid" redirectTo="/portal/legal-aid" />
        <AiMimicButton
          formId="legal-aid-application"
          values={{
            legalAidPlan: "Standard",
            beneficiaryName: "Thabo Molefe",
            beneficiaryRelationship: "Spouse",
            alternativeBeneficiaryName: "Naledi Molefe",
            alternativeBeneficiaryRelationship: "Sister",
            coveredDependents: "Kagiso Molefe - son\nBoitumelo Molefe - daughter",
            supportingNotes: "Member works at Princess Marina Hospital in Gaborone. Preferred contact time is after 16:30 on weekdays.",
          }}
        />
        <label className="block">
          <span className="text-sm font-semibold">Legal aid plan</span>
          <select className="mt-2 w-full rounded-md border bg-white px-3 py-2 outline-none" name="legalAidPlan" onChange={(event) => setPlan(event.target.value)} required value={plan}>
            <option value="">Select</option>
            {legalAidPlans.map((item) => (
              <option key={item.label} value={item.label}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Expected monthly premium</span>
          <input className="mt-2 w-full rounded-md border bg-muted px-3 py-2 outline-none" name="monthlyDeduction" readOnly required type="number" value={premium || ""} />
        </label>
        <FormField name="beneficiaryName" label="Primary beneficiary" required />
        <FormField name="beneficiaryRelationship" label="Beneficiary relationship" required />
        <FormField name="alternativeBeneficiaryName" label="Alternative beneficiary" />
        <FormField name="alternativeBeneficiaryRelationship" label="Alternative beneficiary relationship" />
        <FormTextArea name="coveredDependents" label="Covered dependents / beneficiaries" placeholder="List spouse, children, or approved dependents to be covered by the plan" />
        <FormTextArea name="supportingNotes" label="Supporting information" placeholder="Add notes about dependents, preferred contact times, or any existing legal insurance arrangements" />
        <button className="rounded-md bg-primary px-4 py-3 font-semibold text-primary-foreground md:col-span-2">Submit legal aid insurance application</button>
      </form>
    </div>
  )
}
