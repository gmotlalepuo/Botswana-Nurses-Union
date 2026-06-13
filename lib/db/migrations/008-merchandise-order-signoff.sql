alter table public.merchandise_orders
  add column if not exists fulfilment_status text not null default 'pending',
  add column if not exists customer_signed_off_at timestamptz;
