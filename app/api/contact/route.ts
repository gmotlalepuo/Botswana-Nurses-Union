import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const name = String(formData.get("name") ?? "").trim()
    const email = String(formData.get("email") ?? "").trim()
    const phone = String(formData.get("phone") ?? "").trim()
    const subject = String(formData.get("subject") ?? "").trim()
    const message = String(formData.get("message") ?? "").trim()

    if (!name || !email || !subject || !message) {
      return NextResponse.redirect(new URL("/?error=contact-missing#contact", request.url), 303)
    }

    const admin = createAdminClient()
    const description = [`Name: ${name}`, `Email: ${email}`, phone ? `Phone: ${phone}` : "", "", message].filter(Boolean).join("\n")
    const { error } = await admin.from("complaints").insert({
      subject,
      category: "Public enquiry",
      description,
      priority: "medium",
      status: "open",
    })

    if (error) {
      console.error("Public contact enquiry could not be saved", error)
      return NextResponse.redirect(new URL("/?error=contact-failed#contact", request.url), 303)
    }

    return NextResponse.redirect(new URL("/?success=contact-sent#contact", request.url), 303)
  } catch (error) {
    console.error("Public contact route failed", error)
    return NextResponse.redirect(new URL("/?error=contact-failed#contact", request.url), 303)
  }
}
