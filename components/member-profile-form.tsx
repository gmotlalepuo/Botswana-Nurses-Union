"use client"

import { useEffect, useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { ArrowLeft, ArrowRight, Download, Eye, FileUp, Save, X } from "lucide-react"
import { documents } from "@/lib/bonu-data"
import { BOTSWANA_COUNCILS, BOTSWANA_DISTRICTS } from "@/lib/botswana-locations"
import { InteractiveTable } from "@/components/interactive-table"
import { PROFILE_PREVIEW_EVENT } from "@/components/profile-preview-trigger"
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
  const [showPreview, setShowPreview] = useState(false)
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
    council: profile?.council ?? "",
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
  useEffect(() => {
    const openPreview = () => setShowPreview(true)
    window.addEventListener(PROFILE_PREVIEW_EVENT, openPreview)
    return () => window.removeEventListener(PROFILE_PREVIEW_EVENT, openPreview)
  }, [])
  useEffect(() => {
    if (!showPreview) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowPreview(false)
    }

    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [showPreview])

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
            <Select name="district" label="District" value={formData.district} onChange={updateField} options={[...BOTSWANA_DISTRICTS]} />
            <Select name="council" label="Council" value={formData.council} onChange={updateField} options={[...BOTSWANA_COUNCILS]} />
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

      {showPreview && (
        <ProfilePreview
          formData={formData}
          profile={profile}
          memberDocuments={memberDocuments}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  )
}

function ProfilePreview({
  formData,
  profile,
  memberDocuments,
  onClose,
}: {
  formData: {
    fullName: string
    nationalId: string
    dateOfBirth: string
    gender: string
    maritalStatus: string
    occupation: string
    mobileNumber: string
    alternativeContactNumber: string
    email: string
    physicalAddress: string
    postalAddress: string
    district: string
    council: string
    employer: string
    employeeNumber: string
    workStation: string
    department: string
    employmentDate: string
    monthlySalary: string
  }
  profile: MemberProfile | null
  memberDocuments: MemberDocument[]
  onClose: () => void
}) {
  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[200] bg-slate-950/60 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[201] max-h-[92dvh] w-[calc(100vw-1.5rem)] max-w-5xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-slate-50 shadow-2xl focus:outline-none"
          aria-describedby="profile-preview-description"
        >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b bg-white/95 px-5 py-5 backdrop-blur sm:px-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Member profile</p>
            <Dialog.Title className="mt-1 text-2xl font-bold">Full profile preview</Dialog.Title>
            <Dialog.Description id="profile-preview-description" className="mt-1 text-sm text-muted-foreground">This preview includes your current form entries, even before they are saved.</Dialog.Description>
          </div>
          <Dialog.Close asChild>
            <button
              className="flex min-h-11 min-w-11 items-center justify-center rounded-md border bg-white text-muted-foreground hover:bg-muted hover:text-foreground"
              type="button"
              aria-label="Close profile preview"
            >
              <X className="h-5 w-5" />
            </button>
          </Dialog.Close>
        </header>

        <div className="space-y-5 p-5 sm:p-7">
          <section className="rounded-xl bg-primary p-5 text-primary-foreground">
            <p className="text-sm font-semibold opacity-80">Member</p>
            <h3 className="mt-1 text-2xl font-bold">{displayValue(formData.fullName)}</h3>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <span>{profile?.membership_number || "Membership number pending"}</span>
              <span className="capitalize">Status: {profile?.status || "Pending"}</span>
            </div>
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            <PreviewSection title="Personal information">
              <PreviewField label="Full name" value={formData.fullName} />
              <PreviewField label="National ID / Passport" value={formData.nationalId} />
              <PreviewField label="Date of birth" value={formatPreviewDate(formData.dateOfBirth)} />
              <PreviewField label="Gender" value={formData.gender} />
              <PreviewField label="Marital status" value={formData.maritalStatus} />
              <PreviewField label="Occupation" value={formData.occupation} />
            </PreviewSection>

            <PreviewSection title="Contact and location">
              <PreviewField label="Mobile number" value={formData.mobileNumber} />
              <PreviewField label="Alternative contact" value={formData.alternativeContactNumber} />
              <PreviewField label="Email address" value={formData.email} fullWidth />
              <PreviewField label="Physical address" value={formData.physicalAddress} fullWidth />
              <PreviewField label="Postal address" value={formData.postalAddress} fullWidth />
              <PreviewField label="District" value={formData.district} />
              <PreviewField label="Council" value={formData.council} />
            </PreviewSection>

            <PreviewSection title="Employment information">
              <PreviewField label="Employer" value={formData.employer} />
              <PreviewField label="Employee number" value={formData.employeeNumber} />
              <PreviewField label="Work station" value={formData.workStation} />
              <PreviewField label="Department" value={formData.department} />
              <PreviewField label="Employment date" value={formatPreviewDate(formData.employmentDate)} />
              <PreviewField label="Monthly salary" value={formatSalary(formData.monthlySalary)} />
            </PreviewSection>

            <PreviewSection title={`Attachments (${memberDocuments.length})`}>
              {memberDocuments.length > 0 ? (
                memberDocuments.map((document) => (
                  <div key={document.id} className="col-span-full flex items-center justify-between gap-4 border-b py-3 last:border-b-0">
                    <div>
                      <p className="text-sm font-semibold">{document.document_type}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Uploaded {new Date(document.created_at).toLocaleDateString("en-BW")} · {document.verified_at ? "Verified" : "Awaiting verification"}
                      </p>
                    </div>
                    <a
                      className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm font-semibold text-primary hover:bg-muted"
                      href={`/api/member/documents/file?documentId=${encodeURIComponent(document.id)}`}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </a>
                  </div>
                ))
              ) : (
                <p className="col-span-full py-4 text-sm text-muted-foreground">No saved attachments yet.</p>
              )}
            </PreviewSection>
          </div>
        </div>

        <footer className="sticky bottom-0 flex justify-end border-t bg-white/95 px-5 py-4 backdrop-blur sm:px-7">
          <Dialog.Close asChild>
            <button className="min-h-11 rounded-md bg-primary px-5 py-2.5 font-semibold text-primary-foreground hover:opacity-90" type="button">
              Close preview
            </button>
          </Dialog.Close>
        </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function PreviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <h3 className="border-b bg-muted/40 px-5 py-4 font-bold">{title}</h3>
      <dl className="grid gap-x-5 px-5 sm:grid-cols-2">{children}</dl>
    </section>
  )
}

