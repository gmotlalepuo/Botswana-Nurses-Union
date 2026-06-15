create extension if not exists "pgcrypto";

create type bonu_member_status as enum ('pending', 'active', 'suspended', 'cancelled');
create type bonu_user_role as enum ('member', 'csr', 'admin');
create type bonu_application_type as enum (
  'membership',
  'funeral_insurance',
  'legal_aid',
  'loan_assistance',
  'micro_loan',
  'merchandise',
  'electronic_contract',
  'bundle'
);
create type bonu_application_status as enum ('submitted', 'in_review', 'more_info_required', 'approved', 'rejected', 'fulfilled');
create type bonu_payment_status as enum ('pending', 'paid', 'failed', 'refunded', 'reversed');
create type bonu_complaint_status as enum ('open', 'in_review', 'resolved', 'closed');
create type bonu_complaint_priority as enum ('low', 'medium', 'high', 'urgent');

create table public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role bonu_user_role not null default 'member',
  created_at timestamptz not null default now()
);

create or replace function public.has_role(required_role bonu_user_role)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = required_role
  );
$$;

create or replace function public.has_staff_role()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role in ('csr', 'admin')
  );
$$;

create table public.members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  membership_number text unique,
  full_name text not null,
  national_id text,
  date_of_birth date,
  gender text,
  marital_status text,
  occupation text,
  employer text,
  employee_number text,
  mobile_number text not null,
  alternative_contact_number text,
  email text not null,
  physical_address text,
  postal_address text,
  district text,
  council text,
  work_station text,
  department text,
  employment_date date,
  monthly_salary numeric(12, 2),
  status bonu_member_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.member_documents (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  document_type text not null,
  file_path text not null,
  verified_at timestamptz,
  verified_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.service_applications (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  application_type bonu_application_type not null,
  status bonu_application_status not null default 'submitted',
  assigned_to uuid references auth.users(id) on delete set null,
  requested_amount numeric(12, 2),
  monthly_deduction numeric(12, 2),
  term_months integer,
  details jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now(),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.case_pulses (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.service_applications(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  author_user_id uuid references auth.users(id) on delete set null,
  author_role text not null default 'member',
  comment text,
  file_path text,
  created_at timestamptz not null default now()
);

create table public.case_pulse_likes (
  pulse_id uuid not null references public.case_pulses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (pulse_id, user_id)
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  service_name text not null,
  monthly_amount numeric(12, 2) not null,
  active boolean not null default true,
  started_on date not null default current_date,
  ended_on date,
  created_at timestamptz not null default now()
);

create table public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.members(id) on delete set null,
  application_id uuid references public.service_applications(id) on delete set null,
  stripe_session_id text unique,
  stripe_payment_intent_id text unique,
  description text not null,
  amount numeric(12, 2) not null,
  currency text not null default 'BWP',
  status bonu_payment_status not null default 'pending',
  paid_at timestamptz,
  payment_kind text,
  payment_month date,
  payment_source text,
  expected_amount numeric(12, 2),
  import_batch_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index payment_transactions_membership_month_unique
  on public.payment_transactions (member_id, payment_month)
  where payment_kind = 'membership_monthly';

create table public.payment_import_batches (
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

create table public.merchandise_products (
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

create table public.merchandise_orders (
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

create table public.merchandise_order_items (
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

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.members(id) on delete cascade,
  title text not null,
  message text not null,
  channel text not null default 'in_app',
  read_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.complaints (
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

alter table public.members enable row level security;
alter table public.user_roles enable row level security;
alter table public.member_documents enable row level security;
alter table public.service_applications enable row level security;
alter table public.case_pulses enable row level security;
alter table public.case_pulse_likes enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.payment_import_batches enable row level security;
alter table public.merchandise_products enable row level security;
alter table public.merchandise_orders enable row level security;
alter table public.merchandise_order_items enable row level security;
alter table public.notifications enable row level security;
alter table public.complaints enable row level security;

create policy "Users can read own role"
  on public.user_roles for select
  using (auth.uid() = user_id);

create policy "Admins can read all roles"
  on public.user_roles for select
  using (public.has_role('admin'));

create policy "Admins can manage roles"
  on public.user_roles for all
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

create policy "Members can read own profile"
  on public.members for select
  using (auth.uid() = user_id or public.has_staff_role());

create policy "Members can create own profile"
  on public.members for insert
  with check (auth.uid() = user_id);

create policy "Members can update own profile"
  on public.members for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Staff can manage member profiles"
  on public.members for all
  using (public.has_staff_role())
  with check (public.has_staff_role());

create policy "Members can read own documents"
  on public.member_documents for select
  using (member_id in (select id from public.members where user_id = auth.uid()) or public.has_staff_role());

create policy "Members can add own documents"
  on public.member_documents for insert
  with check (member_id in (select id from public.members where user_id = auth.uid()));

create policy "Staff can manage documents"
  on public.member_documents for all
  using (public.has_staff_role())
  with check (public.has_staff_role());

create policy "Members can read own applications"
  on public.service_applications for select
  using (member_id in (select id from public.members where user_id = auth.uid()) or public.has_staff_role());

create policy "Members can submit own applications"
  on public.service_applications for insert
  with check (member_id in (select id from public.members where user_id = auth.uid()));

create policy "Staff can manage applications"
  on public.service_applications for all
  using (public.has_staff_role())
  with check (public.has_staff_role());

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

create policy "Members can read own subscriptions"
  on public.subscriptions for select
  using (member_id in (select id from public.members where user_id = auth.uid()) or public.has_staff_role());

create policy "Staff can manage subscriptions"
  on public.subscriptions for all
  using (public.has_staff_role())
  with check (public.has_staff_role());

create policy "Members can read own payments"
  on public.payment_transactions for select
  using (member_id in (select id from public.members where user_id = auth.uid()) or public.has_staff_role());

create policy "Staff can manage payments"
  on public.payment_transactions for all
  using (public.has_staff_role())
  with check (public.has_staff_role());

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

create policy "Members can read own notifications"
  on public.notifications for select
  using (member_id in (select id from public.members where user_id = auth.uid()) or public.has_staff_role());

create policy "Staff can manage notifications"
  on public.notifications for all
  using (public.has_staff_role())
  with check (public.has_staff_role());

create policy "Members can read own complaints"
  on public.complaints for select
  using (member_id in (select id from public.members where user_id = auth.uid()) or public.has_staff_role());

create policy "Members can submit own complaints"
  on public.complaints for insert
  with check (member_id in (select id from public.members where user_id = auth.uid()) or public.has_staff_role());

create policy "Staff can manage complaints"
  on public.complaints for all
  using (public.has_staff_role())
  with check (public.has_staff_role());

-- Bootstrap the first administrator after creating the auth user in Supabase:
-- insert into public.user_roles (user_id, role)
-- values ('00000000-0000-0000-0000-000000000000', 'admin');
