-- Orion CRM — esquema para Supabase
-- Pégalo completo en Supabase → SQL Editor → New query → Run.
--
-- Después:
--   1. Authentication → Users → Add user: crea tu usuario (correo + contraseña).
--   2. Authentication → Sign In / Providers: desactiva "Allow new users to sign up".
--   3. Ejecuta esta línea con tu correo para darte permisos de administrador:
--      insert into public.admins (user_id) select id from auth.users where email = 'TU_CORREO';

-- Quién puede ver y editar el CRM
create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- Clientes y prospectos
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  company text,
  role text,
  email text,
  phone text,
  status text not null default 'nuevo'
    check (status in ('nuevo','contactado','respondio','silencio','propuesta','cliente','perdido')),
  channel text not null default 'email'
    check (channel in ('whatsapp','email','instagram','linkedin','llamada')),
  service text,
  value numeric(12,2) not null default 0,
  last_contact date,
  next_step date,
  next_label text,
  tags text[] not null default '{}',
  notes text
);

-- Historial de cada cliente (contactos, respuestas, propuestas…)
create table public.interactions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  created_at timestamptz not null default now(),
  status text not null,
  title text not null,
  note text
);
create index interactions_client_idx on public.interactions (client_id, created_at desc);

-- Seguridad: solo los administradores leen y escriben
alter table public.admins enable row level security;
alter table public.clients enable row level security;
alter table public.interactions enable row level security;

create policy "admins ven su registro" on public.admins
  for select to authenticated using (user_id = auth.uid());

create policy "admins gestionan clientes" on public.clients
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "admins gestionan historial" on public.interactions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
