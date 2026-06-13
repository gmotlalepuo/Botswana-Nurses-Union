import { NextResponse } from "next/server"
import { requireMemberRequest } from "@/lib/member-auth"
import { createAdminClient } from "@/lib/supabase/admin"

const billableServiceTypes = ["funeral_insurance", "legal_aid", "loan_assistance", "micro_loan", "merchandise", "electronic_contract"]
const approvedStatuses = ["approved", "fulfilled"]

export async function POST(request: Request) {
  try {
    const { user, response } = await requireMemberRequest(request)

    if (response) {
      return response
    }

    const supabase = createAdminClient()
    const { data: member, error: memberError } = await supabase.from("members").select("id, status").eq("user_id", user?.id).maybeSingle()

    if (memberError || !member) {
      return NextResponse.redirect(new URL("/portal/profile?error=profile-required", request.url), 303)
    }

    const { data: approvedServices, error: serviceError } = await supabase
      .from("service_applications")
      .select("id, monthly_deduction")
      .eq("member_id", member.id)
      .in("application_type", billableServiceTypes)
      .in("status", approvedStatuses)
      .gt("monthly_deduction", 0)

    if (serviceError) {
      console.error("Approved billable services lookup failed", serviceError)
      return NextResponse.redirect(new URL("/portal/membership?error=subscription-create", request.url), 303)
    }

    const approvedMonthlyTotal = (approvedServices ?? []).reduce((sum, service) => sum + Number(service.monthly_deduction ?? 0), 0)

    if (!approvedServices?.length || approvedMonthlyTotal <= 0) {
      return NextResponse.redirect(new URL("/portal/membership?error=subscription-approval-required", request.url), 303)
    }

    if (member.status !== "active") {
      const { error } = await supabase.from("members").update({ status: "active", updated_at: new Date().toISOString() }).eq("id", member.id)

      if (error) {
        console.error("Membership activation failed", error)
        return NextResponse.redirect(new URL("/portal/membership?error=subscription-create", request.url), 303)
      }
    }

    return NextResponse.redirect(new URL("/portal/membership?success=subscription-created", request.url), 303)
  } catch (error) {
    console.error("Membership subscription route failed", error)
    return NextResponse.redirect(new URL("/portal/membership?error=not-configured", request.url), 303)
  }
}
