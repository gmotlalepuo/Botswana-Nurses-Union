export type AppNotification = {
  id: string
  title: string
  message: string
  channel: string
  read_at: string | null
  archived_at: string | null
  created_at: string
}
