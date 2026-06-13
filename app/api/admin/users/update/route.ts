import { NextResponse } from "next/server"
import { requireAdminRequest } from "@/lib/admin-auth"
import { createAdminClient } from "@/lib/supabase/admin"

const userRoles = new Set(["admin", "csr", "member"])

export async function POST(request: Request) {
  try {
    const { response } = await requireAdminRequest(request)

    if (response) {
      return response
    }

    const formData = await request.formData()
    const userId = String(formData.get("userId") ?? "")
    const fullName = String(formData.get("fullName") ?? "")
    const email = String(formData.get("email") ?? "")
    const role = String(formData.get("role") ?? "")

    if (!userId || !fullName || !email || !userRoles.has(role)) {
      return NextResponse.redirect(new URL("/admin/users?error=missing", request.url), 303)
    }

    const admin = createAdminClient()
    const { error: authError } = await admin.auth.admin.updateUserById(userId, {
      email,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role,
      },
    })

    if (authError) {
      return NextResponse.redirect(new URL("/admin/users?error=user-update", request.url), 303)
    }

    const { error: roleError } = await admin.from("user_roles").upsert(
      {
        user_id: userId,
        role,
      },
      { onConflict: "user_id" },
    )

    if (roleError) {
      return NextResponse.redirect(new URL("/admin/users?error=user-update", request.url), 303)
    }

    await admin.from("notifications").insert({
      title: "User updated",
      message: `${fullName} was updated as ${role}.`,
      channel: "in_app",
    })

    return NextResponse.redirect(new URL("/admin/users?success=user-updated", request.url), 303)
  } catch {
    return NextResponse.redirect(new URL("/admin/users?error=not-configured", request.url), 303)
  }
}
