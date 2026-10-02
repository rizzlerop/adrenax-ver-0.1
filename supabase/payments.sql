-- Razorpay checkout order storage. Run after schema.sql and policies.sql.
-- Customer order rows are read-only to signed-in customers; only server-side
-- service-role calls can create orders or mark a verified payment complete.

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  razorpay_order_id text not null unique,
  razorpay_payment_id text unique,
  amount_paise bigint not null check (amount_paise > 0),
  currency text not null default 'INR' check (currency = 'INR'),
  status text not null default 'pending' check (status in ('pending', 'paid', 'refund_required', 'refunded')),
  shipping_address jsonb not null,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  refunded_at timestamptz
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  unit_price_paise bigint not null check (unit_price_paise >= 0),
  quantity integer not null check (quantity > 0)
);

create index if not exists orders_user_created_idx on public.orders(user_id, created_at desc);
create index if not exists order_items_order_id_idx on public.order_items(order_id);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "Customers read own orders" on public.orders;
create policy "Customers read own orders" on public.orders
for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());

drop policy if exists "Customers read own order items" on public.order_items;
create policy "Customers read own order items" on public.order_items
for select to authenticated using (
  exists (
    select 1 from public.orders
    where orders.id = order_items.order_id
      and (orders.user_id = (select auth.uid()) or public.is_admin())
  )
);

grant select on public.orders, public.order_items to authenticated;
grant all on public.orders, public.order_items to service_role;

create or replace function public.create_adrenax_order(
  p_user_id uuid,
  p_razorpay_order_id text,
  p_amount_paise bigint,
  p_shipping_address jsonb,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_input jsonb;
  v_product record;
  v_product_id uuid;
  v_quantity integer;
  v_total_paise bigint := 0;
  v_order_id uuid;
begin
  if p_razorpay_order_id is null or length(p_razorpay_order_id) > 80 then
    raise exception 'invalid_provider_order';
  end if;
  if p_amount_paise <= 0 or p_items is null or p_shipping_address is null then
    raise exception 'invalid_checkout_payload';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_typeof(p_shipping_address) <> 'object' then
    raise exception 'invalid_checkout_payload';
  end if;
  if jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 30 then
    raise exception 'invalid_checkout_payload';
  end if;
  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'invalid_customer';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(p_items) as rows(value)
    group by value->>'product_id'
    having count(*) > 1
  ) then
    raise exception 'duplicate_product';
  end if;

  -- Lock the selected products in stable order while checking stock and price.
  for v_input in
    select value from jsonb_array_elements(p_items) as rows(value)
    order by value->>'product_id'
  loop
    v_product_id := (v_input->>'product_id')::uuid;
    v_quantity := (v_input->>'quantity')::integer;
    if v_quantity < 1 or v_quantity > 50 then raise exception 'invalid_quantity'; end if;

    select id, name, price, stock_quantity, is_deleted into v_product
    from public.products where id = v_product_id for update;
    if not found or v_product.is_deleted or v_product.stock_quantity < v_quantity then
      raise exception 'product_unavailable';
    end if;
    v_total_paise := v_total_paise + round(v_product.price * 100)::bigint * v_quantity;
  end loop;

  if v_total_paise <> p_amount_paise then raise exception 'amount_changed'; end if;

  insert into public.orders (user_id, razorpay_order_id, amount_paise, currency, shipping_address)
  values (p_user_id, p_razorpay_order_id, v_total_paise, 'INR', p_shipping_address)
  returning id into v_order_id;

  for v_input in select value from jsonb_array_elements(p_items) as rows(value) loop
    v_product_id := (v_input->>'product_id')::uuid;
    v_quantity := (v_input->>'quantity')::integer;
    select name, round(price * 100)::bigint as unit_price_paise into v_product
    from public.products where id = v_product_id;
    insert into public.order_items (order_id, product_id, product_name, unit_price_paise, quantity)
    values (v_order_id, v_product_id, v_product.name, v_product.unit_price_paise, v_quantity);
  end loop;

  return v_order_id;
end;
$$;

create or replace function public.complete_adrenax_order(
  p_razorpay_order_id text,
  p_payment_id text,
  p_amount_paise bigint,
  p_currency text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_item record;
  v_stock integer;
  v_deleted boolean;
  v_unavailable boolean := false;
begin
  select * into v_order from public.orders
  where razorpay_order_id = p_razorpay_order_id for update;
  if not found then return jsonb_build_object('status', 'not_found'); end if;

  if v_order.status in ('paid', 'refund_required', 'refunded') then
    if v_order.razorpay_payment_id = p_payment_id then
      return jsonb_build_object('status', v_order.status, 'order_id', v_order.id);
    end if;
    return jsonb_build_object('status', 'payment_mismatch');
  end if;
  if v_order.status <> 'pending' or v_order.amount_paise <> p_amount_paise or v_order.currency <> p_currency then
    return jsonb_build_object('status', 'payment_mismatch');
  end if;

  -- Check and lock every item first so a short-stock order cannot partially
  -- decrement inventory.
  for v_item in select product_id, quantity from public.order_items
    where order_id = v_order.id order by product_id
  loop
    if v_item.product_id is null then v_unavailable := true; exit; end if;
    select stock_quantity, is_deleted into v_stock, v_deleted
    from public.products where id = v_item.product_id for update;
    if not found or v_deleted or v_stock < v_item.quantity then v_unavailable := true; exit; end if;
  end loop;

  if v_unavailable then
    update public.orders set status = 'refund_required', razorpay_payment_id = p_payment_id, paid_at = now()
    where id = v_order.id;
    return jsonb_build_object('status', 'refund_required', 'order_id', v_order.id);
  end if;

  for v_item in select product_id, quantity from public.order_items where order_id = v_order.id loop
    update public.products set stock_quantity = stock_quantity - v_item.quantity where id = v_item.product_id;
  end loop;
  update public.orders set status = 'paid', razorpay_payment_id = p_payment_id, paid_at = now()
  where id = v_order.id;
  return jsonb_build_object('status', 'paid', 'order_id', v_order.id);
end;
$$;

revoke all on function public.create_adrenax_order(uuid, text, bigint, jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.complete_adrenax_order(text, text, bigint, text) from public, anon, authenticated;
grant execute on function public.create_adrenax_order(uuid, text, bigint, jsonb, jsonb) to service_role;
grant execute on function public.complete_adrenax_order(text, text, bigint, text) to service_role;
