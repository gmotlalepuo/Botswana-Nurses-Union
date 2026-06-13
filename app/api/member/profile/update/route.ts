import { NextResponse } from "next/server"
import { randomUUID } from "node:crypto"
import { requireMemberRequest } from "@/lib/member-auth"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  try {
    const { supabase, user, response } = await requireMemberRequest(request)

    if (response) {
      return response
    }

    const formData = await request.formData()
    const payload = {
      full_name: String(formData.get("fullName") ?? ""),
      national_id: String(formData.get("nationalId") ?? "") || null,
      date_of_birth: String(formData.get("dateOfBirth") ?? "") || null,
      gender: String(formData.get("gender") ?? "") || null,
      marital_status: String(formData.get("maritalStatus") ?? "") || null,
      occupation: String(formData.get("occupation") ?? "") || null,
      employer: String(formData.get("employer") ?? "") || null,
      employee_number: String(formData.get("employeeNumber") ?? "") || null,
      mobile_number: String(formData.get("mobileNumber") ?? ""),
      alternative_contact_number: String(formData.get("alternativeContactNumber") ?? "") || null,
      email: String(formData.get("email") ?? user?.email ?? ""),
      physical_address: String(formData.get("physicalAddress") ?? "") || null,
      postal_address: String(formData.get("postalAddress") ?? "") || null,
      district: String(formData.get("district") ?? "") || null,
      region: String(formData.get("region") ?? "") || null,
      work_station: String(formData.get("workStation") ?? "") || null,
      department: String(formData.get("department") ?? "") || null,
      employment_date: String(formData.get("employmentDate") ?? "") || null,
      monthly_salary: Number(formData.get("monthlySalary") ?? 0) || null,
      updated_at: new Date().toISOString(),
    }

    if (!payload.full_name || !payload.mobile_number || !payload.email) {
      return NextResponse.redirect(new URL("/portal/profile?error=missing", request.url), 303)
    }

    const admin = createAdminClient()
    const { data: existing } = await admin.from("members").select("id").eq("user_id", user?.id).maybeSingle()
    const memberResult = existing
      ? await admin.from("members").update(payload).eq("id", existing.id).select("id").single()
      : await admin.from("members").insert({
          user_id: user?.id,
          ...payload,
          status: "pending",
        }).select("id").single()
    const { data: member, error } = memberResult

    if (error) {
      console.error("Member profile update failed", error)
      return NextResponse.redirect(new URL("/portal/profile?error=profile-update", request.url), 303)
    }

    const attachmentResult = await saveAttachments(admin, member.id, formData)

    if (attachmentResult.status === "upload-error") {
      return NextResponse.redirect(new URL("/portal/profile?error=document-upload", request.url), 303)
    }

    if (attachmentResult.status === "record-error") {
      return NextResponse.redirect(new URL("/portal/profile?error=document-record", request.url), 303)
    }

    return NextResponse.redirect(new URL(`/portal/profile?success=profile-updated&attachments=${attachmentResult.count}`, request.url), 303)
  } catch (error) {
    console.error("Member profile submit failed", error)
    return NextResponse.redirect(new URL("/portal/profile?error=not-configured", request.url), 303)
  }
}

async function saveAttachments(
  admin: ReturnType<typeof createAdminClient>,
  memberId: string,
  formData: FormData,
) {
  const bucket = process.env.SUPABASE_MEMBER_DOCUMENTS_BUCKET || "member-documents"
  const attachmentEntries = Array.from(formData.entries()).filter(([key, value]) => key.startsWith("attachment::") && value instanceof File && value.size > 0)
  let savedCount = 0

  console.log("Profile submit attachment entries received", {
    bucket,
    count: attachmentEntries.length,
    names: attachmentEntries.map(([key, value]) => ({
      documentType: key.replace("attachment::", ""),
      fileName: (value as File).name,
      size: (value as File).size,
    })),
  })

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
      console.error("Member profile attachment upload failed", uploadError)
      return { status: "upload-error" as const, count: savedCount }
    }

    const { data: insertedDocument, error: documentError } = await admin
      .from("member_documents")
      .insert({
        member_id: memberId,
        document_type: documentType,
        file_path: filePath,
      })
      .select("id")
      .single()

    if (documentError || !insertedDocument) {
      console.error("Member profile attachment record insert failed", documentError)
      return { status: "record-error" as const, count: savedCount }
    }

    savedCount += 1
  }

  return { status: "ok" as const, count: savedCount }
}
