// Orion CRM — usa Supabase si está configurado en supabase-config.js; si no, muestra datos de ejemplo.

const STATUSES = [
  { id: 'nuevo', label: 'Por contactar', color: 'var(--st-nuevo)' },
  { id: 'contactado', label: 'Contactado', color: 'var(--st-contactado)' },
  { id: 'respondio', label: 'Respondió', color: 'var(--st-respondio)' },
  { id: 'silencio', label: 'Sin respuesta', color: 'var(--st-silencio)' },
  { id: 'propuesta', label: 'Propuesta enviada', color: 'var(--st-propuesta)' },
  { id: 'cliente', label: 'Cliente', color: 'var(--st-cliente)' },
  { id: 'perdido', label: 'Perdido', color: 'var(--st-perdido)' }
];
const statusById = Object.fromEntries(STATUSES.map(s => [s.id, s]));

const CHANNELS = {
  whatsapp: { label: 'WhatsApp', icon: '<path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"/><path d="M9 9.5c.3 1.8 1.7 3.6 3.6 4.4l1.2-1.1 1.9.8"/>' },
  email: { label: 'Correo', icon: '<rect x="3" y="5" width="18" height="14" rx="1"/><path d="m3 7 9 6 9-6"/>' },
  instagram: { label: 'Instagram', icon: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6"/>' },
  linkedin: { label: 'LinkedIn', icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7"/>' },
  llamada: { label: 'Llamada', icon: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>' }
};

const cfg = window.ORION_SUPABASE || {};
const db = cfg.url && cfg.anonKey && window.supabase ? window.supabase.createClient(cfg.url, cfg.anonKey) : null;

// Datos de ejemplo para el modo demo. lastContact / nextStep en días relativos a hoy (negativo = pasado)
const DEMO = [
  { id: 1, name: 'Mariana López', company: 'Café Raíz', role: 'Dueña', email: 'mariana@caferaiz.mx', phone: '+52 55 1234 5678', status: 'propuesta', channel: 'whatsapp', lastContact: -2, nextStep: 1, nextLabel: 'Revisar propuesta juntos', value: 38000, service: 'Sitio web + identidad', tags: ['restaurante', 'referido'],
    history: [{ d: -2, s: 'propuesta', t: 'Propuesta enviada', n: 'Paquete sitio + branding, 3 semanas.' }, { d: -6, s: 'respondio', t: 'Respondió', n: 'Le interesa renovar su marca antes de diciembre.' }, { d: -8, s: 'contactado', t: 'Primer contacto por WhatsApp', n: '' }] },
  { id: 2, name: 'Andrés Villalobos', company: 'Villalobos Arquitectos', role: 'Socio director', email: 'andres@villalobos.mx', phone: '+52 33 9876 1122', status: 'respondio', channel: 'email', lastContact: -1, nextStep: 0, nextLabel: 'Agendar llamada', value: 0, service: 'Portafolio web', tags: ['arquitectura'],
    history: [{ d: -1, s: 'respondio', t: 'Respondió', n: 'Pide ejemplos de portafolios.' }, { d: -4, s: 'contactado', t: 'Correo de presentación', n: '' }] },
  { id: 3, name: 'Sofía Rangel', company: 'Studio Pilates Norte', role: 'Fundadora', email: 'sofia@pilatesnorte.com', phone: '+52 81 4455 6677', status: 'silencio', channel: 'instagram', lastContact: -12, nextStep: -2, nextLabel: 'Segundo seguimiento', value: 0, service: 'Landing + reservas', tags: ['wellness'],
    history: [{ d: -12, s: 'contactado', t: 'DM en Instagram', n: 'Visto, sin respuesta.' }] },
  { id: 4, name: 'Jorge Méndez', company: 'Méndez Legal', role: 'Abogado', email: 'jmendez@mendezlegal.mx', phone: '+52 55 7788 9900', status: 'cliente', channel: 'llamada', lastContact: -5, nextStep: 14, nextLabel: 'Entrega fase 2', value: 52000, service: 'Sitio corporativo', tags: ['legal', 'recurrente'],
    history: [{ d: -5, s: 'cliente', t: 'Anticipo recibido', n: '50% pagado. Arrancamos.' }, { d: -15, s: 'propuesta', t: 'Propuesta enviada', n: '' }, { d: -20, s: 'respondio', t: 'Respondió', n: '' }] },
  { id: 5, name: 'Valeria Ortiz', company: 'Ortiz Joyería', role: 'Directora creativa', email: 'valeria@ortizjoyeria.com', phone: '+52 55 2211 3344', status: 'contactado', channel: 'email', lastContact: -3, nextStep: 2, nextLabel: 'Seguimiento si no responde', value: 0, service: 'E-commerce', tags: ['retail', 'premium'],
    history: [{ d: -3, s: 'contactado', t: 'Correo de presentación', n: 'Envié 2 conceptos de referencia.' }] },
  { id: 6, name: 'Ricardo Salinas', company: 'Taller Nómada', role: 'Fundador', email: 'ricardo@tallernomada.mx', phone: '+52 222 555 0101', status: 'nuevo', channel: 'linkedin', lastContact: null, nextStep: 0, nextLabel: 'Primer contacto', value: 0, service: 'Identidad visual', tags: ['diseño'],
    history: [] },
  { id: 7, name: 'Daniela Fuentes', company: 'Clínica Dental Sonríe', role: 'Administradora', email: 'daniela@sonrie.mx', phone: '+52 55 3030 4040', status: 'perdido', channel: 'llamada', lastContact: -30, nextStep: null, nextLabel: '—', value: 24000, service: 'Sitio + SEO local', tags: ['salud'],
    history: [{ d: -30, s: 'perdido', t: 'Eligió otra agencia', n: 'Motivo: precio. Recontactar en 6 meses.' }, { d: -40, s: 'propuesta', t: 'Propuesta enviada', n: '' }] },
  { id: 8, name: 'Héctor Aguilar', company: 'Aguilar Bienes Raíces', role: 'Director', email: 'hector@aguilarbr.mx', phone: '+52 998 111 2233', status: 'silencio', channel: 'whatsapp', lastContact: -9, nextStep: -1, nextLabel: 'Llamar', value: 0, service: 'Sitio de propiedades', tags: ['inmobiliaria'],
    history: [{ d: -9, s: 'contactado', t: 'WhatsApp', n: 'Leído, sin respuesta.' }, { d: -16, s: 'contactado', t: 'Correo', n: '' }] },
  { id: 9, name: 'Lucía Paredes', company: 'Paredes & Co. Eventos', role: 'Productora', email: 'lucia@paredesco.mx', phone: '+52 55 6060 7070', status: 'propuesta', channel: 'email', lastContact: -4, nextStep: 3, nextLabel: 'Recordatorio de propuesta', value: 45000, service: 'Sitio + galería', tags: ['eventos', 'referido'],
    history: [{ d: -4, s: 'propuesta', t: 'Propuesta enviada', n: '' }, { d: -7, s: 'respondio', t: 'Respondió', n: 'Quiere algo listo para enero.' }] },
  { id: 10, name: 'Tomás Herrera', company: 'Herrera Coffee Roasters', role: 'Co-fundador', email: 'tomas@herreracoffee.com', phone: '+52 55 8080 9090', status: 'contactado', channel: 'instagram', lastContact: -1, nextStep: 4, nextLabel: 'Seguimiento', value: 0, service: 'Tienda en línea', tags: ['café', 'retail'],
    history: [{ d: -1, s: 'contactado', t: 'DM en Instagram', n: '' }] },
  { id: 11, name: 'Fernanda Cruz', company: 'FC Nutrición', role: 'Nutrióloga', email: 'fer@fcnutricion.mx', phone: '+52 55 1212 3434', status: 'cliente', channel: 'whatsapp', lastContact: -10, nextStep: 6, nextLabel: 'Revisión mensual', value: 18000, service: 'Landing + mantenimiento', tags: ['salud', 'recurrente'],
    history: [{ d: -10, s: 'cliente', t: 'Proyecto entregado', n: '' }] },
  { id: 12, name: 'Pablo Ibarra', company: 'Ibarra Motors', role: 'Gerente', email: 'pablo@ibarramotors.mx', phone: '+52 81 9090 1010', status: 'nuevo', channel: 'email', lastContact: null, nextStep: 1, nextLabel: 'Primer contacto', value: 0, service: 'Sitio corporativo', tags: ['automotriz'],
    history: [] },
  { id: 13, name: 'Camila Navarro', company: 'Navarro Interiores', role: 'Diseñadora', email: 'camila@navarrointeriores.mx', phone: '+52 55 4545 6767', status: 'silencio', channel: 'email', lastContact: -18, nextStep: -5, nextLabel: 'Último intento', value: 0, service: 'Portafolio', tags: ['diseño'],
    history: [{ d: -18, s: 'contactado', t: 'Correo', n: '' }, { d: -25, s: 'contactado', t: 'Instagram', n: '' }] },
  { id: 14, name: 'Emilio Reyes', company: 'Reyes Fitness', role: 'Dueño', email: 'emilio@reyesfitness.mx', phone: '+52 55 2323 4545', status: 'respondio', channel: 'whatsapp', lastContact: 0, nextStep: 2, nextLabel: 'Enviar propuesta', value: 30000, service: 'Sitio + membresías', tags: ['wellness'],
    history: [{ d: 0, s: 'respondio', t: 'Respondió', n: 'Pidió cotización.' }, { d: -2, s: 'contactado', t: 'WhatsApp', n: '' }] }
];

let clients = [];
const state = { filter: 'all', query: '', sort: 'recent', view: 'table', openId: null, creating: false };
const $ = sel => document.querySelector(sel);
const money = n => n ? '$' + n.toLocaleString('es-MX') : '—';
const initials = name => name.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
const norm = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const esc = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

// Fechas: Supabase guarda fechas reales; la interfaz trabaja con días relativos a hoy.
const DAY = 864e5;
const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
function toOffset(value) {
  if (!value) return null;
  const d = value.length > 10 ? new Date(value) : new Date(value + 'T00:00:00');
  d.setHours(0, 0, 0, 0);
  return Math.round((d - startOfToday()) / DAY);
}
function toISODate(offset) {
  const d = startOfToday();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fromRow(r) {
  return {
    id: r.id, name: r.name, company: r.company || '', role: r.role || '', email: r.email || '', phone: r.phone || '',
    status: r.status, channel: r.channel, service: r.service || '', value: Number(r.value) || 0,
    lastContact: toOffset(r.last_contact), nextStep: toOffset(r.next_step), nextLabel: r.next_label || '—',
    tags: r.tags || [], notes: r.notes || '',
    history: (r.interactions || [])
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map(i => ({ d: toOffset(i.created_at), s: i.status, t: i.title, n: i.note || '' }))
  };
}

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { t.hidden = true; }, 4000);
}

function relDay(d) {
  if (d === null) return '<span class="muted">Nunca</span>';
  if (d === 0) return 'Hoy';
  if (d === -1) return 'Ayer';
  if (d === 1) return 'Mañana';
  return d < 0 ? `Hace ${-d} días` : `En ${d} días`;
}
function nextHtml(c) {
  if (c.nextStep === null) return '<span class="muted">—</span>';
  const cls = c.nextStep < 0 ? 'due' : c.nextStep === 0 ? 'today' : '';
  const when = c.nextStep < 0 ? `Vencido · ${-c.nextStep}d` : relDay(c.nextStep);
  return `<span class="${cls}">${when}</span><span class="sub">${esc(c.nextLabel)}</span>`;
}
const pill = id => `<span class="pill" style="--c:${statusById[id].color}">${statusById[id].label}</span>`;
const channelHtml = ch => `<span class="channel"><svg viewBox="0 0 24 24">${CHANNELS[ch].icon}</svg>${CHANNELS[ch].label}</span>`;

function visibleClients() {
  const q = norm(state.query.trim());
  let list = clients.filter(c =>
    (state.filter === 'all' || c.status === state.filter) &&
    (!q || norm([c.name, c.company, c.email, c.service, ...c.tags].join(' ')).includes(q))
  );
  const sorters = {
    recent: (a, b) => (b.lastContact ?? -999) - (a.lastContact ?? -999),
    next: (a, b) => (a.nextStep ?? 999) - (b.nextStep ?? 999),
    value: (a, b) => b.value - a.value,
    name: (a, b) => a.name.localeCompare(b.name, 'es')
  };
  return list.sort(sorters[state.sort]);
}

function renderStats() {
  const count = id => clients.filter(c => c.status === id).length;
  const contacted = clients.filter(c => c.status !== 'nuevo').length;
  const replied = clients.filter(c => ['respondio', 'propuesta', 'cliente', 'perdido'].includes(c.status)).length;
  const open = clients.filter(c => c.status === 'propuesta');
  const rate = contacted ? Math.round(replied / contacted * 100) : 0;
  const thisWeek = clients.filter(c => c.lastContact !== null && c.lastContact >= -6 && c.status !== 'nuevo').length;

  $('#kpi-total').textContent = clients.length;
  $('#kpi-contacted').textContent = contacted;
  $('#kpi-week').textContent = '+' + thisWeek;
  $('#kpi-rate').textContent = rate + '%';
  $('#kpi-rate-bar').style.width = rate + '%';
  $('#kpi-silent').textContent = count('silencio');
  $('#kpi-pipeline').textContent = '$' + open.reduce((s, c) => s + c.value, 0).toLocaleString('es-MX');
  $('#kpi-pipeline-count').textContent = `${open.length} propuesta${open.length === 1 ? '' : 's'} en espera`;
  $('#nav-count-all').textContent = clients.length;
  $('#nav-count-prop').textContent = open.length;
  $('#nav-count-due').textContent = clients.filter(c => c.nextStep !== null && c.nextStep <= 0).length;

  $('#pipeline-bar').innerHTML = STATUSES.map(s =>
    `<i style="flex-grow:${count(s.id)};background:${s.color}" title="${s.label}: ${count(s.id)}"></i>`).join('');
  $('#pipeline-legend').innerHTML = STATUSES.map(s =>
    `<span><i class="dot" style="background:${s.color}"></i>${s.label} <b>${count(s.id)}</b></span>`).join('');

  $('#chips').innerHTML = [{ id: 'all', label: 'Todos' }, ...STATUSES].map(s => {
    const n = s.id === 'all' ? clients.length : count(s.id);
    return `<button class="chip${state.filter === s.id ? ' is-active' : ''}" data-filter="${s.id}" role="tab" aria-selected="${state.filter === s.id}">
      ${s.color ? `<i class="dot" style="background:${s.color}"></i>` : ''}${s.label} <em>${n}</em></button>`;
  }).join('');
}

function renderTable(list) {
  $('#rows').innerHTML = list.map(c => `
    <tr data-id="${c.id}">
      <td><div class="who"><span class="avatar">${esc(initials(c.name))}</span><div><strong>${esc(c.name)}</strong><small>${esc(c.company)}</small></div></div></td>
      <td>${pill(c.status)}</td>
      <td>${relDay(c.lastContact)}</td>
      <td>${channelHtml(c.channel)}</td>
      <td class="money">${money(c.value)}</td>
      <td>${nextHtml(c)}</td>
      <td class="row-actions"><button class="icon-btn" aria-label="Más opciones"><svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg></button></td>
    </tr>`).join('');
  $('#empty').hidden = list.length > 0;
}

function renderKanban(list) {
  const lanes = state.filter === 'all' ? STATUSES : [statusById[state.filter]];
  $('#kanban-view').innerHTML = lanes.map(s => {
    const items = list.filter(c => c.status === s.id);
    return `<div class="lane" style="--c:${s.color}">
      <h3>${s.label} <em>${items.length}</em></h3>
      ${items.map(c => `<div class="card" data-id="${c.id}">
        <strong>${esc(c.name)}</strong><small>${esc(c.company)}${c.service ? ' · ' + esc(c.service) : ''}</small>
        <div class="card-foot"><span>${relDay(c.lastContact)}</span><span class="money">${money(c.value)}</span></div>
      </div>`).join('')}
    </div>`;
  }).join('');
}

function render() {
  renderStats();
  const list = visibleClients();
  $('#table-view').hidden = state.view !== 'table';
  $('#kanban-view').hidden = state.view !== 'kanban';
  state.view === 'table' ? renderTable(list) : renderKanban(list);
  if (state.openId) renderDrawer();
}

const findClient = id => clients.find(x => String(x.id) === String(id));

function renderDrawer() {
  const c = findClient(state.openId);
  $('#drawer').innerHTML = `
    <div class="drawer-head">
      <span class="avatar">${esc(initials(c.name))}</span>
      <div><h2>${esc(c.name)}</h2><small>${esc([c.role, c.company].filter(Boolean).join(' · '))}</small></div>
      <button class="icon-btn" data-close aria-label="Cerrar"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
    </div>
    <div class="drawer-body">
      <section class="drawer-section">
        <p class="eyebrow">ESTADO</p>
        <div class="status-picker">${STATUSES.map(s =>
          `<button data-status="${s.id}" style="--c:${s.color}" class="${c.status === s.id ? 'is-active' : ''}">${s.label}</button>`).join('')}</div>
      </section>
      <section class="drawer-section">
        <p class="eyebrow">ACCIONES RÁPIDAS</p>
        <div class="quick">
          <button class="btn btn-dark" data-status="contactado">Registrar contacto</button>
          <button class="btn btn-ghost" data-status="respondio">Marcar respondió</button>
          <button class="btn btn-ghost" data-status="propuesta">Enviar propuesta</button>
          <button class="btn btn-ghost" data-status="silencio">Sin respuesta</button>
        </div>
      </section>
      <section class="drawer-section">
        <p class="eyebrow">DATOS</p>
        <div class="info">
          <div><span>Correo</span><b>${esc(c.email) || '—'}</b></div>
          <div><span>Teléfono</span><b>${esc(c.phone) || '—'}</b></div>
          <div><span>Servicio</span><b>${esc(c.service) || '—'}</b></div>
          <div><span>Propuesta</span><b>${money(c.value)}</b></div>
          <div><span>Canal</span><b>${CHANNELS[c.channel].label}</b></div>
          <div><span>Próximo paso</span><b>${esc(c.nextLabel)}</b></div>
        </div>
      </section>
      ${c.tags.length ? `<section class="drawer-section">
        <p class="eyebrow">ETIQUETAS</p>
        <div class="tags">${c.tags.map(t => `<span class="tag">#${esc(t)}</span>`).join('')}</div>
      </section>` : ''}
      <section class="drawer-section">
        <p class="eyebrow">HISTORIAL</p>
        ${c.history.length ? `<ol class="timeline">${c.history.map(h => `
          <li style="--c:${statusById[h.s]?.color || 'var(--muted)'}"><time>${relDay(h.d).toUpperCase()}</time><strong>${esc(h.t)}</strong>${h.n ? `<p>${esc(h.n)}</p>` : ''}</li>`).join('')}</ol>`
          : '<p class="muted" style="font-size:13px">Aún no hay interacciones registradas.</p>'}
      </section>
      <section class="drawer-section">
        <p class="eyebrow">NOTAS</p>
        <textarea class="note-box" id="note-box" placeholder="Escribe una nota sobre este cliente… se guarda al salir del campo.">${esc(c.notes)}</textarea>
      </section>
    </div>`;
}

function renderNewForm() {
  $('#drawer').innerHTML = `
    <div class="drawer-head">
      <span class="avatar avatar-blue">+</span>
      <div><h2>Nuevo cliente</h2><small>Agrega un prospecto o cliente</small></div>
      <button class="icon-btn" data-close aria-label="Cerrar"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
    </div>
    <form class="drawer-body" id="new-form">
      <div class="form-grid">
        <label class="field span-2"><span>Nombre *</span><input name="name" required></label>
        <label class="field"><span>Empresa</span><input name="company"></label>
        <label class="field"><span>Puesto</span><input name="role"></label>
        <label class="field"><span>Correo</span><input name="email" type="email"></label>
        <label class="field"><span>Teléfono</span><input name="phone" type="tel"></label>
        <label class="field"><span>Estado</span><select name="status">${STATUSES.map(s => `<option value="${s.id}">${s.label}</option>`).join('')}</select></label>
        <label class="field"><span>Canal</span><select name="channel">${Object.entries(CHANNELS).map(([k, v]) => `<option value="${k}"${k === 'whatsapp' ? ' selected' : ''}>${v.label}</option>`).join('')}</select></label>
        <label class="field"><span>Servicio</span><input name="service" placeholder="Sitio web, identidad…"></label>
        <label class="field"><span>Valor propuesta (MXN)</span><input name="value" type="number" min="0" step="100"></label>
        <label class="field"><span>Próximo seguimiento</span><input name="next_step" type="date" value="${toISODate(1)}"></label>
        <label class="field"><span>¿Qué sigue?</span><input name="next_label" placeholder="Primer contacto"></label>
        <label class="field span-2"><span>Etiquetas (separadas por coma)</span><input name="tags" placeholder="restaurante, referido"></label>
        <label class="field span-2"><span>Notas</span><textarea name="notes" class="note-box"></textarea></label>
      </div>
      <button class="btn btn-dark btn-block" type="submit">Guardar cliente <span>→</span></button>
    </form>`;
}

function openDrawer(id) {
  state.openId = id;
  state.creating = false;
  renderDrawer();
  showDrawer();
}
function openNewForm() {
  state.openId = null;
  state.creating = true;
  renderNewForm();
  showDrawer();
  $('#new-form [name=name]').focus();
}
function showDrawer() {
  $('#drawer').classList.add('is-open');
  $('#drawer').setAttribute('aria-hidden', 'false');
  $('#backdrop').hidden = false;
}
function closeDrawer() {
  state.openId = null;
  state.creating = false;
  $('#drawer').classList.remove('is-open');
  $('#drawer').setAttribute('aria-hidden', 'true');
  $('#backdrop').hidden = true;
}

async function setStatus(c, status) {
  const entry = { d: 0, s: status, t: statusById[status].label, n: '' };
  if (db) {
    const { error } = await db.from('clients').update({ status, last_contact: toISODate(0) }).eq('id', c.id);
    if (error) return toast('No se pudo guardar: ' + error.message);
    const { error: histError } = await db.from('interactions').insert({ client_id: c.id, status, title: entry.t });
    if (histError) toast('Estado guardado, pero no el historial: ' + histError.message);
  }
  c.status = status;
  c.lastContact = 0;
  c.history.unshift(entry);
  render();
}

async function saveNotes(c, notes) {
  if (notes === c.notes) return;
  if (db) {
    const { error } = await db.from('clients').update({ notes }).eq('id', c.id);
    if (error) return toast('No se pudo guardar la nota: ' + error.message);
  }
  c.notes = notes;
  toast('Nota guardada');
}

async function createClient(form) {
  const f = Object.fromEntries(new FormData(form));
  const row = {
    name: f.name.trim(), company: f.company.trim() || null, role: f.role.trim() || null,
    email: f.email.trim() || null, phone: f.phone.trim() || null,
    status: f.status, channel: f.channel, service: f.service.trim() || null,
    value: Number(f.value) || 0, next_step: f.next_step || null, next_label: f.next_label.trim() || null,
    tags: f.tags.split(',').map(t => t.trim()).filter(Boolean), notes: f.notes.trim() || null,
    last_contact: f.status === 'nuevo' ? null : toISODate(0)
  };
  const button = form.querySelector('[type=submit]');
  button.disabled = true;
  let client;
  if (db) {
    const { data, error } = await db.from('clients').insert(row).select().single();
    button.disabled = false;
    if (error) return toast('No se pudo crear: ' + error.message);
    client = fromRow(data);
    if (row.status !== 'nuevo') {
      const title = statusById[row.status].label;
      await db.from('interactions').insert({ client_id: client.id, status: row.status, title });
      client.history.unshift({ d: 0, s: row.status, t: title, n: '' });
    }
  } else {
    client = fromRow({ ...row, id: Date.now() });
  }
  clients.push(client);
  render();
  openDrawer(client.id);
  toast('Cliente agregado');
}

$('#search').addEventListener('input', e => { state.query = e.target.value; render(); });
$('#sort').addEventListener('change', e => { state.sort = e.target.value; render(); });
$('#chips').addEventListener('click', e => {
  const b = e.target.closest('[data-filter]');
  if (b) { state.filter = b.dataset.filter; render(); }
});
document.querySelectorAll('.view-toggle button').forEach(b => b.addEventListener('click', () => {
  state.view = b.dataset.view;
  document.querySelectorAll('.view-toggle button').forEach(x => x.classList.toggle('is-active', x === b));
  render();
}));
$('.board').addEventListener('click', e => {
  const row = e.target.closest('[data-id]');
  if (row) openDrawer(row.dataset.id);
});
$('#new-client').addEventListener('click', openNewForm);
$('#drawer').addEventListener('click', e => {
  if (e.target.closest('[data-close]')) return closeDrawer();
  const s = e.target.closest('[data-status]');
  if (!s || !state.openId) return;
  const c = findClient(state.openId);
  if (c.status !== s.dataset.status) setStatus(c, s.dataset.status);
});
$('#drawer').addEventListener('change', e => {
  if (e.target.id === 'note-box' && state.openId) saveNotes(findClient(state.openId), e.target.value.trim());
});
$('#drawer').addEventListener('submit', e => {
  e.preventDefault();
  if (e.target.id === 'new-form') createClient(e.target);
});
$('#backdrop').addEventListener('click', closeDrawer);
$('#menu-btn').addEventListener('click', () => $('#sidebar').classList.toggle('is-open'));
$('#logout').addEventListener('click', async e => {
  if (!db) return;
  e.preventDefault();
  await db.auth.signOut();
  location.replace('login.html');
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeDrawer(); $('#sidebar').classList.remove('is-open'); }
  if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
    e.preventDefault();
    $('#search').focus();
  }
});

async function init() {
  if (!db) {
    clients = DEMO;
    $('#demo-banner').hidden = false;
    return render();
  }
  const { data: { session } } = await db.auth.getSession();
  if (!session) return location.replace('login.html');
  $('#user-email').textContent = session.user.email;
  render();
  const { data, error } = await db.from('clients').select('*, interactions(*)').order('created_at');
  if (error) return toast('Error al cargar clientes: ' + error.message);
  clients = data.map(fromRow);
  render();
}

init();
