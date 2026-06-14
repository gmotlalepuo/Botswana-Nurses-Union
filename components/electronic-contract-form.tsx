"use client"

import { useState } from "react"
import { FormField, FormSelect, HiddenApplicationFields } from "@/components/member-application-form"
import { AiMimicButton } from "@/components/ai-mimic-button"

const products = ["Mobile phone", "Laptop", "Tablet", "Router", "Other approved electronic device"]

export function ElectronicContractForm() {
  const [product, setProduct] = useState("")
  const isOtherProduct = product === "Other approved electronic device"

  return (
    <form id="electronic-contract-application" action="/api/member/applications/create" method="post" className="mt-5 grid gap-4 md:grid-cols-2">
      <HiddenApplicationFields applicationType="electronic_contract" redirectTo="/portal/electronic-contracts" />
      <AiMimicButton
        formId="electronic-contract-application"
        values={{
          product: "Mobile phone",
          brandModel: "Samsung Galaxy A55 5G",
          requestedAmount: "6500",
          termMonths: "24",
          monthlyDeduction: "300",
        }}
      />
      <label className="block">
        <span className="text-sm font-semibold">Product</span>
        <select className="mt-2 w-full rounded-md border bg-white px-3 py-2 outline-none" name="product" required value={product} onChange={(event) => setProduct(event.target.value)}>
          <option value="">Select</option>
          {products.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      {isOtherProduct ? <FormField name="otherProductName" label="Product name" required /> : null}
      <FormField name="brandModel" label="Preferred brand/model" />
      <FormField name="requestedAmount" label="Estimated product amount" type="number" required />
      <FormField name="termMonths" label="Installment term in months" type="number" required />
      <FormField name="monthlyDeduction" label="Expected monthly installment" type="number" required />
      <button className="rounded-md bg-primary px-4 py-3 font-semibold text-primary-foreground md:col-span-2">Submit contract request</button>
    </form>
  )
}
