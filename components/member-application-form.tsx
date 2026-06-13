import { CustomerApplicationTable } from "@/components/customer-application-table"
import type { MemberApplication } from "@/lib/member-data"
export function HiddenApplicationFields({
  applicationType,
  redirectTo,
}: {
  applicationType: string
  redirectTo: string
}) {
  return (
    <>
      <input type="hidden" name="applicationType" value={applicationType} />
      <input type="hidden" name="redirectTo" value={redirectTo} />
    </>
  )
}

export function FormField({
  name,
  label,
  type = "text",
  required = false,
  placeholder,
}: {
  name: string
  label: string
  type?: string
  required?: boolean
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <input className="mt-2 w-full rounded-md border px-3 py-2 outline-none" name={name} type={type} required={required} placeholder={placeholder} />
    </label>
  )
}

export function FormSelect({
  name,
  label,
  options,
  required = false,
}: {
  name: string
  label: string
  options: string[]
  required?: boolean
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <select className="mt-2 w-full rounded-md border bg-white px-3 py-2 outline-none" name={name} required={required}>
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

export function FormTextArea({
  name,
  label,
  required = false,
  placeholder,
}: {
  name: string
  label: string
  required?: boolean
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <textarea className="mt-2 min-h-28 w-full rounded-md border px-3 py-2 outline-none" name={name} required={required} placeholder={placeholder} />
    </label>
  )
}

export function FormAttachment({
  label,
  required = false,
}: {
  label: string
  required?: boolean
}) {
  return (
    <label className="block rounded-lg border border-dashed bg-muted/30 p-4">
      <span className="text-sm font-semibold">{label}</span>
      <input className="mt-3 block w-full text-xs" name={`attachment::${label}`} required={required} type="file" />
    </label>
  )
}

export function ApplicationHistory({
  title,
  applications,
}: {
  title: string
  applications: MemberApplication[]
}) {
  return <CustomerApplicationTable title={title} applications={applications} />
}
