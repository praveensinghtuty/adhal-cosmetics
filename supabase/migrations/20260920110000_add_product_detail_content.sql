alter table public.products
  add column if not exists short_description text,
  add column if not exists benefits text[] not null default '{}',
  add column if not exists ingredients text[] not null default '{}',
  add column if not exists how_to_use text[] not null default '{}',
  add column if not exists best_for text[] not null default '{}',
  add column if not exists net_weight text,
  add column if not exists shelf_life text;

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  alt_text text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists product_images_product_id_idx on public.product_images(product_id);
create index if not exists product_images_sort_order_idx on public.product_images(product_id, sort_order);

alter table public.product_images enable row level security;

drop policy if exists "Public can view active product images" on public.product_images;
create policy "Public can view active product images" on public.product_images
  for select using (
    exists (
      select 1 from public.products
      where products.id = product_images.product_id
      and products.is_active = true
    )
    or public.is_admin()
  );

drop policy if exists "Admins can manage product images" on public.product_images;
create policy "Admins can manage product images" on public.product_images
  for all using (public.is_admin()) with check (public.is_admin());