function PreviewField({ label, value, fullWidth = false }: { label: string; value: string; fullWidth?: boolean }) {
  return (
    <div className={`border-b py-4 last:border-b-0 ${fullWidth ? "sm:col-span-2" : ""}`}>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className={`mt-1.5 text-sm font-medium ${value ? "text-foreground" : "italic text-muted-foreground"}`}>
        {displayValue(value)}
      </dd>
    </div>
  )
}

function displayValue(value: string) {
  return value.trim() || "Not captured"
}

function formatPreviewDate(value: string) {
  if (!value) return ""
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-BW", { dateStyle: "long" }).format(date)
}

function formatSalary(value: string) {
  const amount = Number(value)
  return value && Number.isFinite(amount)
    ? new Intl.NumberFormat("en-BW", { style: "currency", currency: "BWP" }).format(amount)
    : ""
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
            { key: "actions", label: "Actions" },
          ]}
          rows={memberDocuments.map((document) => ({
            id: document.id,
            documentType: document.document_type,
            verified: document.verified_at ? "Yes" : "No",
            uploadedAt: new Date(document.created_at).toLocaleDateString(),
            actions: "",
          }))}
          emptyMessage="No documents uploaded yet."
          exportFileName="bonu-member-documents.csv"
          renderCell={(row, column) => {
            if (column.key !== "actions") {
              return row[column.key] ?? ""
            }

            const documentId = encodeURIComponent(String(row.id))
            return (
              <div className="flex flex-wrap gap-2">
                <a
                  className="inline-flex min-h-11 items-center gap-2 rounded-md border bg-white px-3 py-2 font-semibold text-primary hover:bg-muted"
                  href={`/api/member/documents/file?documentId=${documentId}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  <Eye className="h-4 w-4" />
                  View
                </a>
                <a
                  className="inline-flex min-h-11 items-center gap-2 rounded-md border bg-white px-3 py-2 font-semibold hover:bg-muted"
                  href={`/api/member/documents/file?documentId=${documentId}&download=1`}
                >
                  <Download className="h-4 w-4" />
                  Download
                </a>
              </div>
            )
          }}
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
