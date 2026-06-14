const fs = require("node:fs")
const path = require("node:path")
const { createClient } = require("@supabase/supabase-js")

const envPath = path.join(process.cwd(), ".env.local")
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue
    const [key, ...parts] = trimmed.split("=")
    process.env[key] = process.env[key] || parts.join("=").replace(/^["']|["']$/g, "")
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

const emails = [2, 3, 4, 5].map((number) => `member${String(number).padStart(2, "0")}@bonu-demo.co.bw`)
const services = [
  { type: "funeral_insurance", deduction: 125, details: { coverLevel: "Enhanced" } },
  { type: "legal_aid", deduction: 100, details: { legalAidPlan: "Standard" } },
  { type: "loan_assistance", deduction: 850, requested: 30000, term: 36, details: { loanType: "Personal loan", preferredBank: "Bank Gaborone" } },
  { type: "micro_loan", deduction: 1100, requested: 12000, term: 12, details: { loanPurpose: "Household and school expenses" } },
  { type: "electronic_contract", deduction: 300, requested: 6500, term: 24, details: { product: "Mobile phone", brandModel: "Samsung Galaxy A55 5G" } },
]

async function seed() {
  const { error: councilProbeError } = await supabase.from("members").select("council").limit(1)
  const locationColumn = councilProbeError ? "region" : "council"
  const { data: members, error } = await supabase.from("members").select("id, email, full_name").in("email", emails)
  if (error) throw error
  if ((members ?? []).length !== emails.length) throw new Error(`Expected ${emails.length} members but found ${(members ?? []).length}.`)

  for (const member of members) {
    const { error: memberError } = await supabase
      .from("members")
      .update({ [locationColumn]: "Gaborone City Council", district: "South East District", status: "pending", updated_at: new Date().toISOString() })
      .eq("id", member.id)
    if (memberError) throw memberError

    const { data: existing, error: lookupError } = await supabase
      .from("service_applications")
      .select("id")
      .eq("member_id", member.id)
      .contains("details", { testSeed: "bulk-payment-demo-v1" })
    if (lookupError) throw lookupError
    if (existing.length > 0) {
      const { error: deleteError } = await supabase.from("service_applications").delete().in("id", existing.map((item) => item.id))
      if (deleteError) throw deleteError
    }

    const memberNumber = Number(member.email.match(/member(\d+)/)?.[1] ?? 0)
    const selected = [0, 1, 2].map((offset) => services[(memberNumber + offset) % services.length])
    const { error: applicationError } = await supabase.from("service_applications").insert(
      selected.map((service) => ({
        member_id: member.id,
        application_type: service.type,
        status: "approved",
        requested_amount: service.requested ?? null,
        monthly_deduction: service.deduction,
        term_months: service.term ?? null,
        details: { ...service.details, testSeed: "bulk-payment-demo-v1" },
        decided_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })),
    )
    if (applicationError) throw applicationError

    console.log(`${member.email}: ${selected.map((item) => `${item.type} (P${item.deduction})`).join(", ")}`)
  }

  const { data: verification, error: verificationError } = await supabase
    .from("members")
    .select(`email, status, ${locationColumn}, service_applications(id, monthly_deduction, details)`)
    .in("email", emails)
    .order("email")
  if (verificationError) throw verificationError

  console.log("")
  for (const member of verification) {
    const testApplications = (member.service_applications ?? []).filter((application) => application.details?.testSeed === "bulk-payment-demo-v1")
    const total = testApplications.reduce((sum, application) => sum + Number(application.monthly_deduction ?? 0), 0)
    console.log(`${member.email}: status=${member.status}, council=${member[locationColumn]}, applications=${testApplications.length}, total=P${total.toFixed(2)}`)
  }
}

seed().catch((error) => {
  console.error("Failed to seed bulk payment test data:")
  console.error(error.message || error)
  process.exit(1)
})
