import { NextResponse } from "next/server"
import { randomUUID } from "node:crypto"
import { requireMemberRequest } from "@/lib/member-auth"
import { createAdminClient } from "@/lib/supabase/admin"

const applicationTypes = new Set([
  "membership",
  "funeral_insurance",
  "legal_aid",
  "loan_assistance",
  "micro_loan",
  "merchandise",
  "electronic_contract",
])

export async function POST(request: Request) {
  try {
    const { supabase, user, response } = await requireMemberRequest(request)

    if (response) {
      return response
    }

    const formData = await request.formData()
    const applicationType = String(formData.get("applicationType") ?? "")
    const redirectTo = String(formData.get("redirectTo") ?? "/portal")

    if (!applicationTypes.has(applicationType)) {
      return NextResponse.redirect(new URL(`${redirectTo}?error=missing`, request.url), 303)
    }

    const { data: member } = await supabase.from("members").select("id").eq("user_id", user?.id).maybeSingle()

    if (!member) {
      return NextResponse.redirect(new URL("/portal/profile?error=profile-required", request.url), 303)
    }

    const details = Object.fromEntries(
      Array.from(formData.entries())
        .filter(([key]) => !["applicationType", "redirectTo", "requestedAmount", "monthlyDeduction", "termMonths"].includes(key) && !key.startsWith("attachment::"))
        .map(([key, value]) => [key, typeof value === "string" ? value : value.name]),
    )

    const { data: application, error } = await supabase
      .from("service_applications")
      .insert({
        member_id: member.id,
        application_type: applicationType,
        requested_amount: Number(formData.get("requestedAmount") ?? 0) || null,
        monthly_deduction: Number(formData.get("monthlyDeduction") ?? 0) || null,
        term_months: Number(formData.get("termMonths") ?? 0) || null,
        details,
        status: "submitted",
      })
      .select("id")
      .single()

    if (error || !application) {
      return NextResponse.redirect(new URL(`${redirectTo}?error=application-submit`, request.url), 303)
    }

    const attachmentResult = await saveAttachments(member.id, formData)

    if (attachmentResult.status === "upload-error") {
      return NextResponse.redirect(new URL(`${redirectTo}?error=document-upload`, request.url), 303)
    }

    if (attachmentResult.status === "record-error") {
      return NextResponse.redirect(new URL(`${redirectTo}?error=document-record`, request.url), 303)
    }

    if (attachmentResult.documentIds.length > 0) {
      const admin = createAdminClient()
      const { error: attachmentLinkError } = await admin
        .from("service_applications")
        .update({ details: { ...details, __attachmentDocumentIds: attachmentResult.documentIds } })
        .eq("id", application.id)

      if (attachmentLinkError) {
        console.error("Application attachment linking failed", attachmentLinkError)
      }
    }

    return NextResponse.redirect(new URL(`${redirectTo}?success=application-submitted`, request.url), 303)
  } catch {
    return NextResponse.redirect(new URL("/portal?error=not-configured", request.url), 303)
  }
}

async function saveAttachments(memberId: string, formData: FormData) {
  const admin = createAdminClient()
  const bucket = process.env.SUPABASE_MEMBER_DOCUMENTS_BUCKET || "member-documents"
  const attachmentEntries = Array.from(formData.entries()).filter(([key, value]) => key.startsWith("attachment::") && value instanceof File && value.size > 0)
  let savedCount = 0
  const documentIds: string[] = []

  for (const [key, value] of attachmentEntries) {
    const file = value as File
    const documentType = key.replace("attachment::", "")
    const extension = file.name.includes(".") ? file.name.split(".").pop() : "bin"
    const filePath = `${memberId}/${documentType.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${randomUUID()}.${extension}`
    const { error: uploadError } = await admin.storage.from(bucket).upload(filePath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    })

    if (uploadError) {
      console.error("Application attachment upload failed", uploadError)
      return { status: "upload-error" as const, count: savedCount, documentIds }
    }

    const { data: document, error: documentError } = await admin
      .from("member_documents")
      .insert({
        member_id: memberId,
        document_type: documentType,
        file_path: filePath,
      })
      .select("id")
      .single()

    if (documentError || !document) {
      console.error("Application attachment record insert failed", documentError)
      return { status: "record-error" as const, count: savedCount, documentIds }
    }

    savedCount += 1
    documentIds.push(document.id)
  }

  return { status: "ok" as const, count: savedCount, documentIds }
}
