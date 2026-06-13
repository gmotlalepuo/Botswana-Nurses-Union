const fs = require("node:fs")
const path = require("node:path")
const { createClient } = require("@supabase/supabase-js")

const envPath = path.join(process.cwd(), ".env.local")

if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue
    }

    const [key, ...valueParts] = trimmed.split("=")
    const value = valueParts.join("=").replace(/^["']|["']$/g, "")
    process.env[key] = process.env[key] || value
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const adminEmail = process.env.SEED_ADMIN_EMAIL
const adminPassword = process.env.SEED_ADMIN_PASSWORD
const adminName = process.env.SEED_ADMIN_NAME || "BONU Administrator"

if (!supabaseUrl || !serviceRoleKey || !adminEmail || !adminPassword) {
  console.error("Missing Supabase or SEED_ADMIN credentials in .env.local")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function findUserByEmail(email) {
  let page = 1
  const perPage = 100

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error) {
      throw error
    }

    const user = data.users.find((entry) => entry.email?.toLowerCase() === email.toLowerCase())
    if (user) {
      return user
    }

    if (data.users.length < perPage) {
      return null
    }

    page += 1
  }
}

async function seedAdmin() {
  let user = await findUserByEmail(adminEmail)

  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: adminName,
        role: "admin",
      },
    })

    if (error) {
      throw error
    }

    user = data.user
  } else {
    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        ...(user.user_metadata || {}),
        full_name: user.user_metadata?.full_name || adminName,
        role: "admin",
      },
    })

    if (error) {
      throw error
    }
  }

  const { error: roleError } = await supabase.from("user_roles").upsert(
    {
      user_id: user.id,
      role: "admin",
    },
    { onConflict: "user_id" },
  )

  if (roleError) {
    throw roleError
  }

  console.log("")
  console.log("Admin user is ready.")
  console.log("====================")
  console.log(`Email:    ${adminEmail}`)
  console.log(`Password: ${adminPassword}`)
  console.log("Role:     admin")
  console.log("")
  console.log("Login at http://localhost:3000/auth/login")
  console.log("Change this password after your first successful login.")
}

seedAdmin().catch((error) => {
  console.error("Failed to seed admin user:")
  console.error(error.message || error)
  process.exit(1)
})
