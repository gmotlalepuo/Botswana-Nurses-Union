import { createAdminClient } from "@/lib/supabase/admin"
import type { AppNotification } from "@/lib/notification-types"

export type MemberNotification = AppNotification

export async function getMemberNotifications(memberId: string): Promise<MemberNotification[]> {
  if (!memberId) {
    return []
  }

  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from("notifications")
      .select("id, title, message, channel, read_at, archived_at, created_at")
      .eq("member_id", memberId)
      .is("archived_at", null)
      .order("created_at", { ascending: false })
      .limit(10)

    return (data ?? []) as MemberNotification[]
  } catch {
    return []
  }
}
