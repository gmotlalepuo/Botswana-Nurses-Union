create or replace function public.suspend_overdue_memberships()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  suspended_count integer := 0;
  botswana_today date := (now() at time zone 'Africa/Gaborone')::date;
  current_month date := date_trunc('month', botswana_today)::date;
  required_month date := date_trunc('month', botswana_today - interval '1 month')::date;
begin
  if extract(day from botswana_today) < 6 then
    return 0;
  end if;

  update public.members member
  set status = 'suspended',
      updated_at = now()
  where member.status = 'active'
    and member.created_at < current_month
    and coalesce(member.monthly_salary, 0) > 0
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
