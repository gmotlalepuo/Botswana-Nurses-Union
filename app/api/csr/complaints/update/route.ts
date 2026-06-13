import { NextResponse } from "next/server"
import { requireStaffRequest } from "@/lib/admin-auth"
import { createAdminClient } from "@/lib/supabase/admin"

const statuses = new Set(["open", "in_review", "resolved", "closed"])
const priorities = new Set(["low", "medium", "high", "urgent"])

export async function POST(request: Request) {
  try {
    const { user, response } = await requireStaffRequest(request)

    if (response) {
      return response
    }

    const formData = await request.formData()
    const complaintId = String(formData.get("complaintId") ?? "")
    const status = String(formData.get("status") ?? "")
    const priority = String(formData.get("priority") ?? "")
    const resolutionNotes = String(formData.get("resolutionNotes") ?? "").trim()
    const redirectTo = safeCsrRedirect(formData.get("redirectTo"))

    if (!complaintId || !statuses.has(status) || !priorities.has(priority)) {
      return NextResponse.redirect(new URL(`${redirectTo}?error=missing`, request.url), 303)
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from("complaints")
      .update({
        status,
        priority,
        assigned_to: user?.id,
        resolution_notes: resolutionNotes || null,
        resolved_at: status === "resolved" || status === "closed" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", complaintId)
      .select("subject, member_id")
      .single()

    if (error) {
      return NextResponse.redirect(new URL(`${redirectTo}?error=complaint-update`, request.url), 303)
    }

    await admin.from("notifications").insert({
      member_id: data.member_id,
      title: "Complaint updated",
      message: `${data.subject} is now ${status.replace(/_/g, " ")}.`,
      channel: "in_app",
    })

    return NextResponse.redirect(new URL(`${redirectTo}?success=complaint-updated`, request.url), 303)
  } catch {
    return NextResponse.redirect(new URL("/csr?error=not-configured#complaints", request.url), 303)
  }
}

function safeCsrRedirect(value: FormDataEntryValue | null) {
  const path = String(value ?? "/csr")
  return path.startsWith("/csr") ? path : "/csr"
}
