"use client"

import { useState } from "react"
import { AiMimicButton } from "@/components/ai-mimic-button"
import { HiddenApplicationFields } from "@/components/member-application-form"
import { BUNDLE_PROVIDERS, BUNDLE_TERMS, BUNDLE_TYPES } from "@/lib/bundle-service"

export function BundleRequestForm() {
  const [bundleType, setBundleType] = useState("")
  const includesData = bundleType === "Data bundle" || bundleType === "Voice and data bundle"
  const includesVoice = bundleType === "Voice and data bundle"

  return (
    <form id="bundle-request-form" action="/api/member/applications/create" method="post" className="mt-6 grid gap-4 md:grid-cols-2">
      <HiddenApplicationFields applicationType="bundle" redirectTo="/portal/bundles" />
      <AiMimicButton
        formId="bundle-request-form"
        values={{
          provider: "Mascom Wireless",
          bundleType: "Data bundle",
          recipientName: "Kagiso Molefe",
          mobileNumber: "71234567",
          dataAllowance: "20 GB",
          monthlyDeduction: "350",
          termMonths: "12",
          activationDay: "25",
          purpose: "Monthly connectivity for work communication, BONU member services, and online professional development.",
        }}
        note="Tick the consent boxes after reviewing the generated information."
      />

      <FieldGroup label="Partner service provider">
        <select className="control" name="provider" required defaultValue="">
          <option value="" disabled>Select a Botswana provider</option>
          {BUNDLE_PROVIDERS.map((provider) => <option key={provider} value={provider}>{provider}</option>)}
        </select>
      </FieldGroup>

      <FieldGroup label="Bundle type">
        <select className="control" name="bundleType" required value={bundleType} onChange={(event) => setBundleType(event.target.value)}>
          <option value="">Select a bundle type</option>
          {BUNDLE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
      </FieldGroup>

      <FieldGroup label="Recipient name">
        <input className="control" name="recipientName" required maxLength={120} placeholder="Name registered for the service" />
      </FieldGroup>

      <FieldGroup label="Botswana mobile number" help="Enter 8 digits, for example 71234567.">
        <input className="control" name="mobileNumber" required inputMode="tel" pattern="(?:\+?267)?7[0-9]{7}" placeholder="71234567" />
      </FieldGroup>

      {includesData && (
        <FieldGroup label="Preferred monthly data allowance">
          <select className="control" name="dataAllowance" required defaultValue="">
            <option value="" disabled>Select an allowance</option>
            {["5 GB", "10 GB", "20 GB", "50 GB", "Unlimited / best available"].map((option) => <option key={option}>{option}</option>)}
          </select>
        </FieldGroup>
      )}

      {includesVoice && (
        <FieldGroup label="Preferred monthly voice minutes">
          <select className="control" name="voiceMinutes" required defaultValue="">
            <option value="" disabled>Select voice minutes</option>
            {["100 minutes", "250 minutes", "500 minutes", "Unlimited / best available"].map((option) => <option key={option}>{option}</option>)}
          </select>
        </FieldGroup>
      )}

      <FieldGroup label="Requested monthly amount" help="This is the maximum monthly deduction you are requesting. CSR will confirm the approved amount.">
        <div className="control flex items-center gap-2">
          <span className="shrink-0 font-semibold text-muted-foreground" aria-hidden="true">P</span>
          <input
            aria-label="Requested monthly amount in pula"
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
            name="monthlyDeduction"
            required
            type="number"
            min="10"
            max="5000"
            step="0.01"
            placeholder="350.00"
          />
        </div>
      </FieldGroup>

      <FieldGroup label="Contract term">
        <select className="control" name="termMonths" required defaultValue="">
          <option value="" disabled>Select contract term</option>
          {BUNDLE_TERMS.map((term) => <option key={term} value={term}>{term} months</option>)}
        </select>
      </FieldGroup>

      <FieldGroup label="Preferred monthly activation day" help="Choose a day from 1 to 28 to avoid month-end date differences.">
        <input className="control" name="activationDay" required type="number" min="1" max="28" placeholder="25" />
      </FieldGroup>

      <FieldGroup label="Purpose or special instructions">
        <textarea className="control min-h-28 resize-y" name="purpose" maxLength={600} placeholder="Explain how the bundle will be used or add any provider instructions." />
      </FieldGroup>

      <div className="space-y-3 rounded-lg border bg-muted/30 p-4 md:col-span-2">
        <label className="flex items-start gap-3 text-sm leading-6">
          <input className="mt-1 h-4 w-4" name="deductionConsent" required type="checkbox" value="accepted" />
          <span>I authorize BONU to include the CSR-approved bundle amount in my combined monthly membership deduction.</span>
        </label>
        <label className="flex items-start gap-3 text-sm leading-6">
          <input className="mt-1 h-4 w-4" name="informationConsent" required type="checkbox" value="accepted" />
          <span>I confirm that the recipient and mobile number are correct and may be shared with the selected service provider to fulfil this request.</span>
        </label>
      </div>

      <button className="min-h-11 rounded-md bg-primary px-4 py-3 font-semibold text-primary-foreground md:col-span-2">
        Submit bundle request
      </button>
    </form>
  )
}

function FieldGroup({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <div className="mt-2 [&_.control]:min-h-11 [&_.control]:w-full [&_.control]:rounded-md [&_.control]:border [&_.control]:bg-white [&_.control]:px-3 [&_.control]:py-2 [&_.control]:outline-none [&_.control]:focus:border-primary [&_.control]:focus:ring-2 [&_.control]:focus:ring-primary/15">
        {children}
      </div>
      {help && <span className="mt-1.5 block text-xs leading-5 text-muted-foreground">{help}</span>}
    </label>
  )
}
