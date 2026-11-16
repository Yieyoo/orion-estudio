-- Orion CRM — usuario de Instagram y oferta vigente de cada cliente
-- Pégalo en Supabase → SQL Editor → New query → Run (solo una vez).

alter table public.clients
  add column if not exists instagram text,  -- usuario sin @, en minúsculas (ej. kwarachi_)
  add column if not exists oferta text;     -- lo último que se le ofreció (precio, plan, condiciones)

-- No se puede repetir el mismo usuario de Instagram en dos clientes
create unique index if not exists clients_instagram_unique
  on public.clients (lower(instagram))
  where instagram is not null and instagram <> '';
