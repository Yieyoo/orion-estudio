// Orion CRM — Edge Function "admin-users": crear, eliminar y cambiar contraseña de usuarios del panel.
// Corre dentro de Supabase con la clave maestra (service role), que NUNCA llega al navegador.
// Solo responde si quien la llama es el dueño (admins.is_owner).
//
// Despliegue: Supabase → Edge Functions → Deploy a new function → Via Editor →
// nombre "admin-users" → pega este archivo → Deploy. "Verify JWT" puede ir apagado:
// la función valida la sesión por su cuenta (auth.getUser) y exige ser dueño.

import { createClient } from 'npm:@supabase/supabase-js@2';

const SECTIONS = ['prospectar', 'clientes', 'tickets', 'propuestas', 'seguimientos', 'reportes'];
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  // Clave maestra: la clásica (service_role) o, en proyectos con el sistema nuevo de claves, la secreta (sb_secret_…)
  let serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!serviceKey) {
    try { serviceKey = Object.values(JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}'))[0] as string || ''; } catch { /* sin claves */ }
  }
  if (!serviceKey) return json({ error: 'La función no encontró la clave secreta del proyecto' }, 500);
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  // ¿Quién llama? Debe traer una sesión válida y ser el dueño
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return json({ error: 'Sesión no válida, vuelve a iniciar sesión' }, 401);
  const { data: me } = await admin.from('admins').select('is_owner').eq('user_id', user.id).maybeSingle();
  if (!me?.is_owner) return json({ error: 'Solo el dueño puede administrar usuarios' }, 403);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: 'Solicitud inválida' }, 400); }
  const action = body.action;

  if (action === 'create') {
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const name = String(body.name || '').trim() || null;
    const permissions = (Array.isArray(body.permissions) ? body.permissions : []).filter(p => SECTIONS.includes(String(p)));
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: 'Correo no válido' }, 400);
    if (password.length < 8) return json({ error: 'La contraseña debe tener al menos 8 caracteres' }, 400);

    const { data: created, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name } });
    if (error) return json({ error: /already/i.test(error.message) ? 'Ya existe un usuario con ese correo' : error.message }, 400);

    const row = { user_id: created.user.id, email, name, permissions, is_owner: false };
    const { data: saved, error: rowError } = await admin.from('admins').insert(row).select().single();
    if (rowError) {
      await admin.auth.admin.deleteUser(created.user.id); // no dejar usuarios a medias
      return json({ error: rowError.message }, 500);
    }
    return json({ user: saved });
  }

  if (action === 'delete' || action === 'set-password') {
    const userId = String(body.user_id || '');
    if (!userId) return json({ error: 'Falta el usuario' }, 400);
    if (userId === user.id) return json({ error: 'No puedes hacer esto con tu propio usuario aquí' }, 400);
    const { data: target } = await admin.from('admins').select('is_owner').eq('user_id', userId).maybeSingle();
    if (!target) return json({ error: 'Usuario no encontrado' }, 404);
    if (target.is_owner) return json({ error: 'No se puede modificar a otro dueño' }, 400);

    if (action === 'delete') {
      const { error } = await admin.auth.admin.deleteUser(userId); // su fila en admins se borra en cascada
      return error ? json({ error: error.message }, 500) : json({ ok: true });
    }
    const password = String(body.password || '');
    if (password.length < 8) return json({ error: 'La contraseña debe tener al menos 8 caracteres' }, 400);
    const { error } = await admin.auth.admin.updateUserById(userId, { password });
    return error ? json({ error: error.message }, 500) : json({ ok: true });
  }

  return json({ error: 'Acción no válida' }, 400);
});
