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
const state = { filter: 'all', query: '', sort: 'recent', view: 'table', openId: null, creating: false, email: '', shownView: null };
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
    website: r.website || '', address: r.address || '', placeId: r.place_id || '', mapsUrl: r.maps_url || '',
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

const VIEWS = {
  prospectar: { title: 'Buscar prospectos', eyebrow: 'CRM · NEGOCIOS EN TU ZONA' },
  clientes: { title: 'Clientes', eyebrow: 'CRM · CLIENTES Y PROSPECTOS' },
  propuestas: { title: 'Propuestas', eyebrow: 'CRM · COTIZACIONES ENVIADAS' },
  seguimientos: { title: 'Seguimientos', eyebrow: 'CRM · AGENDA DE CONTACTO' },
  reportes: { title: 'Reportes', eyebrow: 'CRM · MÉTRICAS DEL EMBUDO' },
  ajustes: { title: 'Ajustes', eyebrow: 'CRM · CUENTA Y PREFERENCIAS' }
};
const currentView = () => VIEWS[location.hash.slice(1)] ? location.hash.slice(1) : 'clientes';

function render() {
  const view = currentView();
  renderStats();
  document.body.dataset.view = view;
  document.querySelectorAll('.view').forEach(v => { v.hidden = v.dataset.view !== view; });
  document.querySelectorAll('[data-nav]').forEach(a => a.classList.toggle('is-active', a.dataset.nav === view));
  $('#view-title').textContent = VIEWS[view].title;
  $('#view-eyebrow').textContent = VIEWS[view].eyebrow;

  if (view === 'clientes') {
    const list = visibleClients();
    $('#table-view').hidden = state.view !== 'table';
    $('#kanban-view').hidden = state.view !== 'kanban';
    state.view === 'table' ? renderTable(list) : renderKanban(list);
  }
  if (view === 'propuestas') renderProposals();
  if (view === 'seguimientos') renderFollowups();
  if (view === 'reportes') renderReports();
  if (view === 'prospectar' && typeof renderProspects === 'function') renderProspects();
  // Ajustes solo se pinta al entrar, para no borrar lo que se está escribiendo
  if (view === 'ajustes' && state.shownView !== 'ajustes') renderSettings();
  state.shownView = view;
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
          ${c.website ? `<div class="span-2"><span>Sitio web</span><b><a class="inline-link" href="${esc(c.website)}" target="_blank" rel="noopener">${esc(c.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''))}</a></b></div>` : ''}
          ${c.address ? `<div class="span-2"><span>Dirección</span><b>${esc(c.address)}${c.mapsUrl ? ` · <a class="inline-link" href="${esc(c.mapsUrl)}" target="_blank" rel="noopener">Ver en Maps</a>` : ''}</b></div>` : ''}
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

// Guarda cambios de un cliente (columnas de Supabase) y, si hay título, lo anota en su historial
async function updateClient(c, patch, title) {
  const status = patch.status || c.status;
  if (db) {
    const { error } = await db.from('clients').update(patch).eq('id', c.id);
    if (error) return toast('No se pudo guardar: ' + error.message);
    if (title) {
      const { error: histError } = await db.from('interactions').insert({ client_id: c.id, status, title });
      if (histError) toast('Cambio guardado, pero no el historial: ' + histError.message);
    }
  }
  c.status = status;
  if ('last_contact' in patch) c.lastContact = toOffset(patch.last_contact);
  if ('next_step' in patch) c.nextStep = toOffset(patch.next_step);
  if ('next_label' in patch) c.nextLabel = patch.next_label || '—';
  if (title) c.history.unshift({ d: 0, s: status, t: title, n: '' });
  render();
}

const setStatus = (c, status) => updateClient(c, { status, last_contact: toISODate(0) }, statusById[status].label);

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

// ---------- Acciones compartidas ----------
const waLink = c => c.phone ? 'https://wa.me/' + c.phone.replace(/\D/g, '') : '';
const contactButtons = c => [
  waLink(c) && `<a class="mini-btn" href="${waLink(c)}" target="_blank" rel="noopener" title="WhatsApp" aria-label="Abrir WhatsApp"><svg viewBox="0 0 24 24">${CHANNELS.whatsapp.icon}</svg></a>`,
  c.email && `<a class="mini-btn" href="mailto:${esc(c.email)}" title="Correo" aria-label="Enviar correo"><svg viewBox="0 0 24 24">${CHANNELS.email.icon}</svg></a>`
].filter(Boolean).join('');

function handleAction(act, el) {
  const holder = el.closest('[data-id]');
  const c = holder && findClient(holder.dataset.id);
  if (act === 'won') return updateClient(c, { status: 'cliente', last_contact: toISODate(0) }, 'Propuesta aceptada');
  if (act === 'lost') return updateClient(c, { status: 'perdido', last_contact: toISODate(0), next_step: null, next_label: null }, 'Propuesta rechazada');
  if (act === 'done') return updateClient(c, { last_contact: toISODate(0), next_step: null, next_label: null }, 'Seguimiento: ' + c.nextLabel);
  if (act === 'snooze') return updateClient(c, { next_step: toISODate(Math.max(c.nextStep ?? 0, 0) + 3) });
  if (act === 'copy') {
    const text = $('#tpl-' + el.dataset.key).value;
    navigator.clipboard?.writeText(text).then(() => toast('Plantilla copiada'), () => toast('No se pudo copiar'));
  }
  if (act === 'export') return exportCsv();
  if (act === 'logout') return logout();
}

const kpiHtml = (label, value, note, dark) =>
  `<article class="kpi${dark ? ' kpi-dark' : ''}"><p>${label}</p><strong>${value}</strong><small>${note}</small></article>`;
const sumValue = list => '$' + list.reduce((s, c) => s + c.value, 0).toLocaleString('es-MX');
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const shortMonth = d => d.toLocaleString('es-MX', { month: 'short' }).replace('.', '');

// ---------- Propuestas ----------
function renderProposals() {
  const open = clients.filter(c => c.status === 'propuesta');
  const won = clients.filter(c => c.status === 'cliente');
  const lost = clients.filter(c => c.status === 'perdido' && c.value);
  const closeRate = won.length + lost.length ? Math.round(won.length / (won.length + lost.length) * 100) : 0;
  const sentEntry = c => c.history.find(h => h.s === 'propuesta');
  const stale = open.filter(c => sentEntry(c) && sentEntry(c).d <= -7);

  const card = c => {
    const sent = sentEntry(c);
    const age = sent ? -sent.d : 0;
    return `<article class="prop-card" data-id="${c.id}" style="--c:${statusById[c.status].color}">
      <div class="prop-top">
        <div><strong>${esc(c.name)}</strong><small>${esc(c.company) || '—'}</small></div>
        <span class="prop-amount">${money(c.value)}</span>
      </div>
      <p class="prop-service">${esc(c.service) || 'Servicio sin definir'}</p>
      <div class="prop-meta">
        <span>${sent ? 'Enviada ' + relDay(sent.d).toLowerCase() : 'Sin fecha de envío'}</span>
        ${c.status === 'propuesta' && age >= 7 ? `<span class="badge-warn">${age} días sin respuesta</span>` : ''}
      </div>
      ${c.status === 'propuesta' ? `<div class="prop-actions">
        ${contactButtons(c)}
        <button class="btn btn-ghost btn-sm" data-act="lost">Perdida</button>
        <button class="btn btn-dark btn-sm" data-act="won">Ganada</button>
      </div>` : ''}
    </article>`;
  };
  const column = (title, color, list) => `<section class="prop-col">
    <h3><i class="dot" style="background:${color}"></i>${title} <em>${list.length} · ${sumValue(list)}</em></h3>
    ${list.length ? [...list].sort((a, b) => b.value - a.value).map(card).join('') : '<p class="col-empty">Nada por aquí todavía.</p>'}
  </section>`;

  $('#view-propuestas').innerHTML = `
    <section class="kpis kpis-4">
      ${kpiHtml('En espera', sumValue(open), plural(open.length, 'propuesta') + ' abierta' + (open.length === 1 ? '' : 's'), true)}
      ${kpiHtml('Ganadas', sumValue(won), plural(won.length, 'cliente'))}
      ${kpiHtml('Tasa de cierre', closeRate + '%', 'ganadas vs. perdidas')}
      ${kpiHtml('Por reactivar', stale.length, 'más de 7 días sin respuesta')}
    </section>
    <div class="prop-cols">
      ${column('En espera', statusById.propuesta.color, open)}
      ${column('Ganadas', statusById.cliente.color, won)}
      ${column('Perdidas', statusById.perdido.color, lost)}
    </div>`;
}

// ---------- Seguimientos ----------
function renderFollowups() {
  const items = clients.filter(c => c.nextStep !== null && c.status !== 'perdido').sort((a, b) => a.nextStep - b.nextStep);
  const groups = [
    { title: 'Vencidos', tone: 'due', test: d => d < 0 },
    { title: 'Hoy', tone: 'today', test: d => d === 0 },
    { title: 'Mañana', tone: '', test: d => d === 1 },
    { title: 'Próximos 7 días', tone: '', test: d => d > 1 && d <= 7 },
    { title: 'Más adelante', tone: '', test: d => d > 7 }
  ].map(g => ({ ...g, list: items.filter(c => g.test(c.nextStep)) }));
  const noDate = clients.filter(c => c.nextStep === null && !['cliente', 'perdido'].includes(c.status));

  const row = c => {
    const date = startOfToday();
    date.setDate(date.getDate() + c.nextStep);
    const tone = c.nextStep < 0 ? 'due' : c.nextStep === 0 ? 'today' : '';
    return `<div class="fu-item" data-id="${c.id}">
      <div class="fu-date ${tone}"><b>${date.getDate()}</b><span>${shortMonth(date)}</span></div>
      <div class="fu-main">
        <strong>${esc(c.nextLabel)}</strong>
        <small>${esc(c.name)}${c.company ? ' · ' + esc(c.company) : ''} · ${c.nextStep < 0 ? `<span class="due">vencido hace ${-c.nextStep} d</span>` : relDay(c.nextStep)}</small>
      </div>
      <div class="fu-status">${pill(c.status)}</div>
      <div class="fu-actions">
        ${contactButtons(c)}
        <button class="mini-btn mini-text" data-act="snooze" title="Posponer 3 días">+3d</button>
        <button class="btn btn-dark btn-sm" data-act="done">Hecho</button>
      </div>
    </div>`;
  };

  $('#view-seguimientos').innerHTML = `
    <div class="fu-summary">
      ${groups.slice(0, 4).map(g => `<div class="fu-stat ${g.tone}"><strong>${g.list.length}</strong><span>${g.title}</span></div>`).join('')}
    </div>
    <div class="fu-board">
      ${items.length ? groups.filter(g => g.list.length).map(g => `
        <section class="fu-group">
          <h3 class="${g.tone}">${g.title} <em>${g.list.length}</em></h3>
          ${g.list.map(row).join('')}
        </section>`).join('') : '<div class="empty"><strong>Todo al día</strong><p>No tienes seguimientos programados.</p></div>'}
      ${noDate.length ? `<section class="fu-group">
          <h3>Sin fecha <em>${noDate.length}</em></h3>
          <p class="col-empty">Prospectos sin próximo paso: ${noDate.map(c => `<a href="#" data-id="${c.id}" class="inline-link">${esc(c.name)}</a>`).join(', ')}.</p>
        </section>` : ''}
    </div>`;
}

// ---------- Reportes ----------
function hbars(rows, max) {
  return `<div class="hbars">${rows.map(r => `
    <div class="hbar" data-tip="${esc(r.label)}: ${esc(r.display)}">
      <span class="hbar-label">${r.dot ? `<i class="dot" style="background:${r.dot}"></i>` : ''}${esc(r.label)}</span>
      <span class="hbar-track"><i style="width:${max ? Math.max(r.value / max * 100, r.value ? 1.5 : 0) : 0}%;background:${r.color || 'var(--blue)'}"></i></span>
      <span class="hbar-value">${r.display}</span>
    </div>`).join('')}</div>`;
}

function renderReports() {
  const total = clients.length;
  const repliedStates = ['respondio', 'propuesta', 'cliente', 'perdido'];
  const contacted = clients.filter(c => c.status !== 'nuevo');
  const answered = clients.filter(c => repliedStates.includes(c.status));
  const proposed = clients.filter(c => ['propuesta', 'cliente'].includes(c.status) || (c.status === 'perdido' && c.value));
  const won = clients.filter(c => c.status === 'cliente');
  const pct = n => total ? Math.round(n / total * 100) : 0;

  const funnel = [
    ['En cartera', total], ['Contactados', contacted.length], ['Respondieron', answered.length],
    ['Recibieron propuesta', proposed.length], ['Clientes', won.length]
  ].map(([label, value]) => ({ label, value, display: `${value} · ${pct(value)}%` }));

  const channels = Object.entries(CHANNELS).map(([id, ch]) => {
    const reached = contacted.filter(c => c.channel === id);
    const ok = reached.filter(c => repliedStates.includes(c.status)).length;
    const rate = reached.length ? Math.round(ok / reached.length * 100) : 0;
    return { label: ch.label, value: rate, display: reached.length ? `${rate}% · ${ok}/${reached.length}` : 'sin datos' };
  }).sort((a, b) => b.value - a.value);

  // 8 semanas: la última termina hoy
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const to = -(7 - i) * 7, from = to - 6;
    const start = startOfToday();
    start.setDate(start.getDate() + from);
    const n = clients.reduce((s, c) => s + c.history.filter(h => h.d >= from && h.d <= to).length, 0);
    return { n, label: `${start.getDate()} ${shortMonth(start)}` };
  });
  const maxWeek = Math.max(...weeks.map(w => w.n), 1);

  const valueRows = ['propuesta', 'cliente', 'perdido'].map(id => {
    const v = clients.filter(c => c.status === id).reduce((s, c) => s + c.value, 0);
    return { label: statusById[id].label, value: v, display: money(v), color: statusById[id].color, dot: statusById[id].color };
  });
  const avgTicket = won.length ? money(Math.round(won.reduce((s, c) => s + c.value, 0) / won.length)) : '—';

  $('#view-reportes').innerHTML = `
    <section class="kpis kpis-4">
      ${kpiHtml('Tasa de respuesta', (contacted.length ? Math.round(answered.length / contacted.length * 100) : 0) + '%', `${answered.length} de ${contacted.length} contactados`)}
      ${kpiHtml('Conversión total', pct(won.length) + '%', 'de cartera a cliente')}
      ${kpiHtml('Ticket promedio', avgTicket, 'por cliente ganado')}
      ${kpiHtml('Ingreso ganado', sumValue(won), plural(won.length, 'cliente'), true)}
    </section>
    <div class="report-grid">
      <section class="panel">
        <div class="panel-head"><h2>Embudo de conversión</h2><span class="eyebrow">CLIENTES · % DE LA CARTERA</span></div>
        ${hbars(funnel, total)}
      </section>
      <section class="panel">
        <div class="panel-head"><h2>Respuesta por canal</h2><span class="eyebrow">% QUE RESPONDIÓ</span></div>
        ${hbars(channels, 100)}
      </section>
      <section class="panel">
        <div class="panel-head"><h2>Actividad semanal</h2><span class="eyebrow">INTERACCIONES · 8 SEMANAS</span></div>
        <div class="vbars">${weeks.map((w, i) => `
          <div class="vbar${i === 7 ? ' is-current' : ''}" data-tip="Semana del ${w.label}: ${w.n} ${w.n === 1 ? 'interacción' : 'interacciones'}">
            <span class="vbar-value">${w.n || ''}</span>
            <span class="vbar-col"><i style="height:${w.n / maxWeek * 100}%"></i></span>
            <span class="vbar-label">${w.label}</span>
          </div>`).join('')}</div>
      </section>
      <section class="panel">
        <div class="panel-head"><h2>Valor por estado</h2><span class="eyebrow">MXN</span></div>
        ${hbars(valueRows, Math.max(...valueRows.map(r => r.value), 1))}
      </section>
    </div>`;
}

