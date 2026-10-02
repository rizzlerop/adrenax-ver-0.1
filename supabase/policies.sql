-- Run this after creating the tables in the project brief.
-- Keep admin access tied to auth.uid(); never trust a client-supplied admin flag.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where id = (select auth.uid()) and is_admin = true
  );
$$;

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.user_roles enable row level security;

drop policy if exists "Public can read categories" on public.categories;
create policy "Public can read categories" on public.categories
for select to anon, authenticated using (true);

drop policy if exists "Admins manage categories" on public.categories;
create policy "Admins manage categories" on public.categories
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public can read listed products" on public.products;
create policy "Public can read listed products" on public.products
for select to anon, authenticated using (is_deleted = false);

drop policy if exists "Admins manage products" on public.products;
create policy "Admins manage products" on public.products
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Users read their own role" on public.user_roles;
create policy "Users read their own role" on public.user_roles
for select to authenticated using (id = (select auth.uid()));

-- Create the product-images bucket as public in Supabase Storage.
-- Upload, update, and delete stay restricted to admins; public users can read images.
drop policy if exists "Admins upload product images" on storage.objects;
create policy "Admins upload product images" on storage.objects
for insert to authenticated with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "Admins update product images" on storage.objects;
create policy "Admins update product images" on storage.objects
for update to authenticated using (bucket_id = 'product-images' and public.is_admin())
with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "Admins delete product images" on storage.objects;
create policy "Admins delete product images" on storage.objects
for delete to authenticated using (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "Public reads product images" on storage.objects;
create policy "Public reads product images" on storage.objects
for select to anon, authenticated using (bucket_id = 'product-images');
