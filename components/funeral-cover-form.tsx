"use client"

import { useState } from "react"
import { FormField, FormTextArea, HiddenApplicationFields } from "@/components/member-application-form"

const coverLevels = [
  {
    label: "Standard",
    premium: 75,
    claimAmount: "Up to P10,000 funeral benefit",
    suitedFor: "Members who need affordable cover for children and basic family funeral support.",
    benefit: "Entry-level cover focused on children and essential funeral expenses.",
    details: [
      "Covers up to 4 dependent children registered on the policy",
      "Cash payout to assist with funeral transport, food, and burial costs",
      "Basic coffin or casket contribution included in the benefit value",
      "Claims guidance through BONU after required documents are submitted",
    ],
  },
  {
    label: "Enhanced",
    premium: 125,
    claimAmount: "Up to P20,000 funeral benefit",
    suitedFor: "Members who want cover for themselves plus stronger dependent protection.",
    benefit: "Balanced cover for the principal member, spouse, and children.",
    details: [
      "Covers the principal member, spouse, and up to 4 dependent children",
      "Higher cash payout for funeral service costs and family support",
      "Improved coffin or casket contribution compared with Standard",
      "Includes support for funeral transport and document-based claim processing",
    ],
  },
  {
    label: "Family",
    premium: 175,
    claimAmount: "Up to P35,000 funeral benefit",
    suitedFor: "Members supporting a household who need broader family protection.",
    benefit: "Family-focused cover with wider dependent and parent support.",
    details: [
      "Covers principal member, spouse, children, and selected extended family dependents",
      "Larger cash payout to assist with burial, catering, transport, and memorial costs",
      "Mid-range casket contribution and funeral arrangement support",
      "Suitable where the member is the main financial supporter for the household",
    ],
  },
  {
    label: "Premium",
    premium: 225,
    claimAmount: "Up to P50,000 funeral benefit",
    suitedFor: "Members who want maximum cover and the most complete family funeral support.",
    benefit: "Highest cover tier with the strongest payout and support package.",
    details: [
      "Covers principal member, spouse, children, and approved extended dependents",
      "Highest cash payout for funeral costs, family needs, and immediate expenses",
      "Premium casket contribution with broader funeral service support",
      "Best for members with larger families or higher expected funeral obligations",
    ],
  },
]

export function FuneralCoverForm() {
  const [coverLevel, setCoverLevel] = useState("")
  const [visibleCover, setVisibleCover] = useState("")
  const selectedCover = coverLevels.find((level) => level.label === coverLevel)
  const premium = selectedCover?.premium ?? 0

  return (
    <div className="mt-5 space-y-5">
      <section className="rounded-lg border bg-muted/40 p-4">
        <div className="flex flex-wrap gap-2">
          {coverLevels.map((level) => (
            <button
              className="rounded-md border bg-white px-3 py-2 text-sm font-semibold text-foreground hover:border-primary hover:text-primary"
              key={level.label}
              onClick={() => setVisibleCover((current) => (current === level.label ? "" : level.label))}
              type="button"
            >
              {visibleCover === level.label ? `Hide ${level.label}` : `View ${level.label}`}
            </button>
          ))}
        </div>
        {visibleCover ? (
          <div className="mt-4 rounded-lg border bg-white p-4">
            {coverLevels
              .filter((level) => level.label === visibleCover)
              .map((level) => (
                <div key={level.label}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold">{level.label} cover</h2>
                      <p className="mt-1 text-sm text-muted-foreground">{level.benefit}</p>
                    </div>
                    <p className="rounded-md bg-primary/10 px-3 py-2 text-sm font-bold text-primary">P{level.premium} monthly</p>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-md border bg-muted/30 p-3">
                      <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">Indicative claim value</p>
                      <p className="mt-1 text-sm font-bold">{level.claimAmount}</p>
                    </div>
                    <div className="rounded-md border bg-muted/30 p-3">
                      <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">Best suited for</p>
                      <p className="mt-1 text-sm font-bold">{level.suitedFor}</p>
                    </div>
                  </div>
                  <ul className="mt-4 grid gap-2 md:grid-cols-2">
                    {level.details.map((item) => (
                      <li className="rounded-md border bg-muted/30 p-3 text-sm" key={item}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        ) : null}
      </section>

      <form action="/api/member/applications/create" method="post" className="grid gap-4 md:grid-cols-2">
        <HiddenApplicationFields applicationType="funeral_insurance" redirectTo="/portal/funeral-insurance" />
        <label className="block">
          <span className="text-sm font-semibold">Desired cover level</span>
          <select
            className="mt-2 w-full rounded-md border bg-white px-3 py-2 outline-none"
            name="coverLevel"
            onChange={(event) => setCoverLevel(event.target.value)}
            required
            value={coverLevel}
          >
            <option value="">Select</option>
            {coverLevels.map((level) => (
              <option key={level.label} value={level.label}>
                {level.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Expected monthly premium</span>
          <input
            className="mt-2 w-full rounded-md border bg-muted px-3 py-2 outline-none"
            name="monthlyDeduction"
            readOnly
            required
            type="number"
            value={premium || ""}
          />
        </label>
        <FormField name="beneficiaryName" label="Primary beneficiary" required />
        <FormField name="beneficiaryRelationship" label="Beneficiary relationship" required />
        <FormTextArea name="dependents" label="Dependents / beneficiaries" placeholder="List dependent names and relationships" />
        <button className="rounded-md bg-primary px-4 py-3 font-semibold text-primary-foreground md:col-span-2">Submit funeral cover application</button>
      </form>
    </div>
  )
}
