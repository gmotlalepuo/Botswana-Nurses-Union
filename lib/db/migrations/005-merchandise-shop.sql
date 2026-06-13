create table if not exists public.merchandise_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text not null default 'General',
  price numeric(12, 2) not null,
  stock_count integer not null default 0,
  discount_percent numeric(5, 2) not null default 0,
  colors text[] not null default '{}'::text[],
  image_url text not null,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.merchandise_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  member_id uuid not null references public.members(id) on delete cascade,
  status text not null default 'pending_payment',
  payment_status text not null default 'pending',
  payment_option text not null default 'stripe',
  delivery_method text not null,
  delivery_address text,
  collection_point text,
  subtotal_amount numeric(12, 2) not null,
  total_amount numeric(12, 2) not null,
  amount_paid numeric(12, 2) not null default 0,
  balance_remaining numeric(12, 2) not null default 0,
  monthly_deduction numeric(12, 2),
  fulfilment_status text not null default 'pending',
  customer_signed_off_at timestamptz,
  stripe_session_id text unique,
  paid_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.merchandise_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.merchandise_orders(id) on delete cascade,
  product_id uuid references public.merchandise_products(id) on delete set null,
  product_name text not null,
  color text,
  quantity integer not null,
  unit_amount numeric(12, 2) not null,
  discount_percent numeric(5, 2) not null default 0,
  line_total numeric(12, 2) not null,
  image_url text,
  created_at timestamptz not null default now()
);

alter table public.merchandise_products enable row level security;
alter table public.merchandise_orders enable row level security;
alter table public.merchandise_order_items enable row level security;

create policy "Anyone signed in can read active merchandise products"
  on public.merchandise_products for select
  using (is_active = true and auth.uid() is not null);

create policy "Staff can manage merchandise products"
  on public.merchandise_products for all
  using (public.has_staff_role())
  with check (public.has_staff_role());

create policy "Members can read own merchandise orders"
  on public.merchandise_orders for select
  using (member_id in (select id from public.members where user_id = auth.uid()) or public.has_staff_role());

create policy "Staff can manage merchandise orders"
  on public.merchandise_orders for all
  using (public.has_staff_role())
  with check (public.has_staff_role());

create policy "Members can read own merchandise order items"
  on public.merchandise_order_items for select
  using (
    order_id in (
      select id
      from public.merchandise_orders
      where member_id in (select id from public.members where user_id = auth.uid())
    )
    or public.has_staff_role()
  );

create policy "Staff can manage merchandise order items"
  on public.merchandise_order_items for all
  using (public.has_staff_role())
  with check (public.has_staff_role());

insert into public.merchandise_products (id, name, description, category, price, stock_count, discount_percent, colors, image_url)
values
  ('00000000-0000-4000-8000-000000000101', 'Nursing uniform dress', 'Professional white nursing uniform dress for clinical duty.', 'Uniforms', 420, 45, 10, array['White', 'Navy trim'], 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80'),
  ('00000000-0000-4000-8000-000000000102', 'BONU scrub set', 'Comfortable scrub top and trouser set for daily workwear.', 'Uniforms', 360, 60, 0, array['Teal', 'Navy', 'Grey'], 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=900&q=80'),
  ('00000000-0000-4000-8000-000000000103', 'BONU branded polo', 'Union-branded polo shirt for events, campaigns, and casual wear.', 'Clothing', 180, 80, 15, array['Cyan', 'White', 'Black'], 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80'),
  ('00000000-0000-4000-8000-000000000104', 'BONU tote bag', 'Durable everyday tote bag for documents and essentials.', 'Bags', 120, 35, 0, array['Black', 'Natural', 'Blue'], 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=80'),
  ('00000000-0000-4000-8000-000000000105', 'BONU lanyard', 'Branded lanyard with card holder clip.', 'Accessories', 45, 120, 5, array['Blue', 'White'], 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=900&q=80'),
  ('00000000-0000-4000-8000-000000000106', 'BONU water bottle', 'Reusable branded bottle for shifts, meetings, and travel.', 'Accessories', 95, 50, 0, array['Clear', 'Blue', 'Black'], 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=80')
on conflict do nothing;
