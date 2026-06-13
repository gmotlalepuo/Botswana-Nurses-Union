import { NextResponse } from "next/server"
import { requireAdminRequest } from "@/lib/admin-auth"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  try {
    const { response } = await requireAdminRequest(request)

    if (response) {
      return response
    }

    const formData = await request.formData()
    const userId = String(formData.get("userId") ?? "")
    const password = String(formData.get("password") ?? "")

    if (!userId || password.length < 8) {
      return NextResponse.redirect(new URL("/admin/users?error=password-short", request.url), 303)
    }

    const admin = createAdminClient()
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password,
    })

    if (error) {
      return NextResponse.redirect(new URL("/admin/users?error=password-reset-failed", request.url), 303)
    }

    await admin.from("notifications").insert({
      title: "Password reset",
      message: "A user password was reset by an administrator.",
      channel: "in_app",
    })

    return NextResponse.redirect(new URL("/admin/users?success=password-reset", request.url), 303)
  } catch {
    return NextResponse.redirect(new URL("/admin/users?error=not-configured", request.url), 303)
  }
}
