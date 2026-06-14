import { NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { requireStaffRequest } from "@/lib/admin-auth"
import {
  completeMonthlyPayment,
  findMonthlyPayment,
  getApprovedMonthlyCharges,
  normalizePaymentMonth,
} from "@/lib/membership-payments"
import { createAdminClient } from "@/lib/supabase/admin"

type ImportStatus = "paid" | "unmatched" | "duplicate" | "invalid"

type ImportResult = {
  row: number
  name: string
  nationalId: string
  paymentMonth: string
  amount: number | null
  status: ImportStatus
  message: string
  warning?: string
}

export async function POST(request: Request) {
  try {
    const { user, response } = await requireStaffRequest(request)
    if (response || !user) return response

    const formData = await request.formData()
    const file = formData.get("file")
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Choose a CSV or Excel payment file." }, { status: 400 })
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "The payment file must be 10 MB or smaller." }, { status: 400 })
    }

    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true })
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: "", raw: false })
    if (rows.length === 0) {
      return NextResponse.json({ error: "The payment file has no data rows." }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: batch, error: batchError } = await admin
      .from("payment_import_batches")
      .insert({
        uploaded_by: user.id,
        file_name: file.name,
        total_rows: rows.length,
      })
      .select("id")
      .single()
    if (batchError || !batch) throw batchError ?? new Error("Could not create payment import batch.")

    const { data: members, error: membersError } = await admin
      .from("members")
      .select("*")
    if (membersError) throw membersError

    const membersByNationalId = new Map<string, (typeof members)[number]>()
    for (const member of members ?? []) {
      const key = normalizeNationalId(member.national_id)
      if (key) membersByNationalId.set(key, member)
    }

    const results: ImportResult[] = []
    const seenRows = new Set<string>()

    for (let index = 0; index < rows.length; index += 1) {
      const normalized = normalizeRow(rows[index])
      const rowNumber = index + 2
      const amount = parseAmount(normalized.totalDeductions)
      const paymentMonth = parsePaymentMonth(normalized.paymentMonth)
      const nationalIdKey = normalizeNationalId(normalized.nationalId)

      if (!nationalIdKey || !paymentMonth || amount === null || amount <= 0) {
        results.push({
          row: rowNumber,
          name: normalized.name,
          nationalId: normalized.nationalId,
          paymentMonth: paymentMonth ?? normalized.paymentMonth,
          amount,
          status: "invalid",
          message: "National ID, payment month (YYYY-MM), or total deductions is invalid.",
        })
        continue
      }

      const rowKey = `${nationalIdKey}:${paymentMonth}`
      if (seenRows.has(rowKey)) {
        results.push({
          row: rowNumber,
          name: normalized.name,
          nationalId: normalized.nationalId,
          paymentMonth,
          amount,
          status: "duplicate",
          message: "This member and payment month appears more than once in the uploaded file.",
        })
        continue
      }
      seenRows.add(rowKey)

      const member = membersByNationalId.get(nationalIdKey)
      if (!member) {
        results.push({
          row: rowNumber,
          name: normalized.name,
          nationalId: normalized.nationalId,
          paymentMonth,
          amount,
          status: "unmatched",
          message: "No member account matches this National ID / Omang.",
        })
        continue
      }

      const existing = await findMonthlyPayment(admin, member.id, paymentMonth)
      if (existing?.status === "paid") {
        results.push({
          row: rowNumber,
          name: normalized.name || member.full_name,
          nationalId: normalized.nationalId,
          paymentMonth,
          amount,
          status: "duplicate",
          message: `Payment was already processed via ${existing.payment_source === "stripe" ? "Stripe" : "a CSR import"}.`,
        })
        continue
      }

      const charges = await getApprovedMonthlyCharges(admin, member.id)
      if (charges.total <= 0) {
        results.push({
          row: rowNumber,
          name: normalized.name || member.full_name,
          nationalId: normalized.nationalId,
          paymentMonth,
          amount,
          status: "invalid",
          message: "The matched member has no approved monthly service deductions.",
        })
        continue
      }

      const warnings = buildWarnings(normalized, member, amount, charges.total)
      const completed = await completeMonthlyPayment({
        admin,
        memberId: member.id,
        paymentMonth,
        amount,
        expectedAmount: charges.total,
        source: "csr_import",
        paidAt: new Date().toISOString(),
        breakdown: charges.breakdown,
        importBatchId: batch.id,
        metadata: {
          uploadedName: normalized.name,
          uploadedCouncil: normalized.council,
          uploadedEmail: normalized.email,
          uploadedPhone: normalized.phone,
        },
      })

      results.push({
        row: rowNumber,
        name: normalized.name || member.full_name,
        nationalId: normalized.nationalId,
        paymentMonth,
        amount,
        status: completed.status === "duplicate" ? "duplicate" : "paid",
        message: completed.status === "duplicate" ? "Payment was already processed." : "Payment recorded and membership activated.",
        warning: warnings.length > 0 ? warnings.join(" ") : undefined,
      })
    }

    const counts = {
      paid: results.filter((result) => result.status === "paid").length,
      unmatched: results.filter((result) => result.status === "unmatched").length,
      duplicate: results.filter((result) => result.status === "duplicate").length,
      invalid: results.filter((result) => result.status === "invalid").length,
      warnings: results.filter((result) => Boolean(result.warning)).length,
    }
    const paymentMonths = Array.from(new Set(results.map((result) => result.paymentMonth).filter(Boolean)))

    await admin.from("payment_import_batches").update({
      payment_month: paymentMonths.length === 1 ? paymentMonths[0] : null,
      paid_rows: counts.paid,
      unmatched_rows: counts.unmatched,
      duplicate_rows: counts.duplicate,
      invalid_rows: counts.invalid,
      warning_rows: counts.warnings,
      result: { counts, rows: results },
    }).eq("id", batch.id)

    return NextResponse.json({ batchId: batch.id, fileName: file.name, counts, rows: results })
  } catch (error) {
    console.error("CSR payment import failed", error)
    return NextResponse.json({ error: "The payment file could not be processed. Apply migration 011 and verify the file format." }, { status: 500 })
  }
}

