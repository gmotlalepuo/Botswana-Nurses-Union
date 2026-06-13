import { NextResponse } from "next/server"
import { requireStaffRequest } from "@/lib/admin-auth"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  try {
    const { user, response } = await requireStaffRequest(request)

    if (response) {
      return response
    }

    const formData = await request.formData()
    const documentId = String(formData.get("documentId") ?? "")
    const verified = String(formData.get("verified") ?? "") === "yes"
    const redirectTo = safeCsrRedirect(formData.get("redirectTo"))

    if (!documentId) {
      return NextResponse.redirect(new URL(`${redirectTo}?error=missing`, request.url), 303)
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from("member_documents")
      .update({
        verified_at: verified ? new Date().toISOString() : null,
        verified_by: verified ? user?.id : null,
      })
      .eq("id", documentId)
      .select("document_type, member_id")
      .single()

    if (error) {
      return NextResponse.redirect(new URL(`${redirectTo}?error=document-verify`, request.url), 303)
    }

    await admin.from("notifications").insert({
      member_id: data.member_id,
      title: "Document verification updated",
      message: `${data.document_type} was marked ${verified ? "verified" : "unverified"}.`,
      channel: "in_app",
    })

    return NextResponse.redirect(new URL(`${redirectTo}?success=document-verified`, request.url), 303)
  } catch {
    return NextResponse.redirect(new URL("/csr?error=not-configured", request.url), 303)
  }
}

function safeCsrRedirect(value: FormDataEntryValue | null) {
  const path = String(value ?? "/csr")
  return path.startsWith("/csr") ? path : "/csr"
}
