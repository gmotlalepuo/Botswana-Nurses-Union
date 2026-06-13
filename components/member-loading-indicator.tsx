"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { LoaderCircle } from "lucide-react"

export function MemberLoadingIndicator() {
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(false)
  }, [pathname])

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
        return
      }

      const link = event.target instanceof Element ? event.target.closest("a") : null
      if (!(link instanceof HTMLAnchorElement) || link.target === "_blank" || link.hasAttribute("download")) {
        return
      }

      const destination = new URL(link.href, window.location.href)
      const current = new URL(window.location.href)
      const changesPage = destination.origin === current.origin &&
        destination.pathname.startsWith("/portal") &&
        `${destination.pathname}${destination.search}` !== `${current.pathname}${current.search}`

      if (changesPage) {
        setLoading(true)
      }
    }

    const handleSubmit = (event: SubmitEvent) => {
      if (!event.defaultPrevented && event.target instanceof HTMLFormElement) {
        setLoading(true)
      }
    }

    const clearLoading = () => setLoading(false)

    document.addEventListener("click", handleClick, true)
    document.addEventListener("submit", handleSubmit, true)
    window.addEventListener("pageshow", clearLoading)

    return () => {
      document.removeEventListener("click", handleClick, true)
      document.removeEventListener("submit", handleSubmit, true)
      window.removeEventListener("pageshow", clearLoading)
    }
  }, [])

  if (!loading) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[2px]" role="status" aria-live="polite" aria-label="Loading">
      <div className="flex items-center gap-3 rounded-xl border bg-white px-5 py-4 shadow-2xl">
        <LoaderCircle className="h-6 w-6 animate-spin text-primary" />
        <div>
          <p className="font-bold">Please wait</p>
          <p className="text-sm text-muted-foreground">Loading your request...</p>
        </div>
      </div>
    </div>
  )
}
