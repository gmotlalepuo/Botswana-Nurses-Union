import { NextResponse } from "next/server"
import { requireMemberRequest } from "@/lib/member-auth"
import { createAdminClient } from "@/lib/supabase/admin"

const categories = new Set(["Membership", "Payments", "Funeral Insurance", "Legal Aid", "External Loans", "Micro-Lending", "Shop", "Electronic Contracts", "Bundles", "Profile", "Other"])
const priorities = new Set(["low", "medium", "high", "urgent"])

export async function POST(request: Request) {
  try {
    const { user, response } = await requireMemberRequest(request)
    if (response || !user) return response

    const formData = await request.formData()
    const subject = String(formData.get("subject") ?? "").trim()
    const category = String(formData.get("category") ?? "").trim()
    const description = String(formData.get("description") ?? "").trim()
    const priority = String(formData.get("priority") ?? "medium")

    if (!subject || !description || !categories.has(category) || !priorities.has(priority)) {
      return NextResponse.redirect(new URL("/portal/complaints?error=missing", request.url), 303)
    }

    const admin = createAdminClient()
    const { data: member, error: memberError } = await admin
      .from("members")
      .select("id, full_name")
      .eq("user_id", user.id)
      .maybeSingle()

    if (memberError || !member) {
      return NextResponse.redirect(new URL("/portal/profile?error=profile-required", request.url), 303)
    }

    const { data: complaint, error } = await admin
      .from("complaints")
      .insert({
        member_id: member.id,
        submitted_by: user.id,
        subject,
        category,
        description,
        priority,
        status: "open",
      })
      .select("id")
      .single()

    if (error || !complaint) {
      console.error("Member complaint creation failed", error)
      if (error?.code === "PGRST205" || error?.code === "42P01") {
        return NextResponse.redirect(new URL("/portal/complaints?error=complaint-migration-required", request.url), 303)
      }
      return NextResponse.redirect(new URL("/portal/complaints?error=complaint-create", request.url), 303)
    }

    await admin.from("notifications").insert({
      member_id: member.id,
      title: "Complaint received",
      message: `Complaint "${subject}" was submitted to the CSR team.`,
      channel: "in_app",
    })

    return NextResponse.redirect(new URL("/portal/complaints?success=complaint-created", request.url), 303)
  } catch (error) {
    console.error("Member complaint submission failed", error)
    return NextResponse.redirect(new URL("/portal/complaints?error=not-configured", request.url), 303)
  }
}
