import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const email = String(formData.get("email") ?? "")

    if (!email) {
      return NextResponse.redirect(new URL("/auth/forgot?error=missing", request.url), 303)
    }

    const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const supabase = await createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/auth/update-password`,
    })

    if (error) {
      return NextResponse.redirect(new URL("/auth/forgot?error=forgot-failed", request.url), 303)
    }

    return NextResponse.redirect(new URL("/auth/login?success=reset-email-sent", request.url), 303)
  } catch {
    return NextResponse.redirect(new URL("/auth/forgot?error=not-configured", request.url), 303)
  }
}
