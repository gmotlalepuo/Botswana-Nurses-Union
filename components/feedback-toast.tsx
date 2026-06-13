"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react"

const messages: Record<string, string> = {
  "login-success": "Login successful. Welcome back.",
  "registration-submitted": "Account created. Your membership profile is awaiting verification.",
  "user-created": "Staff user created successfully.",
  "user-updated": "Staff user updated successfully.",
  "user-deleted": "Staff user deleted successfully.",
  "password-reset": "Password reset successfully.",
  "reset-email-sent": "Password reset link sent. Please check your email.",
  "password-updated": "Password updated. Sign in with your new password.",
  "logged-out": "You have been logged out.",
  "notification-read": "Notification marked as read.",
  "complaint-created": "Complaint created successfully.",
  "complaint-updated": "Complaint updated successfully.",
  "member-updated": "Member status updated successfully.",
  "product-created": "Merchandise added successfully.",
  "product-updated": "Merchandise updated successfully.",
  "profile-updated": "Profile updated successfully.",
  "application-submitted": "Application submitted successfully.",
  "subscription-created": "Membership activated successfully.",
  "document-verified": "Document verification updated.",
  "application-updated": "Application updated successfully.",
  "pulse-added": "Pulse added to the case.",
  "pulse-liked": "Pulse comment liked.",
  "pulse-unliked": "Pulse comment unliked.",
  "credit-order-created": "Credit order created. Monthly deductions will track the balance.",
  "order-payment-recorded": "Order payment recorded and balance updated.",
  "order-signed-off": "Order signed off successfully.",
  "admin-portal": "Admins use the back-office portal.",
  "payment-demo": "Payment flow opened in demo mode.",
  "payment-success": "Payment completed successfully.",
  "payment-cancelled": "Payment was cancelled.",
  "document-received": "Document received. It will be verified by the membership team.",
  "contact-sent": "Your enquiry was submitted successfully. BONU will follow up using the contact details provided.",
  invalid: "Invalid email or password.",
  missing: "Please complete all required fields.",
  account: "We could not create that account. Please check the details and try again.",
  profile: "Account was created, but the member profile could not be saved.",
  "document-upload": "The document could not be uploaded. Please check the storage bucket and try again.",
  "document-record": "The file uploaded, but the document record could not be saved.",
  session: "Please sign in to continue.",
  "admin-required": "Only administrators can perform that action.",
  create: "We could not create the staff user.",
  "user-update": "We could not update that staff user.",
  "user-delete": "We could not delete that staff user.",
  "self-delete": "You cannot delete your own admin account while signed in.",
  "password-short": "Password must be at least 8 characters.",
  "password-reset-failed": "We could not reset that password.",
  "forgot-failed": "We could not send the reset email. Please check the address and try again.",
  "password-update": "We could not update your password. Please open the reset link again.",
  "notification-read-failed": "We could not update that notification.",
  "complaint-create": "We could not create that complaint.",
  "complaint-update": "We could not update that complaint.",
  "csr-required": "Only CSR users can access the CSR portal.",
  "staff-required": "Only staff users can perform that action.",
  "member-update": "We could not update that member.",
  "profile-update": "We could not update your profile.",
  "profile-required": "Please complete your profile before using this service.",
  "application-submit": "We could not submit that application.",
  "subscription-amount": "Please enter a valid monthly subscription amount.",
  "subscription-approval-required": "Membership can only be activated after CSR approves a billable service with a monthly deduction.",
  "subscription-create": "We could not create the membership subscription.",
  "member-required": "Only member accounts can access the customer portal.",
  "document-verify": "We could not update that document.",
  "application-update": "We could not update that application.",
  "not-configured": "The service is not configured yet. Please check environment settings.",
  "contact-missing": "Please complete the required contact fields.",
  "contact-failed": "We could not submit your enquiry. Please try again or contact BONU directly.",
}

function FeedbackToastContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [visible, setVisible] = useState(false)

  const feedback = useMemo(() => {
    const success = searchParams.get("success")
    const error = searchParams.get("error")
    const notice = searchParams.get("notice")

    if (success === "profile-updated") {
      const attachmentCount = searchParams.get("attachments")
      const suffix = attachmentCount === null ? "" : ` Attachments saved: ${attachmentCount}.`
      return { type: "success" as const, text: `${messages[success]}${suffix}` }
    }

    if (success) {
      return { type: "success" as const, text: messages[success] ?? success }
    }

    if (error) {
      return { type: "error" as const, text: messages[error] ?? error }
    }

    if (notice) {
      return { type: "notice" as const, text: messages[notice] ?? notice }
    }

    if (searchParams.get("registered") === "true") {
      return { type: "success" as const, text: messages["registration-submitted"] }
    }

    if (searchParams.get("payment") === "success") {
      return { type: "success" as const, text: messages["payment-success"] }
    }

    if (searchParams.get("payment") === "cancelled") {
      return { type: "error" as const, text: messages["payment-cancelled"] }
    }

    if (searchParams.get("payment") === "demo") {
      return { type: "notice" as const, text: messages["payment-demo"] }
    }

    return null
  }, [searchParams])

  useEffect(() => {
    if (!feedback) {
      setVisible(false)
      return
    }

    setVisible(true)
    const cleanUrl = pathname
    const hideTimer = window.setTimeout(() => setVisible(false), 4800)
    const cleanTimer = window.setTimeout(() => router.replace(cleanUrl, { scroll: false }), 5200)

    return () => {
      window.clearTimeout(hideTimer)
      window.clearTimeout(cleanTimer)
    }
  }, [feedback, pathname, router])

  if (!feedback || !visible) {
    return null
  }

  const Icon = feedback.type === "success" ? CheckCircle2 : feedback.type === "error" ? AlertCircle : Info
  const tone =
    feedback.type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
      : feedback.type === "error"
        ? "border-red-200 bg-red-50 text-red-950"
        : "border-cyan-200 bg-cyan-50 text-cyan-950"

  return (
    <div className="fixed right-4 top-4 z-50 w-[calc(100vw-2rem)] max-w-md">
      <div className={`flex items-start gap-3 rounded-lg border p-4 shadow-lg ${tone}`}>
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />
        <p className="min-w-0 flex-1 text-sm font-medium leading-6">{feedback.text}</p>
        <button aria-label="Dismiss message" className="rounded-md p-1 hover:bg-black/5" onClick={() => setVisible(false)}>
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export function FeedbackToast() {
  return (
    <Suspense fallback={null}>
      <FeedbackToastContent />
    </Suspense>
  )
}
