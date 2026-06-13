create table if not exists public.case_pulses (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.service_applications(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  author_user_id uuid references auth.users(id) on delete set null,
  author_role text not null default 'member',
  comment text,
  file_path text,
  created_at timestamptz not null default now()
);

alter table public.case_pulses enable row level security;

create policy "Members can read own case pulses"
  on public.case_pulses for select
  using (member_id in (select id from public.members where user_id = auth.uid()) or public.has_staff_role());

create policy "Members can add own case pulses"
  on public.case_pulses for insert
  with check (member_id in (select id from public.members where user_id = auth.uid()) or public.has_staff_role());

create policy "Staff can manage case pulses"
  on public.case_pulses for all
  using (public.has_staff_role())
  with check (public.has_staff_role());
