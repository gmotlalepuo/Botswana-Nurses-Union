"use client"

import { useState } from "react"
import { CheckCircle2, Download, ExternalLink, FileCheck2, FileUp, Info, MonitorDown, Smartphone } from "lucide-react"
import type { MemberApplication } from "@/lib/member-data"

type Citizenship = "citizen" | "non_citizen" | ""
type EmploymentSector = "public" | "private" | ""

const forms = {
  directDebit: {
    name: "Direct Debit Form",
    href: "/forms/direct-debit-form.pdf",
    description: "Required for private sector employees so monthly deductions can be collected.",
  },
  deduction: {
    name: "Deduction Form",
    href: "/forms/deduction-form.pdf",
    description: "Required for public sector employees to authorize payroll deductions.",
  },
} as const

const allForms = [forms.directDebit, forms.deduction]

export function MembershipDocumentFlow({
  membershipApplications,
}: {
  membershipApplications: MemberApplication[]
}) {
  const [citizenship, setCitizenship] = useState<Citizenship>("")
  const [employmentSector, setEmploymentSector] = useState<EmploymentSector>("")
  const latestApplication = membershipApplications[0]
  const hasOpenApplication = Boolean(latestApplication && ["submitted", "in_review", "more_info_required"].includes(latestApplication.status))
  const requiredForms = employmentSector === "private"
    ? [forms.directDebit]
    : employmentSector === "public"
      ? [forms.deduction]
      : []

  return (
    <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="border-b bg-surface-strong px-5 py-6 text-white sm:px-7">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <FileCheck2 className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-white/75">Membership onboarding</p>
            <h2 className="mt-1 text-2xl font-bold">Complete and submit your required forms</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/80">
              Choose your citizenship and employment sector first. We will show only the forms that apply to you.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-7 p-5 sm:p-7">
        <section className="rounded-xl border border-primary/20 bg-primary/5 p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-primary shadow-sm">
              <MonitorDown className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-bold">Need Adobe Acrobat Reader?</h3>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                These BONU forms are editable PDFs. Some browsers can fill them, but Adobe Acrobat Reader provides more reliable form filling, saving and signing so your information is not lost before upload.
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <ReaderLink
              href="https://get.adobe.com/reader/"
              icon={<MonitorDown className="h-5 w-5" />}
              label="Computer"
              description="Windows and macOS"
            />
            <ReaderLink
              href="https://apps.apple.com/app/adobe-acrobat-reader-edit-pdf/id469337564"
              icon={<Smartphone className="h-5 w-5" />}
              label="iPhone or iPad"
              description="Download from App Store"
            />
            <ReaderLink
              href="https://play.google.com/store/apps/details?id=com.adobe.reader"
              icon={<Smartphone className="h-5 w-5" />}
              label="Android"
              description="Download from Google Play"
            />
          </div>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            After installing Reader, download a BONU form, open it in Acrobat, complete the highlighted fields, save the PDF to your device, then return here to upload it in Step 3.
          </p>
        </section>

        {latestApplication && (
          <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="font-semibold">Latest membership submission: {friendlyStatus(latestApplication.status)}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Submitted {new Date(latestApplication.submitted_at).toLocaleDateString("en-BW")}. CSR will verify the uploaded forms before membership activation.
              </p>
            </div>
          </div>
        )}

        <form action="/api/member/applications/create" method="post" encType="multipart/form-data" className="space-y-7">
          <input type="hidden" name="applicationType" value="membership" />
          <input type="hidden" name="redirectTo" value="/portal/membership" />

          <fieldset>
            <legend className="text-lg font-bold">1. Tell us about your status</legend>
            <p className="mt-1 text-sm text-muted-foreground">Both selections are required and determine the guidance and forms shown below.</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold">Citizenship status</span>
                <select
                  className="mt-2 min-h-11 w-full rounded-md border bg-white px-3 py-2"
                  name="citizenship"
                  required
                  value={citizenship}
                  onChange={(event) => setCitizenship(event.target.value as Citizenship)}
                >
                  <option value="">Select citizenship status</option>
                  <option value="citizen">Botswana citizen</option>
                  <option value="non_citizen">Non-citizen</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-semibold">Employment sector</span>
                <select
                  className="mt-2 min-h-11 w-full rounded-md border bg-white px-3 py-2"
                  name="employmentSector"
                  required
                  value={employmentSector}
                  onChange={(event) => setEmploymentSector(event.target.value as EmploymentSector)}
                >
                  <option value="">Select employment sector</option>
                  <option value="public">Public sector employee</option>
                  <option value="private">Private sector employee</option>
                </select>
              </label>
            </div>
            {citizenship && (
              <div className="mt-4 flex items-start gap-3 rounded-lg bg-muted/60 p-4 text-sm">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <p>
                  {citizenship === "citizen"
                    ? "Use your Omang number wherever the forms request a national identity number, and make sure it matches your BONU profile."
                    : "Use your passport number wherever the forms request identification. Keep your valid immigration or work authorization available if CSR requests it."}
                </p>
              </div>
            )}
          </fieldset>

          <fieldset>
            <legend className="text-lg font-bold">2. Download and complete the editable PDFs</legend>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Download the authorization form for your employment sector. Complete it electronically in a PDF reader, or print and complete it in clear block letters, then sign it before uploading.
            </p>
            <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
              {employmentSector ? (
                <p className="font-semibold text-primary">
                  Your required employment authorization form is marked below.
                </p>
              ) : (
                <p className="font-semibold text-primary">
                  All forms are available below. Select your employment sector in Step 1 to identify which forms you must submit.
                </p>
              )}
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {allForms.map((form) => (
                <DownloadCard
                  key={form.name}
                  form={form}
                  required={requiredForms.some((requiredForm) => requiredForm.name === form.name)}
                />
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-lg font-bold">3. Upload the completed forms</legend>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Upload a clear PDF, JPG or PNG scan. Check that all pages are upright, readable, signed and no larger than 10 MB each.
            </p>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {requiredForms.map((form) => <UploadField key={form.name} name={form.name} required />)}
            </div>
          </fieldset>

          <label className="flex items-start gap-3 rounded-lg bg-muted/50 p-4">
            <input className="mt-1 h-4 w-4" name="informationConsent" type="checkbox" value="accepted" required />
            <span className="text-sm leading-6">
              I confirm that the information and uploaded forms are complete, accurate and signed, and I authorize BONU to verify them with my employer where necessary.
            </span>
          </label>

          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!citizenship || !employmentSector || hasOpenApplication}
            type="submit"
          >
            <FileUp className="h-4 w-4" />
            {hasOpenApplication ? "Submission under review" : "Submit membership forms"}
          </button>
        </form>
      </div>
    </section>
  )
}

function ReaderLink({
  href,
  icon,
  label,
  description,
}: {
  href: string
  icon: React.ReactNode
  label: string
  description: string
}) {
  return (
    <a
      className="flex min-h-16 items-center gap-3 rounded-lg border bg-white px-4 py-3 text-left hover:border-primary/40 hover:bg-muted/40"
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold">{label}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
      </span>
      <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
    </a>
  )
}

function DownloadCard({
  form,
  required = false,
}: {
  form: { name: string; href: string; description: string }
  required?: boolean
}) {
  const badgeLabel = required ? "Required for you" : "Available"

  return (
    <article className={`rounded-lg border bg-white p-4 ${required ? "border-primary/40 ring-2 ring-primary/10" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold">{form.name}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{form.description}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${required ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
          {badgeLabel}
        </span>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <a
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
          href={form.href}
          download
        >
          <Download className="h-4 w-4" />
          Download editable PDF
        </a>
        <a
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border bg-white px-4 py-3 text-sm font-semibold text-primary hover:bg-muted"
          href={form.href}
          target="_blank"
          rel="noreferrer"
        >
          <ExternalLink className="h-4 w-4" />
          Open and fill
        </a>
      </div>
    </article>
  )
}

function UploadField({ name, required = false }: { name: string; required?: boolean }) {
  return (
    <label className="block rounded-lg border border-dashed bg-muted/20 p-4">
      <span className="text-sm font-semibold">{name} {required && <span className="text-destructive">*</span>}</span>
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

function friendlyStatus(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}
