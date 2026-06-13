import { createAdminClient } from "@/lib/supabase/admin"
import type { AppNotification } from "@/lib/notification-types"

export type AdminNotification = AppNotification

export async function getAdminNotifications(): Promise<AdminNotification[]> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from("notifications")
      .select("id, title, message, channel, read_at, archived_at, created_at")
      .is("archived_at", null)
      .order("created_at", { ascending: false })
      .limit(10)

    return (data ?? []) as AdminNotification[]
  } catch {
    return []
  }
}
