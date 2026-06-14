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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const password = "12345678"

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const people = [
  ["Kgomotso Molefe", "Female"], ["Thabo Kgosi", "Male"], ["Boitumelo Sechele", "Female"],
  ["Kagiso Modise", "Male"], ["Lorato Motsamai", "Female"], ["Tshepo Gaseitsiwe", "Male"],
  ["Masego Baebele", "Female"], ["Olebile Moagi", "Male"], ["Lesego Mokgosi", "Female"],
  ["Tumisang Kgosidintsi", "Male"], ["Neo Kealotswe", "Female"], ["Phenyo Sebego", "Male"],
  ["Onalenna Mosweu", "Female"], ["Mpho Mooketsi", "Male"], ["Naledi Rantao", "Female"],
  ["Tebogo Kebadire", "Male"], ["Refilwe Mmereki", "Female"], ["Keabetswe Monare", "Male"],
  ["Gorata Motshegwa", "Female"], ["Katlego Kelebeng", "Male"], ["Amantle Setlhare", "Female"],
  ["Tumelo Gabaitse", "Male"], ["Bontle Mokgethi", "Female"], ["Obakeng Motshabi", "Male"],
  ["Dineo Kgosietsile", "Female"], ["Karabo Moeng", "Male"], ["Galaletsang Dube", "Female"],
  ["Thatayaone Moremi", "Male"], ["Kefilwe Mmolawa", "Female"], ["Oratile Radipitse", "Male"],
]

const locations = [
  ["Gaborone", "South East District", "Gaborone City Council", "Princess Marina Hospital"],
  ["Francistown", "North East District", "Francistown City Council", "Nyangabgwe Referral Hospital"],
  ["Lobatse", "South East District", "Lobatse Town Council", "Athlone Hospital"],
  ["Selebi Phikwe", "Central District", "Selebi Phikwe Town Council", "Selebi Phikwe Government Hospital"],
  ["Jwaneng", "Southern District", "Jwaneng Town Council", "Jwaneng Mine Hospital"],
  ["Sowa Town", "Central District", "SOWA Town Council", "Sowa Clinic"],
  ["Bobonong", "Central District", "Bobirwa District Council", "Bobonong Primary Hospital"],
  ["Letlhakane", "Central District", "Boteti District Council", "Letlhakane Primary Hospital"],
  ["Charles Hill", "Ghanzi District", "Charleshill District Council", "Charles Hill Primary Hospital"],
  ["Kasane", "Chobe District", "Chobe District Council", "Kasane Primary Hospital"],
  ["Ghanzi", "Ghanzi District", "Ghanzi District Council", "Ghanzi Primary Hospital"],
  ["Goodhope", "Southern District", "Goodhope District Council", "Goodhope Primary Hospital"],
  ["Hukuntsi", "Kgalagadi District", "Hukuntsi District Council", "Hukuntsi Primary Hospital"],
  ["Kanye", "Southern District", "Kanye District Council", "Kanye Seventh Day Adventist Hospital"],
  ["Mochudi", "Kgatleng District", "Kgatleng District Council", "Deborah Retief Memorial Hospital"],
  ["Molepolole", "Kweneng District", "Kweneng District Council", "Scottish Livingstone Hospital"],
  ["Letlhakeng", "Kweneng District", "Letlhakeng District Council", "Letlhakeng Primary Hospital"],
  ["Mabutsane", "Southern District", "Mabutsane District Council", "Mabutsane Primary Hospital"],
  ["Mahalapye", "Central District", "Mahalapye District Council", "Mahalapye District Hospital"],
  ["Mogoditshane", "Kweneng District", "Mogoditshane-Thamaga District Council", "Mogoditshane Clinic"],
  ["Moshupa", "Southern District", "Moshupa District Council", "Moshupa Primary Hospital"],
  ["Masunga", "North East District", "North East District Council", "Masunga Primary Hospital"],
  ["Maun", "North West District", "North West District Council", "Letsholathebe II Memorial Hospital"],
  ["Gumare", "North West District", "Okavango District Council", "Gumare Primary Hospital"],
  ["Palapye", "Central District", "Palapye District Council", "Palapye Primary Hospital"],
  ["Ramotswa", "South East District", "Ramotswa District Council", "Bamalete Lutheran Hospital"],
  ["Serowe", "Central District", "Serowe District Council", "Sekgoma Memorial Hospital"],
  ["Tlokweng", "South East District", "Tlokweng District Council", "Tlokweng Clinic"],
  ["Tonota", "Central District", "Tonota District Council", "Tonota Clinic"],
  ["Tsabong", "Kgalagadi District", "Tsabong District Council", "Tsabong Primary Hospital"],
]