function normalizeRow(row: Record<string, unknown>) {
  const values = new Map(
    Object.entries(row).map(([key, value]) => [
      key.toLowerCase().replace(/[^a-z0-9]/g, ""),
      String(value ?? "").trim(),
    ]),
  )
  const get = (...keys: string[]) => keys.map((key) => values.get(key)).find((value) => value !== undefined) ?? ""

  return {
    name: get("name", "fullname", "membername"),
    nationalId: get("nationalidomang", "nationalid", "omang", "idnumber"),
    council: get("council"),
    email: get("email", "emailaddress"),
    phone: get("phone", "phonenumber", "mobilenumber", "mobile"),
    paymentMonth: get("paymentmonth", "month"),
    totalDeductions: get("totaldeductions", "totaldeduction", "amount", "total"),
  }
}

function normalizeNationalId(value: unknown) {
  return String(value ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "")
}

function parseAmount(value: string) {
  const amount = Number(value.replace(/[^\d.-]/g, ""))
  return Number.isFinite(amount) ? amount : null
}

function parsePaymentMonth(value: string) {
  const normalized = normalizePaymentMonth(value)
  if (normalized) return normalized
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime())
    ? null
    : `${parsed.getUTCFullYear()}-${String(parsed.getUTCMonth() + 1).padStart(2, "0")}-01`
}

function normalizeText(value: unknown) {
  return String(value ?? "").trim().toLowerCase()
}

function normalizePhone(value: unknown) {
  return String(value ?? "").replace(/\D/g, "").slice(-8)
}

function buildWarnings(
  row: ReturnType<typeof normalizeRow>,
  member: { full_name: string; council?: string | null; region?: string | null; email: string; mobile_number: string },
  amount: number,
  expectedAmount: number,
) {
  const warnings: string[] = []
  if (row.name && normalizeText(row.name) !== normalizeText(member.full_name)) warnings.push("Name differs from the member profile.")
  if (row.council && normalizeText(row.council) !== normalizeText(member.council ?? member.region)) warnings.push("Council differs from the member profile.")
  if (row.email && normalizeText(row.email) !== normalizeText(member.email)) warnings.push("Email differs from the member profile.")
  if (row.phone && normalizePhone(row.phone) !== normalizePhone(member.mobile_number)) warnings.push("Phone differs from the member profile.")
  if (Math.abs(amount - expectedAmount) > 0.009) warnings.push(`Uploaded amount differs from the expected P ${expectedAmount.toFixed(2)}.`)
  return warnings
}
