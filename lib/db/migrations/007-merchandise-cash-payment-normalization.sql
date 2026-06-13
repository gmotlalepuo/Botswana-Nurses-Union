update public.merchandise_orders
set
  payment_option = 'cash',
  payment_status = 'paid',
  status = 'paid',
  amount_paid = total_amount,
  balance_remaining = 0,
  paid_at = coalesce(paid_at, now()),
  updated_at = now()
where payment_option in ('stripe', 'cash')
  and payment_status <> 'paid';
