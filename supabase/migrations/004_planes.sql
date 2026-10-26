-- Orion CRM — planes con precio mensual y precio contratado en cada ticket
-- Pégalo en Supabase → SQL Editor → New query → Run (solo una vez).

-- Catálogo de planes (los precios se cambian desde Ajustes en el panel)
create table if not exists public.plans (
  id serial primary key,
  name text not null unique,
  monthly_price numeric(12,2) not null default 0,
  sort int not null default 0
);
alter table public.plans enable row level security;
create policy "admins gestionan planes" on public.plans
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into public.plans (name, sort) values ('Básico', 1), ('Recomendado', 2), ('Activo', 3)
on conflict (name) do nothing;

-- Precio mensual con el que se contrató cada ticket y cuántos meses cubre
alter table public.receipts
  add column if not exists monthly_price numeric(12,2),
  add column if not exists months int;

-- El enlace público también muestra el precio mensual contratado
create or replace function public.get_receipt(p_token uuid) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'folio', folio, 'created_at', created_at, 'client_name', client_name, 'client_contact', client_contact,
    'plan', plan, 'monthly_price', monthly_price, 'months', months,
    'items', items, 'total', total, 'payments', payments, 'notes', notes
  )
  from public.receipts where token = p_token;
$$;
