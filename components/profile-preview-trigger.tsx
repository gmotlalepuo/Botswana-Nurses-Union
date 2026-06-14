"use client"

import { Eye } from "lucide-react"

export const PROFILE_PREVIEW_EVENT = "bonu:open-profile-preview"

export function ProfilePreviewTrigger() {
  return (
    <button
      className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md border bg-white px-4 py-2.5 text-sm font-semibold text-primary shadow-sm hover:bg-muted"
      type="button"
      onClick={() => window.dispatchEvent(new Event(PROFILE_PREVIEW_EVENT))}
    >
      <Eye className="h-4 w-4" />
      Preview full profile
    </button>
  )
}
