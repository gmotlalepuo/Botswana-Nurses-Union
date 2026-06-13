import { NextResponse } from "next/server"
import { requireStaffRequest } from "@/lib/admin-auth"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: Request) {
  try {
    const { response } = await requireStaffRequest(request)

    if (response) {
      return response
    }

    const url = new URL(request.url)
    const documentId = url.searchParams.get("documentId") ?? ""
    const shouldDownload = url.searchParams.get("download") === "1"

    if (!documentId) {
      return new NextResponse("Missing document.", { status: 400 })
    }

    const admin = createAdminClient()
    const { data: document, error } = await admin
      .from("member_documents")
      .select("id, document_type, file_path")
      .eq("id", documentId)
      .maybeSingle()

    if (error || !document?.file_path) {
      return new NextResponse("Document not found.", { status: 404 })
    }

    const bucket = process.env.SUPABASE_MEMBER_DOCUMENTS_BUCKET || "member-documents"
    const fileName = document.file_path.split("/").pop() || `${document.document_type}.pdf`
    const { data, error: signedUrlError } = await admin.storage.from(bucket).createSignedUrl(document.file_path, 60, {
      download: shouldDownload ? fileName : false,
    })

    if (signedUrlError || !data?.signedUrl) {
      return new NextResponse("Could not prepare this document.", { status: 500 })
    }

    return NextResponse.redirect(data.signedUrl, 303)
  } catch (error) {
    console.error("CSR document file access failed", error)
    return new NextResponse("Could not open this document.", { status: 500 })
  }
}