// ---------- Ajustes ----------
// Las plantillas se guardan en este navegador (localStorage) por ahora.
const DEFAULT_TEMPLATES = {
  primer: { title: 'Primer contacto', text: 'Hola {nombre}, soy de Orion Studio. Vi el trabajo de {empresa} y creo que podemos ayudarles con su presencia digital. ¿Te puedo compartir algunas ideas?' },
  seguimiento: { title: 'Seguimiento', text: 'Hola {nombre}, te escribo para dar seguimiento a mi mensaje anterior. ¿Tuviste oportunidad de revisarlo? Quedo atento.' },
  propuesta: { title: 'Envío de propuesta', text: 'Hola {nombre}, te comparto la propuesta para {servicio}. Cualquier duda la revisamos en una llamada corta.' }
};
function loadTemplates() {
  try { return { ...DEFAULT_TEMPLATES, ...JSON.parse(localStorage.getItem('orion-templates') || '{}') }; }
  catch { return DEFAULT_TEMPLATES; }
}
function saveTemplates() {
  const data = {};
  Object.entries(DEFAULT_TEMPLATES).forEach(([key, t]) => { data[key] = { title: t.title, text: $('#tpl-' + key).value }; });
  try { localStorage.setItem('orion-templates', JSON.stringify(data)); toast('Plantillas guardadas'); }
  catch { toast('No se pudieron guardar en este navegador'); }
}

