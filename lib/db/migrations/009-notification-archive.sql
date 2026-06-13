alter table public.notifications
  add column if not exists archived_at timestamptz;

create index if not exists notifications_member_archived_created_idx
  on public.notifications (member_id, archived_at, created_at desc);
