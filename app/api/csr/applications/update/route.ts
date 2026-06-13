import { NextResponse } from "next/server"
import { requireStaffRequest } from "@/lib/admin-auth"
import { createAdminClient } from "@/lib/supabase/admin"

const statuses = new Set(["submitted", "in_review", "more_info_required", "approved", "rejected", "fulfilled"])

export async function POST(request: Request) {
  try {
    const { user, response } = await requireStaffRequest(request)

    if (response) {
      return response
    }

    const formData = await request.formData()
    const applicationId = String(formData.get("applicationId") ?? "")
    const status = String(formData.get("status") ?? "")
    const monthlyDeduction = Number(formData.get("monthlyDeduction") ?? 0)
    const termMonths = Number(formData.get("termMonths") ?? 0)
    const redirectTo = safeCsrRedirect(formData.get("redirectTo"))

    if (!applicationId || !statuses.has(status)) {
      return NextResponse.redirect(new URL(`${redirectTo}?error=missing`, request.url), 303)
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from("service_applications")
      .update({
        status,
        assigned_to: user?.id,
        monthly_deduction: Number.isFinite(monthlyDeduction) ? monthlyDeduction : null,
        term_months: Number.isFinite(termMonths) && termMonths > 0 ? termMonths : null,
        decided_at: ["approved", "rejected", "fulfilled"].includes(status) ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId)
      .select("application_type, member_id")
      .single()

    if (error) {
      return NextResponse.redirect(new URL(`${redirectTo}?error=application-update`, request.url), 303)
    }

    await admin.from("notifications").insert({
      member_id: data.member_id,
      title: "Application updated",
      message: `${data.application_type.replace(/_/g, " ")} application is now ${status.replace(/_/g, " ")}.`,
      channel: "in_app",
    })

    return NextResponse.redirect(new URL(`${redirectTo}?success=application-updated`, request.url), 303)
  } catch {
    return NextResponse.redirect(new URL("/csr?error=not-configured", request.url), 303)
  }
}

function safeCsrRedirect(value: FormDataEntryValue | null) {
  const path = String(value ?? "/csr")
  return path.startsWith("/csr") ? path : "/csr"
}