function renderSettings() {
  const tpl = loadTemplates();
  $('#view-ajustes').innerHTML = `
    <div class="settings-grid">
      <section class="panel">
        <div class="panel-head"><h2>Cuenta</h2></div>
        <div class="info">
          <div><span>Correo</span><b>${esc(state.email) || 'Modo demo'}</b></div>
          <div><span>Rol</span><b>Administrador</b></div>
        </div>
        <button class="btn btn-ghost panel-btn" data-act="logout">Cerrar sesión</button>
      </section>
      <section class="panel">
        <div class="panel-head"><h2>Cambiar contraseña</h2></div>
        <form id="pw-form">
          <label class="field"><span>Nueva contraseña</span><input type="password" name="password" minlength="8" required autocomplete="new-password"></label>
          <label class="field"><span>Confirmar contraseña</span><input type="password" name="confirm" minlength="8" required autocomplete="new-password"></label>
          <button class="btn btn-dark" type="submit">Actualizar contraseña</button>
        </form>
      </section>
      <section class="panel span-2">
        <div class="panel-head"><h2>Plantillas de mensajes</h2><span class="eyebrow">USA {NOMBRE} · {EMPRESA} · {SERVICIO}</span></div>
        <div class="tpl-grid">${Object.keys(DEFAULT_TEMPLATES).map(key => `
          <div class="tpl">
            <div class="tpl-head"><strong>${esc(tpl[key].title)}</strong><button class="mini-btn mini-text" data-act="copy" data-key="${key}">Copiar</button></div>
            <textarea class="note-box" id="tpl-${key}" data-template="${key}">${esc(tpl[key].text)}</textarea>
          </div>`).join('')}</div>
      </section>
      <section class="panel span-2">
        <div class="panel-head"><h2>Datos</h2></div>
        <p class="panel-text">Descarga todos tus clientes en un archivo que abre Excel o Google Sheets.</p>
        <div class="settings-actions">
          <button class="btn btn-dark" data-act="export">Exportar clientes (CSV)</button>
          <button class="btn btn-ghost" disabled>Importar CSV · próximamente</button>
        </div>
      </section>
    </div>`;
}

