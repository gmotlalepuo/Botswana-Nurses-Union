"use client"

import { useState } from "react"
import { Download, ExternalLink, FileUp, MonitorDown, Smartphone } from "lucide-react"
import { FormField, FormTextArea, HiddenApplicationFields } from "@/components/member-application-form"
import { AiMimicButton } from "@/components/ai-mimic-button"

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
  const [addDependants, setAddDependants] = useState(false)
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

      <form id="funeral-cover-application" action="/api/member/applications/create" method="post" encType="multipart/form-data" className="grid gap-4 md:grid-cols-2">
        <HiddenApplicationFields applicationType="funeral_insurance" redirectTo="/portal/funeral-insurance" />
        <AiMimicButton
          formId="funeral-cover-application"
          values={{
            coverLevel: "Enhanced",
            beneficiaryName: "Naledi Molefe",
            beneficiaryRelationship: "Sister",
            dependents: "Kagiso Molefe - son, age 12\nBoitumelo Molefe - daughter, age 8\nThabo Molefe - spouse",
          }}
        />
        <section className="space-y-5 rounded-xl border bg-primary/5 p-5 md:col-span-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-primary">Funeral cover onboarding</p>
            <h2 className="mt-1 text-xl font-bold">Complete and upload the funeral forms</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Download the editable Funeral Policy Form, complete and sign it, then upload the saved PDF below. Use the Additional Member Funeral Form only when adding dependants or extended family.
            </p>
          </div>

          <div className="rounded-lg border border-primary/20 bg-white p-4">
            <div className="flex items-start gap-3">
              <MonitorDown className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-bold">Adobe Acrobat Reader can help</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Acrobat Reader reliably saves editable fields and signatures. After filling the form, save it to your device before uploading.
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <ReaderLink href="https://get.adobe.com/reader/" label="Computer" icon={<MonitorDown className="h-4 w-4" />} />
              <ReaderLink href="https://apps.apple.com/app/adobe-acrobat-reader-edit-pdf/id469337564" label="iPhone / iPad" icon={<Smartphone className="h-4 w-4" />} />
              <ReaderLink href="https://play.google.com/store/apps/details?id=com.adobe.reader" label="Android" icon={<Smartphone className="h-4 w-4" />} />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <FuneralDocumentCard
              name="Funeral Policy Form"
              href="/forms/funeral-policy-form.pdf"
              description="Required for every funeral cover application."
              required
            />
            <FuneralDocumentCard
              name="Additional Member Funeral Form"
              href="/forms/additional-member-funeral-form.pdf"
              description="Complete this only when adding dependants, parents or extended family."
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <UploadField name="Funeral Policy Form" required />
            <div>
              <label className="flex min-h-11 items-start gap-3 rounded-lg border bg-white p-4">
                <input
                  className="mt-1 h-4 w-4"
                  name="addDependants"
                  type="checkbox"
                  value="accepted"
                  checked={addDependants}
                  onChange={(event) => setAddDependants(event.target.checked)}
                />
                <span>
                  <span className="block text-sm font-semibold">I am adding dependants or extended family</span>
                  <span className="mt-1 block text-xs text-muted-foreground">The additional member form becomes required.</span>
                </span>
              </label>
              {addDependants && <div className="mt-3"><UploadField name="Additional Member Funeral Form" required /></div>}
            </div>
          </div>
        </section>
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

function ReaderLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <a
      className="inline-flex min-h-11 items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm font-semibold text-primary hover:bg-muted"
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      {icon}
      {label}
      <ExternalLink className="h-3.5 w-3.5" />
    </a>
  )
}

function FuneralDocumentCard({
  name,
  href,
  description,
  required = false,
}: {
  name: string
  href: string
  description: string
  required?: boolean
}) {
  return (
    <article className={`rounded-lg border bg-white p-4 ${required ? "border-primary/40 ring-2 ring-primary/10" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold">{name}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${required ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
          {required ? "Required" : "Optional"}
        </span>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <a className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground" href={href} download>
          <Download className="h-4 w-4" />
          Download PDF
        </a>
        <a className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold text-primary hover:bg-muted" href={href} target="_blank" rel="noreferrer">
          <ExternalLink className="h-4 w-4" />
          Open and fill
        </a>
      </div>
    </article>
  )
}

function UploadField({ name, required = false }: { name: string; required?: boolean }) {
  return (
    <label className="block rounded-lg border border-dashed bg-white p-4">
      <span className="flex items-center gap-2 text-sm font-semibold">
        <FileUp className="h-4 w-4 text-primary" />
        Upload completed {name} {required && <span className="text-destructive">*</span>}
      </span>
      <input
        className="mt-3 block w-full text-sm"
        name={`attachment::${name}`}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        required={required}
      />
    </label>
  )
}
