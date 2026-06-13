import { NextResponse } from "next/server"
import { requireStaffRequest } from "@/lib/admin-auth"
import { createAdminClient } from "@/lib/supabase/admin"

const statuses = new Set(["pending", "active", "suspended", "cancelled"])

export async function POST(request: Request) {
  try {
    const { response } = await requireStaffRequest(request)

    if (response) {
      return response
    }

    const formData = await request.formData()
    const memberId = String(formData.get("memberId") ?? "")
    const status = String(formData.get("status") ?? "")
    const redirectTo = safeCsrRedirect(formData.get("redirectTo"))

    if (!memberId || !statuses.has(status)) {
      return NextResponse.redirect(new URL(`${redirectTo}?error=missing`, request.url), 303)
    }

    const admin = createAdminClient()
    const { data, error } = await admin.from("members").update({ status, updated_at: new Date().toISOString() }).eq("id", memberId).select("full_name").single()

    if (error) {
      return NextResponse.redirect(new URL(`${redirectTo}?error=member-update`, request.url), 303)
    }

    await admin.from("notifications").insert({
      member_id: memberId,
      title: "Member status updated",
      message: `${data.full_name} is now ${status}.`,
      channel: "in_app",
    })

    return NextResponse.redirect(new URL(`${redirectTo}?success=member-updated`, request.url), 303)
  } catch {
    return NextResponse.redirect(new URL("/csr?error=not-configured", request.url), 303)
  }
}

function safeCsrRedirect(value: FormDataEntryValue | null) {
  const path = String(value ?? "/csr")
  return path.startsWith("/csr") ? path : "/csr"
}
