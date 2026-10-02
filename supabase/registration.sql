-- Give every new Auth user the standard storefront role.
-- Admin status is never accepted from client-supplied metadata.

create or replace function public.assign_default_web_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_roles (id, is_admin)
  values (new.id, false)
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.assign_default_web_role() from public;

do $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_trigger
    where tgname = 'adrenax_assign_default_web_role'
      and tgrelid = 'auth.users'::regclass
      and not tgisinternal
  ) then
    execute 'create trigger adrenax_assign_default_web_role
      after insert on auth.users
      for each row execute function public.assign_default_web_role()';
  end if;
end;
$$;
