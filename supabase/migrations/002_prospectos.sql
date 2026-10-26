-- Orion CRM — datos de Google Maps para prospectos
-- Pégalo en Supabase → SQL Editor → New query → Run (solo una vez).

alter table public.clients
  add column if not exists website text,
  add column if not exists address text,
  add column if not exists place_id text unique,
  add column if not exists maps_url text;
