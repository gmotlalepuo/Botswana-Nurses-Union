"use client"

import { useState } from "react"
import { ArrowLeft, ArrowRight, FileUp, Save } from "lucide-react"
import { documents } from "@/lib/bonu-data"
import { InteractiveTable } from "@/components/interactive-table"
import type { MemberDocument, MemberProfile } from "@/lib/member-data"

export function MemberProfileForm({
  profile,
  email,
  memberDocuments,
}: {
  profile: MemberProfile | null
  email?: string | null
  memberDocuments: MemberDocument[]
}) {
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState({
    fullName: profile?.full_name ?? "",
    nationalId: profile?.national_id ?? "",
    dateOfBirth: profile?.date_of_birth ?? "",
    gender: profile?.gender ?? "",
    maritalStatus: profile?.marital_status ?? "",
    occupation: profile?.occupation ?? "",
    mobileNumber: profile?.mobile_number ?? "",
    alternativeContactNumber: profile?.alternative_contact_number ?? "",
    email: profile?.email ?? email ?? "",
    physicalAddress: profile?.physical_address ?? "",
    postalAddress: profile?.postal_address ?? "",
    district: profile?.district ?? "",
    region: profile?.region ?? "",
    employer: profile?.employer ?? "",
    employeeNumber: profile?.employee_number ?? "",
    workStation: profile?.work_station ?? "",
    department: profile?.department ?? "",
    employmentDate: profile?.employment_date ?? "",
    monthlySalary: profile?.monthly_salary?.toString() ?? "",
  })
  const steps = ["Personal Information", "Contact Information", "Employment Information", "Attachments"]
  const updateField = (name: keyof typeof formData, value: string) => {
    setFormData((current) => ({ ...current, [name]: value }))
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="grid gap-2 md:grid-cols-4">
          {steps.map((item, index) => (
            <button
              key={item}
              className={`rounded-md px-3 py-3 text-left text-sm font-semibold ${step === index ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/70"}`}
              type="button"
              onClick={() => setStep(index)}
            >
              <span className="block text-xs opacity-80">Step {index + 1}</span>
              {item}
            </button>
          ))}
        </div>
      </div>

      <section className={step === 3 ? "hidden" : "rounded-lg border bg-white p-5 shadow-sm"}>
        <form id="member-profile-form" action="/api/member/profile/update" method="post" encType="multipart/form-data" className="space-y-5">
          <div className={step === 0 ? "grid gap-4 md:grid-cols-2" : "hidden"}>
            <Field name="fullName" label="Full Name" value={formData.fullName} onChange={updateField} />
            <Field name="nationalId" label="National ID / Passport Number" value={formData.nationalId} onChange={updateField} />
            <Field name="dateOfBirth" label="Date of Birth" type="date" value={formData.dateOfBirth} onChange={updateField} />
            <Select name="gender" label="Gender" value={formData.gender} onChange={updateField} options={["Female", "Male", "Other"]} />
            <Select name="maritalStatus" label="Marital Status" value={formData.maritalStatus} onChange={updateField} options={["Single", "Married", "Divorced", "Widowed"]} />
            <Field name="occupation" label="Occupation" value={formData.occupation} onChange={updateField} />
          </div>

          <div className={step === 1 ? "grid gap-4 md:grid-cols-2" : "hidden"}>
            <Field name="mobileNumber" label="Mobile Number" value={formData.mobileNumber} onChange={updateField} />
            <Field name="alternativeContactNumber" label="Alternative Contact Number" value={formData.alternativeContactNumber} onChange={updateField} />
            <Field name="email" label="Email Address" type="email" value={formData.email} onChange={updateField} />
            <Field name="physicalAddress" label="Physical Address" value={formData.physicalAddress} onChange={updateField} />
            <Field name="postalAddress" label="Postal Address" value={formData.postalAddress} onChange={updateField} />
            <Field name="district" label="District" value={formData.district} onChange={updateField} />
            <Field name="region" label="Region" value={formData.region} onChange={updateField} />
          </div>

          <div className={step === 2 ? "grid gap-4 md:grid-cols-2" : "hidden"}>
            <Field name="employer" label="Employer" value={formData.employer} onChange={updateField} />
            <Field name="employeeNumber" label="Employee Number" value={formData.employeeNumber} onChange={updateField} />
            <Field name="workStation" label="Work Station" value={formData.workStation} onChange={updateField} />
            <Field name="department" label="Department" value={formData.department} onChange={updateField} />
            <Field name="employmentDate" label="Employment Date" type="date" value={formData.employmentDate} onChange={updateField} />
            <Field name="monthlySalary" label="Salary Information" type="number" value={formData.monthlySalary} onChange={updateField} />
          </div>
        </form>
      </section>

      {step === 3 && <AttachmentsStep memberDocuments={memberDocuments} />}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white p-4 shadow-sm">
        <button
          className="inline-flex items-center gap-2 rounded-md border bg-white px-4 py-3 font-semibold hover:bg-muted disabled:opacity-50"
          disabled={step === 0}
          onClick={() => setStep((current) => Math.max(current - 1, 0))}
          type="button"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="flex flex-wrap gap-2">
          {step < 3 ? (
            <button
              className="inline-flex items-center gap-2 rounded-md border bg-white px-4 py-3 font-semibold hover:bg-muted"
              onClick={() => setStep((current) => Math.min(current + 1, 3))}
              type="button"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button form="member-profile-form" className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-3 font-semibold text-primary-foreground">
              <Save className="h-4 w-4" />
              Submit profile
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function AttachmentsStep({ memberDocuments }: { memberDocuments: MemberDocument[] }) {
  return (
    <section className="rounded-lg border bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <FileUp className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold">Attachments</h2>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Select the documents you want to attach, then click Submit profile below. The profile and selected attachments will be saved together.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {documents.map((document) => (
          <div key={document} className="rounded-lg border border-dashed p-4">
            <label className="block">
              <span className="text-sm font-semibold">{document}</span>
              <input className="mt-3 block w-full text-xs" form="member-profile-form" name={`attachment::${document}`} type="file" />
            </label>
          </div>
        ))}
      </div>
      <div className="mt-5">
        <InteractiveTable
          columns={[
            { key: "documentType", label: "Document", filterable: true },
            { key: "verified", label: "Verified", filterable: true },
            { key: "uploadedAt", label: "Uploaded" },
            { key: "filePath", label: "File path" },
          ]}
          rows={memberDocuments.map((document) => ({
            id: document.id,
            documentType: document.document_type,
            verified: document.verified_at ? "Yes" : "No",
            uploadedAt: new Date(document.created_at).toLocaleDateString(),
            filePath: document.file_path,
          }))}
          emptyMessage="No documents uploaded yet."
          exportFileName="bonu-member-documents.csv"
        />
      </div>
    </section>
  )
}

function Field({
  name,
  label,
  value,
  onChange,
  type = "text",
}: {
  name: string
  label: string
  value: string
  onChange: (name: never, value: string) => void
  type?: string
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <input
        className="mt-2 w-full rounded-md border px-3 py-2 outline-none"
        name={name}
        type={type}
        value={value}
        onChange={(event) => onChange(name as never, event.target.value)}
      />
    </label>
  )
}

function Select({
  name,
  label,
  value,
  onChange,
  options,
}: {
  name: string
  label: string
  value: string
  onChange: (name: never, value: string) => void
  options: string[]
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <select
        className="mt-2 w-full rounded-md border bg-white px-3 py-2 outline-none"
        name={name}
        value={value}
        onChange={(event) => onChange(name as never, event.target.value)}
      >
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}
