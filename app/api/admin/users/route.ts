import { NextResponse } from "next/server"
import { requireAdminRequest } from "@/lib/admin-auth"
import { createAdminClient } from "@/lib/supabase/admin"

const staffRoles = new Set(["admin", "csr"])

export async function POST(request: Request) {
  try {
    const { response } = await requireAdminRequest(request)

    if (response) {
      return response
    }

    const formData = await request.formData()
    const email = String(formData.get("email") ?? "")
    const password = String(formData.get("password") ?? "")
    const fullName = String(formData.get("fullName") ?? "")
    const role = String(formData.get("role") ?? "csr")

    if (!email || !password || !fullName || !staffRoles.has(role)) {
      return NextResponse.redirect(new URL("/admin/users?error=missing", request.url), 303)
    }

    const admin = createAdminClient()
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role,
      },
    })

    if (error || !data.user) {
      return NextResponse.redirect(new URL("/admin/users?error=create", request.url), 303)
    }

    const { error: roleError } = await admin.from("user_roles").upsert({
      user_id: data.user.id,
      role,
    })

    if (roleError) {
      return NextResponse.redirect(new URL("/admin/users?error=create", request.url), 303)
    }

    await admin.from("notifications").insert({
      title: "Staff user created",
      message: `${fullName} was created as ${role}.`,
      channel: "in_app",
    })

    return NextResponse.redirect(new URL("/admin/users?success=user-created", request.url), 303)
  } catch {
    return NextResponse.redirect(new URL("/admin/users?error=not-configured", request.url), 303)
  }
}
