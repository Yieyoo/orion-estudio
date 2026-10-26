-- Orion CRM — tickets (comprobantes de pago) para clientes
-- Pégalo en Supabase → SQL Editor → New query → Run (solo una vez).

create table public.receipts (
  id uuid primary key default gen_random_uuid(),
  -- código secreto del enlace público: quien no lo tenga no puede ver el ticket
  token uuid not null unique default gen_random_uuid(),
  folio bigint generated always as identity,
  client_id uuid references public.clients(id) on delete set null,
  created_at timestamptz not null default now(),
  client_name text not null,
  client_contact text,
  plan text not null,
  items jsonb not null default '[]',     -- [{ "concept": "...", "qty": 1, "price": 1000 }]
  total numeric(12,2) not null default 0,
  payments jsonb not null default '[]',  -- [{ "date": "2026-10-26", "amount": 500, "method": "Transferencia" }]
  notes text
);
create index receipts_client_idx on public.receipts (client_id);

alter table public.receipts enable row level security;

create policy "admins gestionan tickets" on public.receipts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Lectura pública de UN ticket por su código secreto (para el enlace que recibe el cliente).
-- No expone el id interno ni el cliente del CRM.
create or replace function public.get_receipt(p_token uuid) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'folio', folio, 'created_at', created_at, 'client_name', client_name, 'client_contact', client_contact,
    'plan', plan, 'items', items, 'total', total, 'payments', payments, 'notes', notes
  )
  from public.receipts where token = p_token;
$$;

revoke all on function public.get_receipt(uuid) from public;
grant execute on function public.get_receipt(uuid) to anon, authenticated;
