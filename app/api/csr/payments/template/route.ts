import { NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { requireStaffRequest } from "@/lib/admin-auth"
import { BOTSWANA_COUNCILS } from "@/lib/botswana-locations"
import { getApprovedMonthlyCharges, normalizePaymentMonth, paymentMonthStart } from "@/lib/membership-payments"
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
      .select("id, full_name, national_id, email, mobile_number")
      .eq(locationColumn, council)
      .order("full_name")

    if (error) throw error

    const rows = []
    for (const member of members ?? []) {
      const charges = await getApprovedMonthlyCharges(admin, member.id)
      if (!member.national_id || charges.total <= 0) continue

      rows.push({
        Name: member.full_name,
        "National ID / Omang": member.national_id,
        Council: council,
        Email: member.email,
        Phone: member.mobile_number,
        "Payment Month": paymentMonth.slice(0, 7),
        "Total Deductions": charges.total,
      })
    }

    const worksheet = XLSX.utils.json_to_sheet(rows, {
      header: ["Name", "National ID / Omang", "Council", "Email", "Phone", "Payment Month", "Total Deductions"],
    })
    worksheet["!cols"] = [
      { wch: 24 },
      { wch: 22 },
      { wch: 34 },
      { wch: 32 },
      { wch: 18 },
      { wch: 16 },
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
    return new NextResponse("Could not generate the council payment template.", { status: 500 })
  }
}
