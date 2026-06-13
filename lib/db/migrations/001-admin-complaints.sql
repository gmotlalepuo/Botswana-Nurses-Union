do $$
begin
  create type bonu_complaint_status as enum ('open', 'in_review', 'resolved', 'closed');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type bonu_complaint_priority as enum ('low', 'medium', 'high', 'urgent');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.members(id) on delete set null,
  submitted_by uuid references auth.users(id) on delete set null,
  assigned_to uuid references auth.users(id) on delete set null,
  subject text not null,
  category text not null default 'General',
  description text not null,
  priority bonu_complaint_priority not null default 'medium',
  status bonu_complaint_status not null default 'open',
  resolution_notes text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.complaints enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'complaints' and policyname = 'Members can read own complaints') then
    create policy "Members can read own complaints"
      on public.complaints for select
      using (member_id in (select id from public.members where user_id = auth.uid()) or public.has_staff_role());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'complaints' and policyname = 'Members can submit own complaints') then
    create policy "Members can submit own complaints"
      on public.complaints for insert
      with check (member_id in (select id from public.members where user_id = auth.uid()) or public.has_staff_role());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'complaints' and policyname = 'Staff can manage complaints') then
    create policy "Staff can manage complaints"
      on public.complaints for all
      using (public.has_staff_role())
      with check (public.has_staff_role());
  end if;
end $$;