async function listUsersByEmail() {
  const users = new Map()
  let page = 1

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 })
    if (error) throw error
    for (const user of data.users) {
      if (user.email) users.set(user.email.toLowerCase(), user)
    }
    if (data.users.length < 100) return users
    page += 1
  }
}

function memberPayload(index, userId, locationColumn) {
  const [fullName, gender] = people[index]
  const [town, district, council, workStation] = locations[index]
  const number = String(index + 1).padStart(2, "0")
  const year = 1978 + (index % 20)
  const month = String((index % 12) + 1).padStart(2, "0")
  const day = String((index % 27) + 1).padStart(2, "0")
  const email = `member${number}@bonu-demo.co.bw`

  const payload = {
    user_id: userId,
    membership_number: `BONU-2026-${String(index + 1).padStart(4, "0")}`,
    full_name: fullName,
    national_id: `${year % 100}${month}${day}${String(100 + index)}`,
    date_of_birth: `${year}-${month}-${day}`,
    gender,
    marital_status: index % 3 === 0 ? "Married" : "Single",
    occupation: index % 4 === 0 ? "Midwife" : index % 4 === 1 ? "Registered Nurse" : index % 4 === 2 ? "Enrolled Nurse" : "Community Health Nurse",
    employer: index % 5 === 0 ? "Ministry of Health" : workStation,
    employee_number: `BW-NUR-${String(4100 + index)}`,
    mobile_number: `+267 7${String(1000000 + index * 137).slice(-7)}`,
    alternative_contact_number: `+267 7${String(2000000 + index * 149).slice(-7)}`,
    email,
    physical_address: `Plot ${120 + index * 17}, ${town}, Botswana`,
    postal_address: `P.O. Box ${300 + index}, ${town}, Botswana`,
    district,
    work_station: workStation,
    department: index % 3 === 0 ? "Maternity Ward" : index % 3 === 1 ? "Outpatient Department" : "Primary Health Care",
    employment_date: `${2010 + (index % 13)}-${month}-01`,
    monthly_salary: 8200 + index * 275,
    status: "pending",
    updated_at: new Date().toISOString(),
  }

  payload[locationColumn] = council
  return payload
}

async function seedMembers() {
  const { error: councilProbeError } = await supabase.from("members").select("council").limit(1)
  const locationColumn = councilProbeError ? "region" : "council"

  if (locationColumn === "region") {
    console.warn("Council migration is not applied yet; seeding council values into the legacy region column.")
  }

  const existingUsers = await listUsersByEmail()
  let created = 0
  let updated = 0

  for (let index = 0; index < people.length; index += 1) {
    const number = String(index + 1).padStart(2, "0")
    const email = `member${number}@bonu-demo.co.bw`
    const [fullName] = people[index]
    let user = existingUsers.get(email)

    if (!user) {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, role: "member" },
      })
      if (error) throw error
      user = data.user
      created += 1
    } else {
      const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
        password,
        email_confirm: true,
        user_metadata: { ...(user.user_metadata || {}), full_name: fullName, role: "member" },
      })
      if (error) throw error
      user = data.user
      updated += 1
    }

    const { error: roleError } = await supabase
      .from("user_roles")
      .upsert({ user_id: user.id, role: "member" }, { onConflict: "user_id" })
    if (roleError) throw roleError

    const payload = memberPayload(index, user.id, locationColumn)
    const { data: existingMember, error: lookupError } = await supabase
      .from("members")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()
    if (lookupError) throw lookupError

    const result = existingMember
      ? await supabase.from("members").update(payload).eq("id", existingMember.id)
      : await supabase.from("members").insert(payload)
    if (result.error) throw result.error

    console.log(`[${number}/30] ${fullName} <${email}>`)
  }

  console.log("")
  console.log(`Seed complete: ${created} created, ${updated} updated.`)
  console.log("Emails: member01@bonu-demo.co.bw through member30@bonu-demo.co.bw")
  console.log(`Password for all seeded members: ${password}`)
}

seedMembers().catch((error) => {
  console.error("Failed to seed member users:")
  console.error(error.message || error)
  process.exit(1)
})
