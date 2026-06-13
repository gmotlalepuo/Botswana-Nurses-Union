"use client"

import { useState } from "react"
import { FormField, FormSelect, FormTextArea, HiddenApplicationFields } from "@/components/member-application-form"

const loanTypes = [
  {
    label: "Personal loan",
    benefit: "General-purpose borrowing for personal expenses such as school fees, household needs, travel, or emergencies.",
    suitedFor: "Members who need flexible short- to medium-term financial assistance.",
    criteria: ["Stable income and affordability assessment", "Valid proof of identity", "Recent payslip or bank statement"],
  },
  {
    label: "Mortgage",
    benefit: "Longer-term financing for purchasing, building, or improving a residential property.",
    suitedFor: "Members planning to buy, build, or renovate a home.",
    criteria: ["Proof of income and employment", "Property details or sale agreement", "Deposit or equity may be required"],
  },
  {
    label: "Tractor loan",
    benefit: "Financing support for tractors, agricultural implements, or related farming equipment.",
    suitedFor: "Members investing in farming, agricultural production, or equipment-based income activity.",
    criteria: ["Supplier quotation", "Business or farming activity details", "Repayment plan supported by income"],
  },
]

export function ExternalLoansForm() {
  const [visibleLoan, setVisibleLoan] = useState("")

  return (
    <div className="mt-5 space-y-5">
      <section className="rounded-lg border bg-muted/40 p-4">
        <div className="flex flex-wrap gap-2">
          {loanTypes.map((item) => (
            <button
              className="rounded-md border bg-white px-3 py-2 text-sm font-semibold text-foreground hover:border-primary hover:text-primary"
              key={item.label}
              onClick={() => setVisibleLoan((current) => (current === item.label ? "" : item.label))}
              type="button"
            >
              {visibleLoan === item.label ? `Hide ${item.label}` : `View ${item.label}`}
            </button>
          ))}
        </div>
        {visibleLoan ? (
          <div className="mt-4 rounded-lg border bg-white p-4">
            {loanTypes
              .filter((item) => item.label === visibleLoan)
              .map((item) => (
                <div key={item.label}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold">{item.label}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">{item.benefit}</p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-md border bg-muted/30 p-3">
                    <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">Best suited for</p>
                    <p className="mt-1 text-sm font-bold">{item.suitedFor}</p>
                  </div>
                  <ul className="mt-4 grid gap-2 md:grid-cols-3">
                    {item.criteria.map((criterion) => (
                      <li className="rounded-md border bg-muted/30 p-3 text-sm" key={criterion}>
                        {criterion}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        ) : null}
      </section>

      <form action="/api/member/applications/create" method="post" className="grid gap-4 md:grid-cols-2">
        <HiddenApplicationFields applicationType="loan_assistance" redirectTo="/portal/external-loans" />
        <FormSelect name="loanType" label="Type of loan" required options={loanTypes.map((loan) => loan.label)} />
        <FormSelect name="preferredBank" label="Preferred bank" required options={["Bank Gaborone", "BancABC", "FNBB", "Stanbic", "Absa", "Other partner institution"]} />
        <FormField name="requestedAmount" label="Requested amount" type="number" required />
        <FormField name="termMonths" label="Preferred term in months" type="number" required />
        <FormTextArea name="loanPurpose" label="Loan purpose" required />
        <button className="rounded-md bg-primary px-4 py-3 font-semibold text-primary-foreground md:col-span-2">Submit loan assistance request</button>
      </form>
    </div>
  )
}
