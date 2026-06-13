import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function requireMemberPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?error=session")
  }

  const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle()

  if (role?.role === "admin") {
    redirect("/back-office?notice=admin-portal")
  }

  if (role?.role === "csr") {
    redirect("/csr?notice=csr-portal")
  }

  return user
}

export async function requireMemberRequest(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { supabase, user: null, response: Response.redirect(new URL("/auth/login?error=session", request.url), 303) }
  }

  const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle()

  if (role?.role === "admin" || role?.role === "csr") {
    return { supabase, user: null, response: Response.redirect(new URL("/portal?error=member-required", request.url), 303) }
  }

  return { supabase, user, response: null }
}
