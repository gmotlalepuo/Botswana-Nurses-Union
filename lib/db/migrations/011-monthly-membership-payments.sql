alter table public.payment_transactions
  add column if not exists payment_kind text,
  add column if not exists payment_month date,
  add column if not exists payment_source text,
  add column if not exists expected_amount numeric(12, 2),
  add column if not exists import_batch_id uuid;

create unique index if not exists payment_transactions_membership_month_unique
  on public.payment_transactions (member_id, payment_month)
  where payment_kind = 'membership_monthly';

update public.members member
set status = 'pending',
    updated_at = now()
where member.status = 'active'
  and not exists (
    select 1
    from public.payment_transactions payment
    where payment.member_id = member.id
      and payment.payment_kind = 'membership_monthly'
      and payment.status = 'paid'
  );

create table if not exists public.payment_import_batches (
  id uuid primary key default gen_random_uuid(),
  uploaded_by uuid references auth.users(id) on delete set null,
  file_name text not null,
  payment_month date,
  total_rows integer not null default 0,
  paid_rows integer not null default 0,
  unmatched_rows integer not null default 0,
  duplicate_rows integer not null default 0,
  invalid_rows integer not null default 0,
  warning_rows integer not null default 0,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.payment_import_batches enable row level security;

drop policy if exists "Staff can manage payment imports" on public.payment_import_batches;
create policy "Staff can manage payment imports"
  on public.payment_import_batches for all
  using (public.has_staff_role())
  with check (public.has_staff_role());

create or replace function public.suspend_overdue_memberships()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  suspended_count integer := 0;
  botswana_today date := (now() at time zone 'Africa/Gaborone')::date;
  required_month date := date_trunc('month', botswana_today - interval '1 month')::date;
begin
  if extract(day from botswana_today) < 6 then
    return 0;
  end if;

  update public.members member
  set status = 'suspended',
      updated_at = now()
  where member.status = 'active'
    and exists (
      select 1
      from public.service_applications application
      where application.member_id = member.id
        and application.status in ('approved', 'fulfilled')
        and coalesce(application.monthly_deduction, 0) > 0
    )
    and not exists (
      select 1
      from public.payment_transactions payment
      where payment.member_id = member.id
        and payment.payment_kind = 'membership_monthly'
        and payment.payment_month = required_month
        and payment.status = 'paid'
    );

  get diagnostics suspended_count = row_count;
  return suspended_count;
end;
$$;

do $$
begin
  begin
    create extension if not exists pg_cron;
  exception
    when insufficient_privilege then
      raise notice 'pg_cron could not be enabled automatically. Enable it in Supabase Extensions.';
  end;

  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid)
    from cron.job
    where jobname = 'bonu-suspend-overdue-memberships';

    perform cron.schedule(
      'bonu-suspend-overdue-memberships',
      '15 22 * * *',
      'select public.suspend_overdue_memberships();'
    );
  end if;
end $$;
