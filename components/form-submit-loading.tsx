"use client"

import { useEffect } from "react"

export function FormSubmitLoading() {
  useEffect(() => {
    const setPending = (event: SubmitEvent) => {
      if (event.defaultPrevented) {
        return
      }

      const form = event.target instanceof HTMLFormElement ? event.target : null
      const submitter = event.submitter instanceof HTMLButtonElement ? event.submitter : null

      form?.setAttribute("aria-busy", "true")
      form?.classList.add("form-submit-pending-form")
      submitter?.setAttribute("aria-busy", "true")
      submitter?.classList.add("form-submit-pending")
    }

    const clearPending = () => {
      document.querySelectorAll(".form-submit-pending-form").forEach((form) => {
        form.removeAttribute("aria-busy")
        form.classList.remove("form-submit-pending-form")
      })

      document.querySelectorAll(".form-submit-pending").forEach((button) => {
        button.removeAttribute("aria-busy")
        button.classList.remove("form-submit-pending")
      })
    }

    document.addEventListener("submit", setPending, true)
    window.addEventListener("pageshow", clearPending)

    return () => {
      document.removeEventListener("submit", setPending, true)
      window.removeEventListener("pageshow", clearPending)
    }
  }, [])

  return null
}
