import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const password = String(formData.get("password") ?? "")

    if (password.length < 8) {
      return NextResponse.redirect(new URL("/auth/update-password?error=password-short", request.url), 303)
    }

    const supabase = await createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      return NextResponse.redirect(new URL("/auth/update-password?error=password-update", request.url), 303)
    }

    return NextResponse.redirect(new URL("/auth/login?success=password-updated", request.url), 303)
  } catch {
    return NextResponse.redirect(new URL("/auth/update-password?error=not-configured", request.url), 303)
  }
}
