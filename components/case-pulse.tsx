"use client"

import { useEffect, useState } from "react"
import { Download, Eye, Heart, MessageSquare, X } from "lucide-react"

export type CasePulseItem = {
  id: string
  author_role: string
  comment: string | null
  file_path: string | null
  created_at: string
  like_count?: number
  liked_by_me?: boolean
}

export function CasePulse({
  applicationId,
  redirectTo,
  pulses = [],
  label = "Pulse",
}: {
  applicationId: string
  redirectTo: string
  pulses?: CasePulseItem[]
  label?: string
}) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) {
      return
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
      }
    }

    document.addEventListener("keydown", closeOnEscape)
    return () => document.removeEventListener("keydown", closeOnEscape)
  }, [open])

  return (
    <>
      <button
        className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm font-semibold text-primary hover:bg-muted"
        onClick={() => setOpen(true)}
        type="button"
      >
        <MessageSquare className="h-4 w-4" />
        {label} ({pulses.length})
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onClick={() => setOpen(false)}>
          <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 border-b p-4">
              <div>
                <h2 className="text-xl font-bold">Case pulse</h2>
                <p className="text-sm text-muted-foreground">Comments, likes, and supporting files for this application.</p>
              </div>
              <button aria-label="Close pulse" className="rounded-md p-2 hover:bg-muted" onClick={() => setOpen(false)} type="button">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[calc(90vh-5rem)] overflow-y-auto p-4">
              <div className="space-y-4">
                <div className="space-y-3">
                  {pulses.map((pulse) => (
                    <article key={pulse.id} className="rounded-md border bg-muted/20 p-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-bold capitalize">{pulse.author_role}</p>
                        <p className="text-xs text-muted-foreground">{new Date(pulse.created_at).toLocaleString()}</p>
                      </div>
                      {pulse.comment ? <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{pulse.comment}</p> : null}
                      {pulse.file_path ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <a
                            className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-1.5 text-xs font-semibold text-primary hover:bg-muted"
                            href={`/api/case-pulse/file?pulseId=${encodeURIComponent(pulse.id)}`}
                            rel="noreferrer"
                            target="_blank"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View attachment
                          </a>
                          <a
                            className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                            href={`/api/case-pulse/file?pulseId=${encodeURIComponent(pulse.id)}&download=1`}
                          >
                            <Download className="h-3.5 w-3.5" />
                            Download
                          </a>
                        </div>
                      ) : null}
                      <form action="/api/case-pulse/like" method="post" className="mt-3">
                        <input type="hidden" name="pulseId" value={pulse.id} />
                        <input type="hidden" name="redirectTo" value={redirectTo} />
                        <button
                          className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-semibold ${pulse.liked_by_me ? "bg-primary text-primary-foreground" : "bg-white text-foreground hover:bg-muted"}`}
                        >
                          <Heart className="h-3.5 w-3.5" />
                          {pulse.like_count ?? 0}
                        </button>
                      </form>
                    </article>
                  ))}
                  {pulses.length === 0 ? <p className="rounded-md border bg-muted/20 p-4 text-sm text-muted-foreground">No pulse activity yet.</p> : null}
                </div>
                <form action="/api/case-pulse/create" method="post" encType="multipart/form-data" className="grid gap-3 rounded-lg border bg-muted/20 p-4 md:grid-cols-[1fr_14rem]">
                  <input type="hidden" name="applicationId" value={applicationId} />
                  <input type="hidden" name="redirectTo" value={redirectTo} />
                  <label className="block">
                    <span className="text-sm font-semibold">Comment</span>
                    <textarea className="mt-2 min-h-24 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none" name="comment" placeholder="Add a case update or request more information" />
                  </label>
                  <div className="space-y-3">
                    <label className="block">
                      <span className="text-sm font-semibold">Attach file</span>
                      <input className="mt-2 block w-full text-xs" name="attachment" type="file" />
                    </label>
                    <button className="w-full rounded-md bg-primary px-4 py-3 font-semibold text-primary-foreground">Add pulse</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
