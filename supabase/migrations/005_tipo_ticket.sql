-- Orion CRM — tipo de ticket: pago de página web o mensualidad (un ticket por mes)
-- Pégalo en Supabase → SQL Editor → New query → Run (solo una vez).

alter table public.receipts
  add column if not exists kind text check (kind in ('web', 'mensualidad')),
  add column if not exists period text; -- mes que cubre una mensualidad, formato 2026-11

create or replace function public.get_receipt(p_token uuid) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'folio', folio, 'created_at', created_at, 'client_name', client_name, 'client_contact', client_contact,
    'kind', kind, 'period', period, 'plan', plan, 'monthly_price', monthly_price, 'months', months,
    'items', items, 'total', total, 'payments', payments, 'notes', notes
  )
  from public.receipts where token = p_token;
$$;
