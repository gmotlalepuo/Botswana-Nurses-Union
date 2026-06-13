import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

const staffRoles = new Set(["admin", "csr"])

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new NextResponse("Please sign in to view this file.", { status: 401 })
    }

    const url = new URL(request.url)
    const pulseId = url.searchParams.get("pulseId") ?? ""
    const shouldDownload = url.searchParams.get("download") === "1"

    if (!pulseId) {
      return new NextResponse("Missing pulse file.", { status: 400 })
    }

    const admin = createAdminClient()
    const { data: role } = await admin.from("user_roles").select("role").eq("user_id", user.id).maybeSingle()
    const userRole = String(role?.role ?? "member")
    const { data: pulse, error: pulseError } = await admin
      .from("case_pulses")
      .select("id, file_path, members(user_id)")
      .eq("id", pulseId)
      .maybeSingle()

    if (pulseError || !pulse?.file_path) {
      return new NextResponse("File not found.", { status: 404 })
    }

    const memberRecord = Array.isArray(pulse.members) ? pulse.members[0] : pulse.members
    const ownsCase = memberRecord?.user_id === user.id

    if (!staffRoles.has(userRole) && !ownsCase) {
      return new NextResponse("You do not have access to this file.", { status: 403 })
    }

    const bucket = process.env.SUPABASE_MEMBER_DOCUMENTS_BUCKET || "member-documents"
    const fileName = pulse.file_path.split("/").pop() || "case-pulse-attachment"
    const { data, error } = await admin.storage.from(bucket).createSignedUrl(pulse.file_path, 60, {
      download: shouldDownload ? fileName : false,
    })

    if (error || !data?.signedUrl) {
      return new NextResponse("Could not prepare this file.", { status: 500 })
    }

    return NextResponse.redirect(data.signedUrl, 303)
  } catch (error) {
    console.error("Case pulse file access failed", error)
    return new NextResponse("Could not open this file.", { status: 500 })
  }
}
