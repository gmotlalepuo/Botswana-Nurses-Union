import { NextResponse } from "next/server"
import { randomUUID } from "node:crypto"
import { requireMemberRequest } from "@/lib/member-auth"
import { BUNDLE_PROVIDERS, BUNDLE_TERMS, BUNDLE_TYPES, isBotswanaMobile } from "@/lib/bundle-service"
import { isMemberProfileComplete, type MemberProfile } from "@/lib/member-data"
import { createAdminClient } from "@/lib/supabase/admin"

const applicationTypes = new Set([
  "membership",
  "funeral_insurance",
  "legal_aid",
  "loan_assistance",
  "micro_loan",
  "merchandise",
  "electronic_contract",
  "bundle",
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

    if (applicationType === "bundle" && !isValidBundleRequest(formData)) {
      return NextResponse.redirect(new URL(`${redirectTo}?error=bundle-invalid`, request.url), 303)
    }

    if (applicationType === "membership") {
      const membershipError = validateMembershipRequest(formData)
      if (membershipError) {
        return NextResponse.redirect(new URL(`${redirectTo}?error=${membershipError}`, request.url), 303)
      }
    }

    if (applicationType === "funeral_insurance") {
      const funeralError = validateFuneralRequest(formData)
      if (funeralError) {
        return NextResponse.redirect(new URL(`${redirectTo}?error=${funeralError}`, request.url), 303)
      }
    }

    const { data: rawMember } = await supabase.from("members").select("*").eq("user_id", user?.id).maybeSingle()
    const member = rawMember
      ? { ...rawMember, council: rawMember.council ?? rawMember.region ?? null } as MemberProfile
      : null

    if (!member) {
      return NextResponse.redirect(new URL("/portal/profile?error=profile-required", request.url), 303)
    }

    if (!isMemberProfileComplete(member)) {
      return NextResponse.redirect(new URL("/portal/profile?error=profile-required", request.url), 303)
    }

    if (applicationType !== "membership" && member.status !== "active") {
      return NextResponse.redirect(new URL(`${redirectTo}?error=membership-active-required`, request.url), 303)
    }

    if (applicationType === "membership") {
      const { data: openMembershipApplication } = await supabase
        .from("service_applications")
        .select("id")
        .eq("member_id", member.id)
        .eq("application_type", "membership")
        .in("status", ["submitted", "in_review", "more_info_required"])
        .limit(1)
        .maybeSingle()

      if (openMembershipApplication) {
        return NextResponse.redirect(new URL(`${redirectTo}?error=membership-submission-open`, request.url), 303)
      }
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

function validateMembershipRequest(formData: FormData) {
  const citizenship = String(formData.get("citizenship") ?? "")
  const employmentSector = String(formData.get("employmentSector") ?? "")
  if (!["citizen", "non_citizen"].includes(citizenship) || !["public", "private"].includes(employmentSector)) {
    return "membership-classification"
  }
  if (formData.get("informationConsent") !== "accepted") {
    return "membership-consent"
  }

  const requiredDocuments = employmentSector === "public"
    ? ["Deduction Form"]
    : ["Direct Debit Form"]

  for (const documentName of requiredDocuments) {
    const file = formData.get(`attachment::${documentName}`)
    if (!(file instanceof File) || file.size === 0) return "membership-documents"
  }

  const uploads = Array.from(formData.entries())
    .filter(([key, value]) => key.startsWith("attachment::") && value instanceof File && value.size > 0)
    .map(([, value]) => value as File)
  const acceptedTypes = new Set(["application/pdf", "image/jpeg", "image/png"])
  if (uploads.some((file) => file.size > 10 * 1024 * 1024 || !acceptedTypes.has(file.type))) {
    return "membership-file-invalid"
  }

  return null
}

function validateFuneralRequest(formData: FormData) {
  const funeralPolicy = formData.get("attachment::Funeral Policy Form")
  if (!(funeralPolicy instanceof File) || funeralPolicy.size === 0) {
    return "funeral-documents"
  }

  if (formData.get("addDependants") === "accepted") {
    const additionalMembers = formData.get("attachment::Additional Member Funeral Form")
    if (!(additionalMembers instanceof File) || additionalMembers.size === 0) {
      return "funeral-additional-document"
    }
  }

  const uploads = Array.from(formData.entries())
    .filter(([key, value]) => key.startsWith("attachment::") && value instanceof File && value.size > 0)
    .map(([, value]) => value as File)
  const acceptedTypes = new Set(["application/pdf", "image/jpeg", "image/png"])
  return uploads.some((file) => file.size > 10 * 1024 * 1024 || !acceptedTypes.has(file.type))
    ? "membership-file-invalid"
    : null
}

function isValidBundleRequest(formData: FormData) {
  const provider = String(formData.get("provider") ?? "")
  const bundleType = String(formData.get("bundleType") ?? "")
  const recipientName = String(formData.get("recipientName") ?? "").trim()
  const mobileNumber = String(formData.get("mobileNumber") ?? "")
  const monthlyDeduction = Number(formData.get("monthlyDeduction") ?? 0)
  const termMonths = String(formData.get("termMonths") ?? "")
  const activationDay = Number(formData.get("activationDay") ?? 0)
  const dataAllowance = String(formData.get("dataAllowance") ?? "")
  const voiceMinutes = String(formData.get("voiceMinutes") ?? "")
  const requiresData = bundleType === "Data bundle" || bundleType === "Voice and data bundle"
  const requiresVoice = bundleType === "Voice and data bundle"

  return BUNDLE_PROVIDERS.includes(provider as (typeof BUNDLE_PROVIDERS)[number]) &&
    BUNDLE_TYPES.includes(bundleType as (typeof BUNDLE_TYPES)[number]) &&
    recipientName.length >= 2 &&
    isBotswanaMobile(mobileNumber) &&
    Number.isFinite(monthlyDeduction) &&
    monthlyDeduction >= 10 &&
    monthlyDeduction <= 5000 &&
    BUNDLE_TERMS.includes(termMonths as (typeof BUNDLE_TERMS)[number]) &&
    Number.isInteger(activationDay) &&
    activationDay >= 1 &&
    activationDay <= 28 &&
    (!requiresData || Boolean(dataAllowance)) &&
    (!requiresVoice || Boolean(voiceMinutes)) &&
    formData.get("deductionConsent") === "accepted" &&
    formData.get("informationConsent") === "accepted"
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
