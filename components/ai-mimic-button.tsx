"use client"

import { Sparkles } from "lucide-react"

export function AiMimicButton({
  formId,
  values,
  note,
}: {
  formId: string
  values: Record<string, string>
  note?: string
}) {
  function fillForm() {
    const form = document.getElementById(formId)
    if (!(form instanceof HTMLFormElement)) return

    for (const [name, value] of Object.entries(values)) {
      const field = form.elements.namedItem(name)
      if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)) continue

      const prototype = field instanceof HTMLInputElement
        ? HTMLInputElement.prototype
        : field instanceof HTMLSelectElement
          ? HTMLSelectElement.prototype
          : HTMLTextAreaElement.prototype
      const valueSetter = Object.getOwnPropertyDescriptor(prototype, "value")?.set
      valueSetter?.call(field, value)
      field.dispatchEvent(new Event("input", { bubbles: true }))
      field.dispatchEvent(new Event("change", { bubbles: true }))
    }
  }

  return (
    <div className="col-span-full flex flex-col gap-2 rounded-lg border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-bold text-primary">AI Mimic</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Fill this form with realistic Botswana demonstration information. Review everything before submitting.
        </p>
        {note && <p className="mt-1 text-xs font-medium text-amber-700">{note}</p>}
      </div>
      <button
        className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md border border-primary/30 bg-white px-4 py-2.5 text-sm font-semibold text-primary shadow-sm hover:bg-primary/10"
        type="button"
        onClick={fillForm}
      >
        <Sparkles className="h-4 w-4" />
        Fill demo information
      </button>
    </div>
  )
}
