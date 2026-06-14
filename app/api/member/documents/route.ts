import { NextResponse } from "next/server"
import { randomUUID } from "node:crypto"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL("/auth/login?error=session", request.url), 303)
    }

    const formData = await request.formData()
    const documentType = String(formData.get("documentType") ?? "")
    const file = formData.get("document")

    if (!documentType || !(file instanceof File) || file.size === 0) {
      return NextResponse.redirect(new URL("/portal/profile?error=missing", request.url), 303)
    }

    const admin = createAdminClient()
    const { data: existingMember } = await admin.from("members").select("id").eq("user_id", user.id).maybeSingle()
    const member = existingMember
      ? await updateProfileFromUploadForm(admin, existingMember.id, formData)
      : await createProfileFromUploadForm(admin, user.id, user.email, formData)

    if (!member) {
      return NextResponse.redirect(new URL("/portal/profile?error=profile", request.url), 303)
    }

    const bucket = process.env.SUPABASE_MEMBER_DOCUMENTS_BUCKET || "member-documents"
    const extension = file.name.includes(".") ? file.name.split(".").pop() : "bin"
    const filePath = `${member.id}/${documentType.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${randomUUID()}.${extension}`
    const { error: uploadError } = await admin.storage.from(bucket).upload(filePath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    })

    if (uploadError) {
      console.error("Member document upload failed", uploadError)
      return NextResponse.redirect(new URL("/portal/profile?error=document-upload", request.url), 303)
    }

    const { error: documentError } = await admin.from("member_documents").insert({
      member_id: member.id,
      document_type: documentType,
      file_path: filePath,
    })

    if (documentError) {
      console.error("Member document record insert failed", documentError)
      return NextResponse.redirect(new URL("/portal/profile?error=document-record", request.url), 303)
    }

    return NextResponse.redirect(new URL("/portal/profile?success=document-received", request.url), 303)
  } catch {
    return NextResponse.redirect(new URL("/portal/profile?error=not-configured", request.url), 303)
  }
}

async function updateProfileFromUploadForm(
  admin: ReturnType<typeof createAdminClient>,
  memberId: string,
  formData: FormData,
) {
  const fullName = String(formData.get("fullName") ?? "").trim()
  const mobileNumber = String(formData.get("mobileNumber") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim()

  if (!fullName || !mobileNumber || !email) {
    return { id: memberId }
  }

  const locationColumn = await getCouncilColumn(admin)
  const { error } = await admin
    .from("members")
    .update({
      full_name: fullName,
      national_id: String(formData.get("nationalId") ?? "") || null,
      date_of_birth: String(formData.get("dateOfBirth") ?? "") || null,
      gender: String(formData.get("gender") ?? "") || null,
      marital_status: String(formData.get("maritalStatus") ?? "") || null,
      occupation: String(formData.get("occupation") ?? "") || null,
      employer: String(formData.get("employer") ?? "") || null,
      employee_number: String(formData.get("employeeNumber") ?? "") || null,
      mobile_number: mobileNumber,
      alternative_contact_number: String(formData.get("alternativeContactNumber") ?? "") || null,
      email,
      physical_address: String(formData.get("physicalAddress") ?? "") || null,
      postal_address: String(formData.get("postalAddress") ?? "") || null,
      district: String(formData.get("district") ?? "") || null,
      [locationColumn]: String(formData.get("council") ?? "") || null,
      work_station: String(formData.get("workStation") ?? "") || null,
      department: String(formData.get("department") ?? "") || null,
      employment_date: String(formData.get("employmentDate") ?? "") || null,
      monthly_salary: Number(formData.get("monthlySalary") ?? 0) || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", memberId)

  if (error) {
    console.error("Member profile sync before document upload failed", error)
  }

  return { id: memberId }
}

async function createProfileFromUploadForm(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  email: string | undefined,
  formData: FormData,
) {
  const fullName = String(formData.get("fullName") ?? "").trim()
  const mobileNumber = String(formData.get("mobileNumber") ?? "").trim()
  const profileEmail = String(formData.get("email") ?? email ?? "").trim()

  if (!fullName || !mobileNumber || !profileEmail) {
    console.error("Cannot create member before document upload: missing full name, mobile number, or email.")
    return null
  }

  const locationColumn = await getCouncilColumn(admin)
  const payload = {
    user_id: userId,
    full_name: fullName,
    national_id: String(formData.get("nationalId") ?? "") || null,
    date_of_birth: String(formData.get("dateOfBirth") ?? "") || null,
    gender: String(formData.get("gender") ?? "") || null,
    marital_status: String(formData.get("maritalStatus") ?? "") || null,
    occupation: String(formData.get("occupation") ?? "") || null,
    employer: String(formData.get("employer") ?? "") || null,
    employee_number: String(formData.get("employeeNumber") ?? "") || null,
    mobile_number: mobileNumber,
    alternative_contact_number: String(formData.get("alternativeContactNumber") ?? "") || null,
    email: profileEmail,
    physical_address: String(formData.get("physicalAddress") ?? "") || null,
    postal_address: String(formData.get("postalAddress") ?? "") || null,
    district: String(formData.get("district") ?? "") || null,
    [locationColumn]: String(formData.get("council") ?? "") || null,
    work_station: String(formData.get("workStation") ?? "") || null,
    department: String(formData.get("department") ?? "") || null,
    employment_date: String(formData.get("employmentDate") ?? "") || null,
    monthly_salary: Number(formData.get("monthlySalary") ?? 0) || null,
    status: "pending",
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await admin.from("members").insert(payload).select("id").single()

  if (error) {
    console.error("Member profile creation before document upload failed", error)
    return null
  }

  return data
}

async function getCouncilColumn(admin: ReturnType<typeof createAdminClient>) {
  const { error } = await admin.from("members").select("council").limit(1)
  return error ? "region" : "council"
}