async function changePassword(form) {
  const { password, confirm } = Object.fromEntries(new FormData(form));
  if (password !== confirm) return toast('Las contraseñas no coinciden');
  if (!db) return toast('En modo demo no se puede cambiar la contraseña');
  const { error } = await db.auth.updateUser({ password });
  if (error) return toast('No se pudo cambiar: ' + error.message);
  form.reset();
  toast('Contraseña actualizada');
}

function exportCsv() {
  const cols = ['Nombre', 'Empresa', 'Puesto', 'Correo', 'Teléfono', 'Estado', 'Canal', 'Servicio', 'Valor', 'Último contacto', 'Próximo seguimiento', 'Próximo paso', 'Etiquetas', 'Notas', 'Sitio web', 'Dirección'];
  const dateOf = d => d === null ? '' : toISODate(d);
  const rows = clients.map(c => [c.name, c.company, c.role, c.email, c.phone, statusById[c.status].label, CHANNELS[c.channel].label,
    c.service, c.value, dateOf(c.lastContact), dateOf(c.nextStep), c.nextLabel === '—' ? '' : c.nextLabel, c.tags.join(', '), c.notes || '', c.website || '', c.address || '']);
  const csv = [cols, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
  a.download = `clientes-orion-${toISODate(0)}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
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
$('#views').addEventListener('click', e => {
  const act = e.target.closest('[data-act]');
  if (act) return handleAction(act.dataset.act, act);
  const item = e.target.closest('[data-id]');
  if (!item) return;
  if (e.target.closest('a:not([data-id]), input, textarea, select')) return;
  e.preventDefault();
  openDrawer(item.dataset.id);
});
$('#views').addEventListener('submit', e => {
  e.preventDefault();
  if (e.target.id === 'pw-form') changePassword(e.target);
});
$('#views').addEventListener('change', e => {
  if (e.target.dataset.template) saveTemplates();
});
document.querySelectorAll('[data-nav]').forEach(a => a.addEventListener('click', () => $('#sidebar').classList.remove('is-open')));
window.addEventListener('hashchange', render);
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
// En móvil, tocar fuera del menú lo cierra (y ese toque no activa lo que hay debajo)
document.addEventListener('click', e => {
  const sidebar = $('#sidebar');
  if (sidebar.classList.contains('is-open') && !sidebar.contains(e.target) && !e.target.closest('#menu-btn')) {
    sidebar.classList.remove('is-open');
    e.preventDefault();
    e.stopPropagation();
  }
}, true);
async function logout() {
  if (db) await db.auth.signOut();
  location.replace('login.html');
}
$('#logout').addEventListener('click', e => {
  e.preventDefault();
  logout();
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
  state.email = session.user.email;
  $('#user-email').textContent = session.user.email;
  render();
  const { data, error } = await db.from('clients').select('*, interactions(*)').order('created_at');
  if (error) return toast('Error al cargar clientes: ' + error.message);
  clients = data.map(fromRow);
  render();
}

init();
