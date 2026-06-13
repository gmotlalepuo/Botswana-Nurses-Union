alter table public.merchandise_orders
  add column if not exists payment_option text not null default 'stripe',
  add column if not exists amount_paid numeric(12, 2) not null default 0,
  add column if not exists balance_remaining numeric(12, 2) not null default 0,
  add column if not exists monthly_deduction numeric(12, 2);

update public.merchandise_orders
set balance_remaining = greatest(total_amount - amount_paid, 0)
where balance_remaining = 0 and payment_status <> 'paid';
