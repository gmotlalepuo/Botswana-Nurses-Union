import { createAdminClient } from "@/lib/supabase/admin"

export type ComplaintRow = {
  id: string
  subject: string
  category: string
  description: string
  priority: string
  status: string
  resolution_notes: string | null
  created_at: string
  updated_at: string
  members?: { full_name: string | null; email: string | null } | null
}

export async function getAdminComplaints(): Promise<ComplaintRow[]> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from("complaints")
      .select("id, subject, category, description, priority, status, resolution_notes, created_at, updated_at, members(full_name, email)")
      .order("created_at", { ascending: false })
      .limit(1000)

    return ((data ?? []) as unknown[]).map((row) => {
      const record = row as ComplaintRow & { members?: ComplaintRow["members"] | ComplaintRow["members"][] }

      return {
        ...record,
        members: Array.isArray(record.members) ? (record.members[0] ?? null) : (record.members ?? null),
      }
    })
  } catch {
    return []
  }
}
