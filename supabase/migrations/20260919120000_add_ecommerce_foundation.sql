create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'Home',
  full_name text not null,
  phone text not null,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state text not null default 'Tamil Nadu',
  pincode text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('ADH-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state text not null default 'Tamil Nadu',
  pincode text not null,
  status text not null default 'pending',
  payment_status text not null default 'pending',
  payment_method text not null default 'manual',
  subtotal numeric(10, 2) not null default 0,
  total_amount numeric(10, 2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_status_check check (status in ('pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled')),
  constraint orders_payment_status_check check (payment_status in ('pending', 'paid', 'failed', 'refunded'))
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  unit_price numeric(10, 2) not null,
  quantity integer not null,
  line_total numeric(10, 2) not null,
  image_url text,
  created_at timestamptz not null default now(),
  constraint order_items_quantity_check check (quantity > 0)
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event_name text not null,
  properties jsonb not null default '{}'::jsonb,
  page_path text,
  created_at timestamptz not null default now()
);

create index if not exists customer_addresses_user_id_idx on public.customer_addresses(user_id);
create index if not exists orders_user_id_idx on public.orders(user_id);
create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists order_items_order_id_idx on public.order_items(order_id);
create index if not exists analytics_events_created_at_idx on public.analytics_events(created_at desc);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$;

alter table public.profiles enable row level security;
alter table public.customer_addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.analytics_events enable row level security;
alter table public.admin_users enable row level security;

drop policy if exists "Profiles are visible to owners and admins" on public.profiles;
create policy "Profiles are visible to owners and admins" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "Users can upsert their own profile" on public.profiles;
create policy "Users can upsert their own profile" on public.profiles
  for insert with check (id = auth.uid());

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "Users manage their own addresses" on public.customer_addresses;
create policy "Users manage their own addresses" on public.customer_addresses
  for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users and admins can view orders" on public.orders;
create policy "Users and admins can view orders" on public.orders
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users can create their own orders" on public.orders;
create policy "Users can create their own orders" on public.orders
  for insert with check (user_id = auth.uid());

drop policy if exists "Admins can update orders" on public.orders;
create policy "Admins can update orders" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Users and admins can view order items" on public.order_items;
create policy "Users and admins can view order items" on public.order_items
  for select using (
    public.is_admin() or exists (
      select 1 from public.orders where orders.id = order_items.order_id and orders.user_id = auth.uid()
    )
  );

drop policy if exists "Users can create items for own orders" on public.order_items;
create policy "Users can create items for own orders" on public.order_items
  for insert with check (
    exists (
      select 1 from public.orders where orders.id = order_items.order_id and orders.user_id = auth.uid()
    )
  );

drop policy if exists "Users can record analytics" on public.analytics_events;
create policy "Users can record analytics" on public.analytics_events
  for insert with check (user_id is null or user_id = auth.uid());

drop policy if exists "Admins can view analytics" on public.analytics_events;
create policy "Admins can view analytics" on public.analytics_events
  for select using (public.is_admin());

drop policy if exists "Admins can view admin users" on public.admin_users;
create policy "Admins can view admin users" on public.admin_users
  for select using (public.is_admin());
