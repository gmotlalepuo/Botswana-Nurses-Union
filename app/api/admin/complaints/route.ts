import { NextResponse } from "next/server"
import { requireAdminRequest } from "@/lib/admin-auth"
import { createAdminClient } from "@/lib/supabase/admin"

const statuses = new Set(["open", "in_review", "resolved", "closed"])
const priorities = new Set(["low", "medium", "high", "urgent"])

export async function POST(request: Request) {
  try {
    const { user, response } = await requireAdminRequest(request)

    if (response) {
      return response
    }

    const formData = await request.formData()
    const action = String(formData.get("action") ?? "create")
    const admin = createAdminClient()

    if (action === "create") {
      const subject = String(formData.get("subject") ?? "")
      const category = String(formData.get("category") ?? "General")
      const description = String(formData.get("description") ?? "")
      const priority = String(formData.get("priority") ?? "medium")

      if (!subject || !description || !priorities.has(priority)) {
        return NextResponse.redirect(new URL("/admin/complaints?error=missing", request.url), 303)
      }

      const { data, error } = await admin
        .from("complaints")
        .insert({
          subject,
          category,
          description,
          priority,
          status: "open",
          submitted_by: user?.id,
        })
        .select("id")
        .single()

      if (error) {
        return NextResponse.redirect(new URL("/admin/complaints?error=complaint-create", request.url), 303)
      }

      await admin.from("notifications").insert({
        title: "New complaint",
        message: `${subject} has been logged for admin review.`,
        channel: "in_app",
      })

      return NextResponse.redirect(new URL("/admin/complaints?success=complaint-created", request.url), 303)
    }

    const complaintId = String(formData.get("complaintId") ?? "")
    const status = String(formData.get("status") ?? "")
    const priority = String(formData.get("priority") ?? "")
    const resolutionNotes = String(formData.get("resolutionNotes") ?? "")

    if (!complaintId || !statuses.has(status) || !priorities.has(priority)) {
      return NextResponse.redirect(new URL("/admin/complaints?error=missing", request.url), 303)
    }

    const { data, error } = await admin
      .from("complaints")
      .update({
        status,
        priority,
        resolution_notes: resolutionNotes || null,
        resolved_at: status === "resolved" || status === "closed" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", complaintId)
      .select("subject")
      .single()

    if (error) {
      return NextResponse.redirect(new URL("/admin/complaints?error=complaint-update", request.url), 303)
    }

    await admin.from("notifications").insert({
      title: "Complaint updated",
      message: `${data.subject} is now ${status.replace("_", " ")}.`,
      channel: "in_app",
    })

    return NextResponse.redirect(new URL("/admin/complaints?success=complaint-updated", request.url), 303)
  } catch {
    return NextResponse.redirect(new URL("/admin/complaints?error=not-configured", request.url), 303)
  }
}
