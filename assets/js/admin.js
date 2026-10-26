// Orion CRM — maqueta de diseño con datos de ejemplo (sin backend todavía).

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

// lastContact / nextStep en días relativos a hoy (negativo = pasado)
let clients = [
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

const state = { filter: 'all', query: '', sort: 'recent', view: 'table', openId: null };
const $ = sel => document.querySelector(sel);
const money = n => n ? '$' + n.toLocaleString('es-MX') : '—';
const initials = name => name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

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
  return `<span class="${cls}">${when}</span><span class="sub">${c.nextLabel}</span>`;
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

  $('#kpi-total').textContent = clients.length;
  $('#kpi-contacted').textContent = contacted;
  $('#kpi-rate').textContent = rate + '%';
  $('#kpi-rate-bar').style.width = rate + '%';
  $('#kpi-silent').textContent = count('silencio');
  $('#kpi-pipeline').textContent = money(open.reduce((s, c) => s + c.value, 0));
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
      <td><div class="who"><span class="avatar">${initials(c.name)}</span><div><strong>${c.name}</strong><small>${c.company}</small></div></div></td>
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
        <strong>${c.name}</strong><small>${c.company} · ${c.service}</small>
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

function renderDrawer() {
  const c = clients.find(x => x.id === state.openId);
  $('#drawer').innerHTML = `
    <div class="drawer-head">
      <span class="avatar">${initials(c.name)}</span>
      <div><h2>${c.name}</h2><small>${c.role} · ${c.company}</small></div>
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
          <div><span>Correo</span><b>${c.email}</b></div>
          <div><span>Teléfono</span><b>${c.phone}</b></div>
          <div><span>Servicio</span><b>${c.service}</b></div>
          <div><span>Propuesta</span><b>${money(c.value)}</b></div>
          <div><span>Canal</span><b>${CHANNELS[c.channel].label}</b></div>
          <div><span>Próximo paso</span><b>${c.nextLabel}</b></div>
        </div>
      </section>
      <section class="drawer-section">
        <p class="eyebrow">ETIQUETAS</p>
        <div class="tags">${c.tags.map(t => `<span class="tag">#${t}</span>`).join('')}</div>
      </section>
      <section class="drawer-section">
        <p class="eyebrow">HISTORIAL</p>
        ${c.history.length ? `<ol class="timeline">${c.history.map(h => `
          <li style="--c:${statusById[h.s].color}"><time>${relDay(h.d).toUpperCase()}</time><strong>${h.t}</strong>${h.n ? `<p>${h.n}</p>` : ''}</li>`).join('')}</ol>`
          : '<p class="muted" style="font-size:13px">Aún no hay interacciones registradas.</p>'}
      </section>
      <section class="drawer-section">
        <p class="eyebrow">NOTA RÁPIDA</p>
        <textarea class="note-box" placeholder="Escribe una nota sobre este cliente…"></textarea>
      </section>
    </div>`;
}

function openDrawer(id) {
  state.openId = id;
  renderDrawer();
  $('#drawer').classList.add('is-open');
  $('#drawer').setAttribute('aria-hidden', 'false');
  $('#backdrop').hidden = false;
}
function closeDrawer() {
  state.openId = null;
  $('#drawer').classList.remove('is-open');
  $('#drawer').setAttribute('aria-hidden', 'true');
  $('#backdrop').hidden = true;
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
document.addEventListener('click', e => {
  const row = e.target.closest('[data-id]');
  if (row) openDrawer(Number(row.dataset.id));
});
$('#drawer').addEventListener('click', e => {
  if (e.target.closest('[data-close]')) return closeDrawer();
  const s = e.target.closest('[data-status]');
  if (!s) return;
  const c = clients.find(x => x.id === state.openId);
  if (c.status === s.dataset.status) return;
  c.status = s.dataset.status;
  c.lastContact = 0;
  c.history.unshift({ d: 0, s: c.status, t: statusById[c.status].label, n: '' });
  render();
});
$('#backdrop').addEventListener('click', closeDrawer);
$('#menu-btn').addEventListener('click', () => $('#sidebar').classList.toggle('is-open'));
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeDrawer(); $('#sidebar').classList.remove('is-open'); }
  if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
    e.preventDefault();
    $('#search').focus();
  }
});

render();
