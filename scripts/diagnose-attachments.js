const fs = require("node:fs")
const path = require("node:path")
const { createClient } = require("@supabase/supabase-js")

const envPath = path.join(process.cwd(), ".env.local")

if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue
    const [key, ...valueParts] = trimmed.split("=")
    process.env[key] = process.env[key] || valueParts.join("=").replace(/^["']|["']$/g, "")
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const bucket = process.env.SUPABASE_MEMBER_DOCUMENTS_BUCKET || "member-documents"

if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.")
  process.exit(1)
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function main() {
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
  if (bucketsError) throw bucketsError

  console.log("Storage bucket configured:", bucket)
  console.log("Bucket exists:", buckets.some((entry) => entry.name === bucket))

  const { count: memberCount, error: memberError } = await supabase
    .from("members")
    .select("*", { count: "exact", head: true })
  if (memberError) throw memberError
  console.log("Members table reachable:", memberCount !== null)
  console.log("Members count:", memberCount ?? 0)

  const { count: documentCount, error: documentError } = await supabase
    .from("member_documents")
    .select("*", { count: "exact", head: true })
  if (documentError) throw documentError
  console.log("member_documents table reachable:", documentCount !== null)
  console.log("member_documents count:", documentCount ?? 0)

  const { data: recentDocuments, error: recentError } = await supabase
    .from("member_documents")
    .select("id, member_id, document_type, file_path, created_at")
    .order("created_at", { ascending: false })
    .limit(10)
  if (recentError) throw recentError
  console.log("Recent document rows:")
  for (const document of recentDocuments ?? []) {
    console.log(`- ${document.document_type} | member_id=${document.member_id} | file_path=${document.file_path}`)
  }

  const { data: members, error: membersError } = await supabase
    .from("members")
    .select("id, user_id, full_name, email")
    .order("created_at", { ascending: false })
    .limit(10)
  if (membersError) throw membersError
  console.log("Recent member rows:")
  for (const member of members ?? []) {
    console.log(`- ${member.full_name} | member_id=${member.id} | user_id=${member.user_id} | email=${member.email}`)
  }
}

main().catch((error) => {
  console.error("Attachment diagnostics failed:")
  console.error(error.message || error)
  process.exit(1)
})
