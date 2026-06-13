import { NextResponse } from "next/server"
import { requireStaffRequest } from "@/lib/admin-auth"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  const wantsJson = request.headers.get("accept")?.includes("application/json") ?? false

  try {
    const { response } = await requireStaffRequest(request)

    if (response) {
      return wantsJson ? NextResponse.json({ ok: false }, { status: 401 }) : response
    }

    const formData = await request.formData()
    const notificationId = String(formData.get("notificationId") ?? "")
    const action = String(formData.get("action") ?? "read")

    if (action === "archive" && !notificationId) {
      return wantsJson ? NextResponse.json({ ok: false, error: "missing" }, { status: 400 }) : NextResponse.redirect(new URL("/back-office?error=missing", request.url), 303)
    }

    const admin = createAdminClient()
    let query =
      action === "archive"
        ? admin.from("notifications").update({ archived_at: new Date().toISOString(), read_at: new Date().toISOString() }).is("archived_at", null)
        : admin.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null).is("archived_at", null)

    if (notificationId) {
      query = query.eq("id", notificationId)
    }

    const { error } = await query

    if (error) {
      return wantsJson ? NextResponse.json({ ok: false, error: "notification-read-failed" }, { status: 500 }) : NextResponse.redirect(new URL("/back-office?error=notification-read-failed", request.url), 303)
    }

    if (wantsJson) {
      return NextResponse.json({ ok: true })
    }

    return NextResponse.redirect(new URL("/back-office?success=notification-read", request.url), 303)
  } catch {
    if (wantsJson) {
      return NextResponse.json({ ok: false, error: "not-configured" }, { status: 500 })
    }

    return NextResponse.redirect(new URL("/back-office?error=not-configured", request.url), 303)
  }
}
