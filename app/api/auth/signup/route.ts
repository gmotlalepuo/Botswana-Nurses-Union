import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const email = String(formData.get("email") ?? "")
    const password = String(formData.get("password") ?? "")
    const fullName = String(formData.get("fullName") ?? "")
    const mobileNumber = String(formData.get("mobileNumber") ?? "")
    const nationalId = String(formData.get("nationalId") ?? "")
    const employer = String(formData.get("employer") ?? "")
    const employeeNumber = String(formData.get("employeeNumber") ?? "")

    if (!email || !password || !fullName || !mobileNumber) {
      return NextResponse.redirect(new URL("/auth/signup?error=missing", request.url), 303)
    }

    const supabase = await createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: "member",
        },
      },
    })

    if (error || !data.user) {
      return NextResponse.redirect(new URL("/auth/signup?error=account", request.url), 303)
    }

    const admin = createAdminClient()
    const { error: roleError } = await admin.from("user_roles").upsert({
      user_id: data.user.id,
      role: "member",
    })
    const { error: memberError } = await admin.from("members").insert({
      user_id: data.user.id,
      full_name: fullName,
      national_id: nationalId || null,
      employer: employer || null,
      employee_number: employeeNumber || null,
      mobile_number: mobileNumber,
      email,
      status: "pending",
    })

    if (roleError || memberError) {
      return NextResponse.redirect(new URL("/auth/signup?error=profile", request.url), 303)
    }

    return NextResponse.redirect(new URL("/portal?success=registration-submitted", request.url), 303)
  } catch {
    return NextResponse.redirect(new URL("/auth/signup?error=not-configured", request.url), 303)
  }
}
