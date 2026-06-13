create table if not exists public.case_pulse_likes (
  pulse_id uuid not null references public.case_pulses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (pulse_id, user_id)
);

alter table public.case_pulse_likes enable row level security;

create policy "Case pulse participants can read likes"
  on public.case_pulse_likes for select
  using (
    pulse_id in (
      select id
      from public.case_pulses
      where member_id in (select id from public.members where user_id = auth.uid())
    )
    or public.has_staff_role()
  );

create policy "Case pulse participants can add likes"
  on public.case_pulse_likes for insert
  with check (
    user_id = auth.uid()
    and (
      pulse_id in (
        select id
        from public.case_pulses
        where member_id in (select id from public.members where user_id = auth.uid())
      )
      or public.has_staff_role()
    )
  );

create policy "Case pulse participants can remove own likes"
  on public.case_pulse_likes for delete
  using (user_id = auth.uid() or public.has_staff_role());
