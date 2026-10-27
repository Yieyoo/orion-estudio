-- Orion CRM — usuarios del panel con permisos por sección
-- Pégalo en Supabase → SQL Editor → New query → Run (solo una vez).
-- Después crea la Edge Function "admin-users" (ver supabase/functions/admin-users/index.ts).

-- Quién es cada usuario del panel y qué secciones puede ver
alter table public.admins
  add column if not exists email text,
  add column if not exists name text,
  add column if not exists is_owner boolean not null default false,
  add column if not exists permissions text[] not null default '{}',
  add column if not exists created_at timestamptz not null default now();

-- Los usuarios que ya existían quedan como dueños (hoy solo eres tú)
update public.admins a set is_owner = true, email = u.email
from auth.users u where u.id = a.user_id;

-- ¿El usuario actual es el dueño?
create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid() and is_owner);
$$;

-- ¿El usuario actual tiene alguna de estas secciones? (el dueño las tiene todas)
create or replace function public.can_any(sections text[]) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid() and (is_owner or permissions && sections));
$$;

-- ---------- Reglas por tabla (reemplazan las anteriores) ----------
drop policy if exists "admins gestionan clientes" on public.clients;
drop policy if exists "admins gestionan historial" on public.interactions;
drop policy if exists "admins gestionan tickets" on public.receipts;
drop policy if exists "admins gestionan planes" on public.plans;
drop policy if exists "admins ven su registro" on public.admins;

-- Clientes: los ven quienes trabajan con ellos; los modifican quienes los gestionan
create policy "clientes: ver" on public.clients for select to authenticated
  using (public.can_any(array['clientes', 'propuestas', 'seguimientos', 'reportes', 'prospectar', 'tickets']));
create policy "clientes: crear" on public.clients for insert to authenticated
  with check (public.can_any(array['clientes', 'prospectar']));
create policy "clientes: editar" on public.clients for update to authenticated
  using (public.can_any(array['clientes', 'propuestas', 'seguimientos']))
  with check (public.can_any(array['clientes', 'propuestas', 'seguimientos']));
create policy "clientes: borrar" on public.clients for delete to authenticated
  using (public.can_any(array['clientes']));

-- Historial de cada cliente
create policy "historial: ver" on public.interactions for select to authenticated
  using (public.can_any(array['clientes', 'propuestas', 'seguimientos', 'reportes', 'prospectar', 'tickets']));
create policy "historial: anotar" on public.interactions for insert to authenticated
  with check (public.can_any(array['clientes', 'propuestas', 'seguimientos', 'prospectar', 'tickets']));
create policy "historial: editar" on public.interactions for update to authenticated
  using (public.can_any(array['clientes'])) with check (public.can_any(array['clientes']));
create policy "historial: borrar" on public.interactions for delete to authenticated
  using (public.can_any(array['clientes']));

-- Tickets
create policy "tickets: todo" on public.receipts for all to authenticated
  using (public.can_any(array['tickets'])) with check (public.can_any(array['tickets']));

-- Planes: los ve quien hace tickets; los precios solo los cambia el dueño
create policy "planes: ver" on public.plans for select to authenticated
  using (public.can_any(array['tickets']));
create policy "planes: cambiar" on public.plans for all to authenticated
  using (public.is_owner()) with check (public.is_owner());

-- Usuarios: cada quien ve su propio registro; el dueño ve y cambia todos
create policy "usuarios: ver" on public.admins for select to authenticated
  using (user_id = auth.uid() or public.is_owner());
create policy "usuarios: gestionar" on public.admins for all to authenticated
  using (public.is_owner()) with check (public.is_owner());
