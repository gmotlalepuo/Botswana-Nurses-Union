import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

const staffRoles = new Set(["admin", "csr"])

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL("/auth/login?error=session", request.url), 303)
    }

    const formData = await request.formData()
    const pulseId = String(formData.get("pulseId") ?? "")
    const redirectTo = String(formData.get("redirectTo") ?? "/portal")

    if (!pulseId) {
      return NextResponse.redirect(new URL(`${redirectTo}?error=missing`, request.url), 303)
    }

    const admin = createAdminClient()
    const { data: role } = await admin.from("user_roles").select("role").eq("user_id", user.id).maybeSingle()
    const userRole = String(role?.role ?? "member")
    const { data: pulse, error: pulseError } = await admin
      .from("case_pulses")
      .select("id, member_id, members(user_id)")
      .eq("id", pulseId)
      .maybeSingle()

    if (pulseError || !pulse) {
      return NextResponse.redirect(new URL(`${redirectTo}?error=missing`, request.url), 303)
    }

    const memberRecord = Array.isArray(pulse.members) ? pulse.members[0] : pulse.members
    const ownsCase = memberRecord?.user_id === user.id

    if (!staffRoles.has(userRole) && !ownsCase) {
      return NextResponse.redirect(new URL(`${redirectTo}?error=member-required`, request.url), 303)
    }

    const { data: existing } = await admin
      .from("case_pulse_likes")
      .select("pulse_id")
      .eq("pulse_id", pulseId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (existing) {
      await admin.from("case_pulse_likes").delete().eq("pulse_id", pulseId).eq("user_id", user.id)
      return NextResponse.redirect(new URL(`${redirectTo}?success=pulse-unliked`, request.url), 303)
    }

    const { error } = await admin.from("case_pulse_likes").insert({
      pulse_id: pulseId,
      user_id: user.id,
    })

    if (error) {
      console.error("Case pulse like failed", error)
      return NextResponse.redirect(new URL(`${redirectTo}?error=application-submit`, request.url), 303)
    }

    return NextResponse.redirect(new URL(`${redirectTo}?success=pulse-liked`, request.url), 303)
  } catch (error) {
    console.error("Case pulse like submit failed", error)
    return NextResponse.redirect(new URL("/portal?error=not-configured", request.url), 303)
  }
}
