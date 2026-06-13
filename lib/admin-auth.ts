import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

type UserRole = "member" | "csr" | "admin" | null

async function getUserRole(userId: string): Promise<UserRole> {
  try {
    const admin = createAdminClient()
    const { data } = await admin.from("user_roles").select("role").eq("user_id", userId).maybeSingle()
    return (data?.role as UserRole) ?? null
  } catch {
    return null
  }
}

export async function requireAdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?error=session")
  }

  const role = await getUserRole(user.id)

  if (role !== "admin") {
    redirect("/back-office?error=admin-required")
  }

  return user
}

export async function requireAdminRequest(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { user: null, response: Response.redirect(new URL("/auth/login?error=session", request.url), 303) }
  }

  const role = await getUserRole(user.id)

  if (role !== "admin") {
    return { user: null, response: Response.redirect(new URL("/back-office?error=admin-required", request.url), 303) }
  }

  return { user, response: null }
}

export async function requireCsrPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?error=session")
  }

  const role = await getUserRole(user.id)

  if (role !== "csr") {
    redirect(role === "admin" ? "/back-office?notice=admin-portal" : "/portal?error=csr-required")
  }

  return user
}

export async function requireStaffRequest(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { user: null, role: null, response: Response.redirect(new URL("/auth/login?error=session", request.url), 303) }
  }

  const role = await getUserRole(user.id)

  if (role !== "admin" && role !== "csr") {
    return { user: null, role: null, response: Response.redirect(new URL("/portal?error=staff-required", request.url), 303) }
  }

  return { user, role, response: null }
}
