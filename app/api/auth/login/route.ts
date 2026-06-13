import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const email = String(formData.get("email") ?? "")
    const password = String(formData.get("password") ?? "")
    const fallback = new URL("/auth/login?error=invalid", request.url)

    if (!email || !password) {
      return NextResponse.redirect(new URL("/auth/login?error=missing", request.url), 303)
    }

    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.user) {
      return NextResponse.redirect(fallback, 303)
    }

    const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id).maybeSingle()
    const destination = role?.role === "admin" ? "/back-office" : role?.role === "csr" ? "/csr" : "/portal"

    return NextResponse.redirect(new URL(`${destination}?success=login-success`, request.url), 303)
  } catch {
    return NextResponse.redirect(new URL("/auth/login?error=not-configured", request.url), 303)
  }
}
