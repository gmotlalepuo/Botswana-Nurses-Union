import { NextResponse } from "next/server"
import { requireAdminRequest } from "@/lib/admin-auth"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  try {
    const { user, response } = await requireAdminRequest(request)

    if (response) {
      return response
    }

    const formData = await request.formData()
    const userId = String(formData.get("userId") ?? "")

    if (!userId) {
      return NextResponse.redirect(new URL("/admin/users?error=missing", request.url), 303)
    }

    if (user?.id === userId) {
      return NextResponse.redirect(new URL("/admin/users?error=self-delete", request.url), 303)
    }

    const admin = createAdminClient()
    const { error } = await admin.auth.admin.deleteUser(userId)

    if (error) {
      return NextResponse.redirect(new URL("/admin/users?error=user-delete", request.url), 303)
    }

    await admin.from("notifications").insert({
      title: "User deleted",
      message: "A user account was deleted by an administrator.",
      channel: "in_app",
    })

    return NextResponse.redirect(new URL("/admin/users?success=user-deleted", request.url), 303)
  } catch {
    return NextResponse.redirect(new URL("/admin/users?error=not-configured", request.url), 303)
  }
}
