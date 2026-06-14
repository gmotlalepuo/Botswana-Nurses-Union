const fs = require("node:fs")
const path = require("node:path")
const { createClient } = require("@supabase/supabase-js")
const Stripe = require("stripe")

const envPath = path.join(process.cwd(), ".env.local")
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue
    const [key, ...parts] = trimmed.split("=")
    process.env[key] = process.env[key] || parts.join("=").replace(/^["']|["']$/g, "")
  }
}

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

async function diagnose() {
  const checks = {}

  const { error: ledgerError } = await admin
    .from("payment_transactions")
    .select("payment_kind, payment_month, payment_source, expected_amount, import_batch_id")
    .limit(1)
  checks.migration011 = ledgerError ? `MISSING: ${ledgerError.message}` : "OK"

  const { error: batchError } = await admin.from("payment_import_batches").select("id").limit(1)
  checks.importTable = batchError ? `MISSING: ${batchError.message}` : "OK"

  const { data: applications, error: applicationError } = await admin
    .from("service_applications")
    .select("id, member_id, application_type, status, monthly_deduction, members(full_name, email, status)")
    .in("status", ["approved", "fulfilled"])
    .gt("monthly_deduction", 0)
    .limit(10)
  checks.approvedApplications = applicationError
    ? `ERROR: ${applicationError.message}`
    : `${applications.length} found in first 10 results`

  checks.stripeKey = process.env.STRIPE_SECRET_KEY ? "Configured" : "Missing (demo mode)"
  if (process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
      await stripe.balance.retrieve()
      checks.stripeConnection = "OK"
    } catch (error) {
      checks.stripeConnection = `ERROR: ${error.message}`
    }
  }

  console.log(JSON.stringify({ checks, applications }, null, 2))
}

diagnose().catch((error) => {
  console.error(error)
  process.exit(1)
})
