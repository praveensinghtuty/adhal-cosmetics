alter table public.products
  add column if not exists sale_name text,
  add column if not exists discount_percentage numeric(5, 2);

alter table public.products
  drop constraint if exists products_discount_percentage_check;

alter table public.products
  add constraint products_discount_percentage_check
  check (discount_percentage is null or (discount_percentage > 0 and discount_percentage < 100));

