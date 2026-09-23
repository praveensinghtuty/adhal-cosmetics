alter table public.orders
  add column if not exists courier_amount numeric(10, 2);

alter table public.orders
  drop constraint if exists orders_courier_required_for_fulfilment_check;

alter table public.orders
  add constraint orders_courier_required_for_fulfilment_check
  check (
    status in ('pending', 'cancelled')
    or courier_amount is not null
  ) not valid;
