// Orion CRM — usuarios del panel (solo el dueño los ve y los administra).
// Crear, eliminar y cambiar contraseñas pasa por la Edge Function "admin-users" (tiene la clave maestra);
// los permisos se guardan directo en la tabla admins (solo el dueño puede escribirla).
// Depende de admin.js (db, state, toast, esc, isOwner, SECTIONS, VIEWS).

const users = { list: [], loaded: false, loading: false, missing: false };

async function adminUsers(body) {
  if (!db) return { error: 'En modo demo no se crean usuarios reales' };
  const { data, error } = await db.functions.invoke('admin-users', { body });
  if (error) {
    // El mensaje útil viene en el cuerpo de la respuesta de la función
    let message = error.message;
    try { message = (await error.context.json()).error || message; } catch { /* sin cuerpo */ }
    if (/Failed to send|not found|404/i.test(message)) message = 'Falta crear la Edge Function "admin-users" en Supabase';
    return { error: message };
  }
  return data;
}

async function loadUsers() {
  if (users.loading || users.loaded) return;
  users.loading = true;
  if (db) {
    const { data, error } = await db.from('admins').select('*').order('created_at');
    users.loading = false;
    users.missing = Boolean(error) || (data[0] && !('permissions' in data[0]));
    users.list = error ? [] : data;
  } else {
    users.loading = false;
    users.list = [
      { user_id: 'demo-owner', email: 'tu@orionwebmx.com', name: 'Administrador', is_owner: true, permissions: [] },
      { user_id: 'demo-1', email: 'ventas@orionwebmx.com', name: 'Ana (ventas)', is_owner: false, permissions: ['prospectar', 'clientes', 'seguimientos'] }
    ];
  }
  users.loaded = true;
  renderUsersPanel();
}

const permChecks = (selected, disabled) => SECTIONS.map(s => `
  <label class="perm"><input type="checkbox" value="${s}"${selected.includes(s) ? ' checked' : ''}${disabled ? ' disabled' : ''}><span>${VIEWS[s].title}</span></label>`).join('');

function renderUsersPanel() {
  const panel = $('#users-panel');
  if (!panel || !isOwner()) return;
  if (!users.loaded) {
    panel.innerHTML = '<div class="panel-head"><h2>Usuarios</h2></div><p class="panel-text">Cargando…</p>';
    loadUsers();
    return;
  }
  panel.innerHTML = `
    <div class="panel-head"><h2>Usuarios</h2><span class="eyebrow">QUIÉN ENTRA AL PANEL Y QUÉ VE</span></div>
    <p class="panel-text">Solo tú puedes crear usuarios. Cada uno ve únicamente las secciones que marques; Ajustes (su cuenta y contraseña) lo ven todos.</p>
    ${users.missing ? '<p class="info-banner" style="margin:0 0 14px">Falta actualizar la base: corre <code>supabase/migrations/006_usuarios.sql</code> en Supabase.</p>' : ''}
    <div class="user-list">${users.list.map(u => `
      <div class="user-row" data-user="${esc(u.user_id)}">
        <div class="user-who">
          <span class="avatar${u.is_owner ? ' avatar-blue' : ''}">${esc((u.name || u.email || '?').trim().slice(0, 2).toUpperCase())}</span>
          <div><strong>${esc(u.name || u.email)}</strong><small>${esc(u.email || '')}</small></div>
          ${u.is_owner ? '<span class="pill" style="--c:var(--blue)">Dueño · ve todo</span>' : ''}
        </div>
        ${u.is_owner ? '' : `
        <div class="perms">${permChecks(u.permissions || [], false)}</div>
        <div class="user-actions">
          <button class="btn btn-dark btn-sm" data-uact="save">Guardar permisos</button>
          <button class="mini-btn mini-text" data-uact="password">Cambiar contraseña</button>
          <button class="link-danger" data-uact="delete">Eliminar</button>
        </div>`}
      </div>`).join('')}</div>
    <details class="new-user"${users.list.length < 2 ? ' open' : ''}>
      <summary>+ Nuevo usuario</summary>
      <form id="user-form">
        <div class="form-grid">
          <label class="field"><span>Nombre</span><input name="name" placeholder="Ana (ventas)"></label>
          <label class="field"><span>Correo *</span><input name="email" type="email" required autocomplete="off"></label>
          <label class="field span-2"><span>Contraseña temporal * (mín. 8)</span><input name="password" type="text" minlength="8" required autocomplete="off" placeholder="Compártela con la persona; luego la cambia en Ajustes"></label>
        </div>
        <p class="eyebrow">QUÉ PUEDE VER</p>
        <div class="perms">${permChecks(['clientes'], false)}</div>
        <button class="btn btn-dark" type="submit"${users.missing ? ' disabled' : ''}>Crear usuario</button>
      </form>
    </details>`;
}

const checkedPerms = el => [...el.querySelectorAll('.perm input:checked')].map(i => i.value);

async function createUser(form) {
  const f = new FormData(form);
  const permissions = checkedPerms(form);
  if (!permissions.length) return toast('Marca al menos una sección');
  const button = form.querySelector('[type=submit]');
  button.disabled = true;
  const body = { action: 'create', name: f.get('name').trim(), email: f.get('email').trim(), password: f.get('password'), permissions };
  let result = await adminUsers(body);
  if (!db) result = { user: { user_id: 'demo-' + Date.now(), email: body.email, name: body.name, is_owner: false, permissions } };
  button.disabled = false;
  if (result.error) return toast(result.error);
  users.list.push(result.user);
  renderUsersPanel();
  toast(`Usuario creado: ${body.email}`);
}

async function savePermissions(row) {
  const u = users.list.find(x => x.user_id === row.dataset.user);
  const permissions = checkedPerms(row);
  if (db) {
    const { error } = await db.from('admins').update({ permissions }).eq('user_id', u.user_id);
    if (error) return toast('No se pudieron guardar los permisos: ' + error.message);
  }
  u.permissions = permissions;
  toast(`Permisos de ${u.name || u.email} guardados`);
}

async function setUserPassword(row) {
  const u = users.list.find(x => x.user_id === row.dataset.user);
  const password = prompt(`Nueva contraseña para ${u.email} (mínimo 8 caracteres):`);
  if (password == null) return;
  if (password.length < 8) return toast('La contraseña debe tener al menos 8 caracteres');
  const result = await adminUsers({ action: 'set-password', user_id: u.user_id, password });
  toast(result.error || 'Contraseña actualizada');
}

async function deleteUser(row) {
  const u = users.list.find(x => x.user_id === row.dataset.user);
  if (!confirm(`¿Eliminar a ${u.name || u.email}? Ya no podrá entrar al panel.`)) return;
  const result = db ? await adminUsers({ action: 'delete', user_id: u.user_id }) : {};
  if (result.error) return toast(result.error);
  users.list = users.list.filter(x => x !== u);
  renderUsersPanel();
  toast('Usuario eliminado');
}

$('#views').addEventListener('click', e => {
  const btn = e.target.closest('[data-uact]');
  if (!btn) return;
  const row = btn.closest('[data-user]');
  if (btn.dataset.uact === 'save') savePermissions(row);
  if (btn.dataset.uact === 'password') setUserPassword(row);
  if (btn.dataset.uact === 'delete') deleteUser(row);
});
$('#views').addEventListener('submit', e => {
  if (e.target.id === 'user-form') createUser(e.target);
});

// Si el panel se abrió directo en Ajustes, esta sección se pinta al cargar el archivo
if (currentView() === 'ajustes') renderUsersPanel();
