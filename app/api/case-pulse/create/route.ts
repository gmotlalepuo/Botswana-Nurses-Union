import { NextResponse } from "next/server"
import { randomUUID } from "node:crypto"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

const staffRoles = new Set(["admin", "csr"])

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
    const applicationId = String(formData.get("applicationId") ?? "")
    const redirectTo = String(formData.get("redirectTo") ?? "/portal")
    const comment = String(formData.get("comment") ?? "").trim()
    const attachment = formData.get("attachment")

    if (!applicationId || (!comment && (!(attachment instanceof File) || attachment.size === 0))) {
      return NextResponse.redirect(new URL(`${redirectTo}?error=missing`, request.url), 303)
    }

    const admin = createAdminClient()
    const { data: role } = await admin.from("user_roles").select("role").eq("user_id", user.id).maybeSingle()
    const authorRole = staffRoles.has(String(role?.role)) ? String(role?.role) : "member"
    const { data: application, error: applicationError } = await admin
      .from("service_applications")
      .select("id, member_id, members(user_id)")
      .eq("id", applicationId)
      .maybeSingle()

    if (applicationError || !application) {
      return NextResponse.redirect(new URL(`${redirectTo}?error=missing`, request.url), 303)
    }

    const memberRecord = Array.isArray(application.members) ? application.members[0] : application.members
    const ownsCase = memberRecord?.user_id === user.id

    if (!staffRoles.has(authorRole) && !ownsCase) {
      return NextResponse.redirect(new URL(`${redirectTo}?error=member-required`, request.url), 303)
    }

    const filePath = attachment instanceof File && attachment.size > 0 ? await uploadPulseFile(admin, applicationId, attachment) : null

    if (filePath === "upload-error") {
      return NextResponse.redirect(new URL(`${redirectTo}?error=document-upload`, request.url), 303)
    }

    const { error } = await admin.from("case_pulses").insert({
      application_id: applicationId,
      member_id: application.member_id,
      author_user_id: user.id,
      author_role: authorRole,
      comment: comment || null,
      file_path: filePath,
    })

    if (error) {
      console.error("Case pulse insert failed", error)
      return NextResponse.redirect(new URL(`${redirectTo}?error=application-submit`, request.url), 303)
    }

    return NextResponse.redirect(new URL(`${redirectTo}?success=pulse-added`, request.url), 303)
  } catch (error) {
    console.error("Case pulse submit failed", error)
    return NextResponse.redirect(new URL("/portal?error=not-configured", request.url), 303)
  }
}

async function uploadPulseFile(admin: ReturnType<typeof createAdminClient>, applicationId: string, file: File) {
  const bucket = process.env.SUPABASE_MEMBER_DOCUMENTS_BUCKET || "member-documents"
  const extension = file.name.includes(".") ? file.name.split(".").pop() : "bin"
  const filePath = `case-pulses/${applicationId}/${randomUUID()}.${extension}`
  const { error } = await admin.storage.from(bucket).upload(filePath, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  })

  if (error) {
    console.error("Case pulse file upload failed", error)
    return "upload-error"
  }

  return filePath
}
