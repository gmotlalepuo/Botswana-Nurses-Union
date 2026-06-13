do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'members'
      and policyname = 'Members can create own profile'
  ) then
    create policy "Members can create own profile"
      on public.members for insert
      with check (auth.uid() = user_id);
  end if;
end $$;
