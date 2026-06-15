import { NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { requireStaffRequest } from "@/lib/admin-auth"
import { BOTSWANA_COUNCILS } from "@/lib/botswana-locations"
import { getMembershipMonthlyCharge, normalizePaymentMonth, paymentMonthStart } from "@/lib/membership-payments"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: Request) {
  try {
    const { response } = await requireStaffRequest(request)
    if (response) return response

    const url = new URL(request.url)
    const council = url.searchParams.get("council")?.trim() ?? ""
    const paymentMonth = normalizePaymentMonth(url.searchParams.get("paymentMonth") ?? "") ?? paymentMonthStart()

    if (!BOTSWANA_COUNCILS.includes(council as (typeof BOTSWANA_COUNCILS)[number])) {
      return new NextResponse("Select a valid council.", { status: 400 })
    }

    const admin = createAdminClient()
    const { error: councilProbeError } = await admin.from("members").select("council").limit(1)
    const locationColumn = councilProbeError ? "region" : "council"
    const { data: members, error } = await admin
      .from("members")
      .select("id, full_name, national_id, email, mobile_number, monthly_salary")
      .eq(locationColumn, council)
      .order("full_name")

    if (error) throw error

    const memberIds = (members ?? []).map((member) => member.id)
    const eligibleMemberIds = new Set<string>()

    if (memberIds.length > 0) {
      const { data: eligibleApplications, error: applicationsError } = await admin
        .from("service_applications")
        .select("member_id")
        .eq("application_type", "membership")
        .in("status", ["approved", "fulfilled"])
        .in("member_id", memberIds)

      if (applicationsError) throw applicationsError
      for (const application of eligibleApplications ?? []) {
        eligibleMemberIds.add(application.member_id)
      }
    }

    const rows = []
    for (const member of members ?? []) {
      if (!eligibleMemberIds.has(member.id)) continue

      const charges = await getMembershipMonthlyCharge(admin, member.id)
      if (!member.national_id || charges.total <= 0) continue

      rows.push({
        Name: member.full_name,
        "National ID / Omang": member.national_id,
        Council: council,
        Email: member.email,
        Phone: member.mobile_number,
        "Payment Month": paymentMonth.slice(0, 7),
        "Monthly Salary": Number(member.monthly_salary ?? 0),
        "Total Deductions": charges.total,
      })
    }

    if (rows.length === 0) {
      return new NextResponse(
        "No eligible members were found for this council. A member must have an approved or fulfilled membership application, a National ID / Omang, and a valid monthly salary.",
        { status: 404 },
      )
    }

    const worksheet = XLSX.utils.json_to_sheet(rows, {
      header: ["Name", "National ID / Omang", "Council", "Email", "Phone", "Payment Month", "Monthly Salary", "Total Deductions"],
    })
    worksheet["!cols"] = [
      { wch: 24 },
      { wch: 22 },
      { wch: 34 },
      { wch: 32 },
      { wch: 18 },
      { wch: 16 },
      { wch: 18 },
      { wch: 18 },
    ]
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bulk Payments")
    const file = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })
    const safeCouncil = council.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

    return new NextResponse(file, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="bonu-${safeCouncil}-${paymentMonth.slice(0, 7)}-payments.xlsx"`,
        "X-BONU-Member-Count": String(rows.length),
      },
    })
  } catch (error) {
    console.error("Council payment template generation failed", error)
    return new NextResponse(
      "The council payment template could not be generated. There may be no eligible records to export, or a system error may have occurred. Please confirm that the council has members with approved or fulfilled membership applications, then try again. If the problem continues, contact the system administrator.",
      { status: 500 },
    )
  }
}
