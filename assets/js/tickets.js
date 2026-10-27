// Orion CRM — tickets (comprobantes de pago) que se comparten con el cliente por enlace.
// Dos tipos: pago de la página web (anticipo 50% + finiquito 50%) y mensualidad (un ticket por mes).
// Cada ticket guarda el precio con el que se contrató; el catálogo de planes (Ajustes) solo prellena.
// Depende de admin.js (clients, db, state, render, toast, esc, kpiHtml, findClient, toISODate…).

const tickets = { list: [], plans: [], plansMissing: false, loaded: false, loading: false };
const DEFAULT_PLANS = ['Básico', 'Recomendado', 'Activo'];
const PAY_METHODS = ['Transferencia', 'Efectivo', 'Tarjeta', 'Depósito'];

const mxn = n => Number(n || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
const folioOf = t => '#' + String(t.folio).padStart(4, '0');
const paidOf = t => t.payments.reduce((s, p) => s + Number(p.amount || 0), 0);
const dueOf = t => Math.max(t.total - paidOf(t), 0);
const round2 = n => Math.round(n * 100) / 100;
const itemsTotal = items => round2(items.reduce((s, i) => s + i.qty * i.price, 0));
const thisPeriod = () => toISODate(0).slice(0, 7);
const periodLabel = p => p ? new Date(+p.slice(0, 4), +p.slice(5, 7) - 1, 1).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }).replace(' de ', ' ') : '';
const nextPeriod = p => { const d = new Date(+p.slice(0, 4), +p.slice(5, 7), 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };
// Qué se está cobrando, en una línea: "Página web · Recomendado" / "Mensualidad noviembre 2026 · Básico"
const ticketTitle = t => t.kind === 'web' ? `Página web · ${t.plan}`
  : t.kind === 'mensualidad' ? `Mensualidad ${periodLabel(t.period)} · ${t.plan}` : t.plan;
const ticketStatus = t => {
  const paid = paidOf(t);
  if (t.total > 0 && paid >= t.total) return { label: 'Pagado', color: 'var(--st-respondio)' };
  if (paid > 0) return { label: t.kind === 'web' ? 'Anticipo pagado' : 'Pago parcial', color: 'var(--st-silencio)' };
  return { label: 'Pendiente', color: 'var(--st-nuevo)' };
};
const ticketPill = t => { const s = ticketStatus(t); return `<span class="pill" style="--c:${s.color}">${s.label}</span>`; };
const ticketUrl = t => new URL(db ? `../ticket.html?t=${t.token}` : '../ticket.html?demo=1', location.href).href;
const shortDate = v => new Date(v.length > 10 ? v : v + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
const fromReceipt = r => ({
  ...r, total: Number(r.total) || 0, items: r.items || [], payments: r.payments || [],
  monthly_price: r.monthly_price == null ? null : Number(r.monthly_price)
});
// El concepto principal del ticket (la página o la mensualidad); el resto son extras
const mainItem = (kind, plan, price, period) => kind === 'web'
  ? { concept: `Página web · Plan ${plan}`, qty: 1, price, main: true }
  : { concept: `Mensualidad ${periodLabel(period)} · Plan ${plan}`, qty: 1, price, main: true };
const extrasOf = t => t.items.filter(i => !i.main && !i.plan);
// Nombre del pago según el tipo: anticipo / finiquito para la página web
function paymentLabel(t, amount) {
  if (t.kind === 'mensualidad') return 'Mensualidad';
  if (t.kind !== 'web') return '';
  const before = paidOf(t);
  if (before === 0) return amount >= t.total ? 'Pago completo' : 'Anticipo';
  return amount >= dueOf(t) ? 'Finiquito' : 'Abono';
}
// WhatsApp del cliente a partir de su contacto (10 dígitos → +52)
function contactWa(contact) {
  const d = (contact || '').replace(/\D/g, '');
  if (d.length === 10) return '52' + d;
  return d.length >= 12 ? d : '';
}
const missingColumns = error => /kind|period|monthly_price|months|schema cache/i.test(error.message)
  ? 'Falta actualizar la base: corre supabase/migrations/005_tipo_ticket.sql en Supabase' : null;

async function loadTickets() {
  if (tickets.loading || tickets.loaded) return;
  tickets.loading = true;
  if (db) {
    const [receipts, plans] = await Promise.all([
      db.from('receipts').select('*').order('created_at', { ascending: false }),
      db.from('plans').select('*').order('sort')
    ]);
    tickets.loading = false;
    if (receipts.error) {
      $('#view-tickets').innerHTML = `<div class="empty"><strong>No se pudieron cargar los tickets</strong><p>${/receipts|schema cache|does not exist/i.test(receipts.error.message)
        ? 'Falta crear la tabla: corre <code>supabase/migrations/003_tickets.sql</code> en Supabase.' : esc(receipts.error.message)}</p></div>`;
      return;
    }
    tickets.list = receipts.data.map(fromReceipt);
    tickets.plansMissing = Boolean(plans.error);
    tickets.plans = plans.error ? DEFAULT_PLANS.map((name, i) => ({ id: null, name, monthly_price: 0, sort: i + 1 }))
      : plans.data.map(p => ({ ...p, monthly_price: Number(p.monthly_price) || 0 }));
  } else {
    const today = toISODate(0);
    tickets.plans = [{ id: 1, name: 'Básico', monthly_price: 1200, sort: 1 }, { id: 2, name: 'Recomendado', monthly_price: 2000, sort: 2 }, { id: 3, name: 'Activo', monthly_price: 3500, sort: 3 }];
    tickets.list = [
      fromReceipt({ id: 'demo-t2', token: 'demo', folio: 2, kind: 'web', created_at: new Date().toISOString(), client_id: 4, client_name: 'Jorge Méndez', client_contact: '+52 55 7788 9900', plan: 'Activo', items: [mainItem('web', 'Activo', 18000)], total: 18000, payments: [{ date: today, amount: 9000, method: 'Transferencia', label: 'Anticipo' }], notes: 'El 50% restante se paga al entregar la página.' }),
      fromReceipt({ id: 'demo-t1', token: 'demo', folio: 1, kind: 'mensualidad', period: thisPeriod(), created_at: new Date(Date.now() - 12 * 864e5).toISOString(), client_id: 11, client_name: 'Fernanda Cruz', client_contact: '+52 55 1212 3434', plan: 'Básico', monthly_price: 1200, items: [mainItem('mensualidad', 'Básico', 1200, thisPeriod())], total: 1200, payments: [{ date: today, amount: 1200, method: 'Efectivo', label: 'Mensualidad' }], notes: '' })
    ];
    tickets.loading = false;
  }
  tickets.loaded = true;
  render();
  if (currentView() === 'ajustes') renderPlansPanel();
}

// ---------- Lista ----------
function renderTickets() {
  const view = $('#view-tickets');
  if (!tickets.loaded) {
    if (!view.innerHTML.trim()) view.innerHTML = '<div class="empty"><strong>Cargando tickets…</strong></div>';
    if (!db || state.email) loadTickets();
    return;
  }
  const list = tickets.list;
  const collected = list.reduce((s, t) => s + paidOf(t), 0);
  const pending = list.reduce((s, t) => s + dueOf(t), 0);
  const withDue = list.filter(t => dueOf(t) > 0).length;
  const monthlyNow = list.filter(t => t.kind === 'mensualidad' && t.period === thisPeriod());
  view.innerHTML = `
    <section class="kpis kpis-4">
      ${kpiHtml('Cobrado', mxn(collected), `${list.length} ticket${list.length === 1 ? '' : 's'}`, true)}
      ${kpiHtml('Por cobrar', mxn(pending), `${withDue} con saldo pendiente`)}
      ${kpiHtml(`Mensualidades ${periodLabel(thisPeriod()).split(' ')[0]}`, mxn(monthlyNow.reduce((s, t) => s + paidOf(t), 0)), `${monthlyNow.length} ticket${monthlyNow.length === 1 ? '' : 's'} este mes`)}
      ${kpiHtml('Páginas web', list.filter(t => t.kind === 'web').length, `${list.filter(t => t.kind === 'web' && dueOf(t) > 0).length} con finiquito pendiente`)}
    </section>
    <section class="board">
      <div class="board-toolbar">
        <h2 class="board-title">Comprobantes de pago</h2>
        <button class="btn btn-dark btn-sm" data-tact="new">+ Nuevo ticket</button>
      </div>
      ${list.length ? `<div class="table-wrap"><table class="table">
        <thead><tr><th>Cliente</th><th>Estado</th><th>Concepto</th><th>Total</th><th>Saldo</th><th>Fecha</th><th aria-label="Compartir"></th></tr></thead>
        <tbody>${list.map(t => `
          <tr data-ticket="${t.id}">
            <td><div class="who"><span class="avatar">${esc(folioOf(t).slice(-2))}</span><div><strong>${esc(t.client_name)}</strong><small>${folioOf(t)}</small></div></div></td>
            <td>${ticketPill(t)}</td>
            <td>${t.kind ? `<span class="kind-tag kind-${t.kind}">${t.kind === 'web' ? 'Página web' : 'Mensualidad'}</span>` : ''}${esc(t.kind === 'mensualidad' ? periodLabel(t.period) : t.plan)}<span class="sub">${t.kind ? 'Plan ' + esc(t.plan) : ''}</span></td>
            <td class="money">${mxn(t.total)}</td>
            <td class="money${dueOf(t) ? ' due-amount' : ''}">${dueOf(t) ? mxn(dueOf(t)) : '—'}</td>
            <td class="muted">${shortDate(t.created_at)}</td>
            <td class="row-actions"><a class="icon-btn" href="${esc(ticketUrl(t))}" target="_blank" rel="noopener" title="Ver ticket" aria-label="Ver ticket"><svg viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/></svg></a></td>
          </tr>`).join('')}</tbody>
      </table></div>` : `<div class="empty"><strong>Aún no hay tickets</strong><p>Crea uno para enviarle a tu cliente su comprobante con lo que ya pagó.</p></div>`}
    </section>`;
}

// ---------- Nuevo ticket ----------
const itemRow = (concept = '', qty = 1, price = '') => `<div class="item-row">
  <input name="concept" placeholder="Concepto" value="${esc(concept)}" required aria-label="Concepto">
  <input name="qty" type="number" min="1" step="1" value="${qty}" required aria-label="Cantidad">
  <input name="price" type="number" min="0" step="0.01" value="${price}" placeholder="Precio" required aria-label="Precio unitario">
  <button type="button" class="icon-btn" data-tact="remove-item" aria-label="Quitar concepto"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
</div>`;
const planPrice = name => tickets.plans.find(p => p.name === name)?.monthly_price ?? 0;

// opts: { clientId, kind, plan, price, period } para prellenar (p. ej. "crear mensualidad siguiente")
async function openNewTicket(opts = {}) {
  state.openId = null; // el panel del cliente ya no se vuelve a pintar encima
  if (!tickets.loaded) await loadTickets();
  const kind = opts.kind || 'web';
  const known = tickets.plans.some(p => p.name === opts.plan);
  const plan = known ? opts.plan : tickets.plans[0]?.name;
  const options = [...clients].sort((a, b) => a.name.localeCompare(b.name, 'es'))
    .map(c => `<option value="${c.id}"${String(c.id) === String(opts.clientId) ? ' selected' : ''}>${esc(c.name)}</option>`).join('');
  $('#drawer').innerHTML = `
    <div class="drawer-head">
      <span class="avatar avatar-blue">$</span>
      <div><h2>Nuevo ticket</h2><small>Comprobante de pago para tu cliente</small></div>
      <button class="icon-btn" data-close aria-label="Cerrar"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
    </div>
    <form class="drawer-body" id="ticket-form" data-kind="${kind}">
      <p class="eyebrow">¿QUÉ ESTÁ PAGANDO?</p>
      <div class="kind-switch" role="radiogroup">
        <label><input type="radio" name="kind" value="web"${kind === 'web' ? ' checked' : ''}><span><strong>Página web</strong><small>Anticipo 50% + finiquito 50%</small></span></label>
        <label><input type="radio" name="kind" value="mensualidad"${kind === 'mensualidad' ? ' checked' : ''}><span><strong>Mensualidad</strong><small>Un ticket por cada mes</small></span></label>
      </div>
      <div class="form-grid">
        <label class="field span-2"><span>Cliente *</span><select name="client_id" required><option value="">Elige un cliente…</option>${options}</select></label>
        <label class="field span-2"><span>Plan *</span><select name="plan_choice">
          ${tickets.plans.map(p => `<option value="${esc(p.name)}"${p.name === plan ? ' selected' : ''}>${esc(p.name)} · ${mxn(p.monthly_price)} /mes</option>`).join('')}
          <option value="__otro"${opts.plan && !known ? ' selected' : ''}>Otro (escribir nombre)…</option>
        </select></label>
        <label class="field span-2" id="plan-other"${opts.plan && !known ? '' : ' hidden'}><span>Nombre del plan *</span><input name="plan_other" value="${opts.plan && !known ? esc(opts.plan) : ''}" placeholder="Plan personalizado"></label>
        <label class="field span-2 only-web"><span>Precio total de la página web *</span><input name="web_price" type="number" min="0" step="0.01" placeholder="Ej. 12000" value="${kind === 'web' && opts.price ? opts.price : ''}"></label>
        <label class="field only-monthly"><span>Precio mensual contratado *</span><input name="monthly_price" type="number" min="0" step="0.01" value="${opts.price ?? planPrice(plan)}"></label>
        <label class="field only-monthly"><span>Mes que cubre *</span><input name="period" type="month" value="${opts.period || thisPeriod()}"></label>
      </div>
      <p class="hint only-web">Se cobra en dos partes: 50% de anticipo y 50% al entregar. Puedes registrar el anticipo abajo.</p>
      <p class="hint only-monthly">El precio viene de Ajustes → Planes y precios; aquí lo puedes cambiar solo para este cliente.</p>
      <p class="eyebrow">EXTRAS (OPCIONAL) · CONCEPTO · CANTIDAD · PRECIO</p>
      <div class="items" id="ticket-items"></div>
      <button type="button" class="mini-btn mini-text" data-tact="add-item">+ Agregar extra (dominio, diseño, etc.)</button>
      <div class="ticket-total"><span>Total</span><strong id="ticket-form-total">${mxn(0)}</strong></div>
      <p class="eyebrow">PAGO RECIBIDO (OPCIONAL)</p>
      <div class="fill-chips">
        <button type="button" class="chip only-web" data-tact="fill-half">Anticipo 50%</button>
        <button type="button" class="chip" data-tact="fill-total">Total</button>
      </div>
      <div class="form-grid">
        <label class="field"><span>Monto</span><input name="pay_amount" type="number" min="0" step="0.01" placeholder="0"></label>
        <label class="field"><span>Método</span><select name="pay_method">${PAY_METHODS.map(m => `<option>${m}</option>`).join('')}</select></label>
        <label class="field span-2"><span>Fecha del pago</span><input name="pay_date" type="date" value="${toISODate(0)}"></label>
        <label class="field span-2"><span>Notas para el cliente</span><textarea name="notes" class="note-box" placeholder="Ej. Incluye dominio y hosting. Pago mensual los primeros 5 días de cada mes."></textarea></label>
      </div>
      <button class="btn btn-dark btn-block" type="submit">Crear ticket <span>→</span></button>
    </form>`;
  showDrawer();
  updateTicketForm($('#ticket-form'));
}

function readExtras(form) {
  return [...form.querySelectorAll('.item-row')].map(row => ({
    concept: row.querySelector('[name=concept]').value.trim(),
    qty: Math.max(Number(row.querySelector('[name=qty]').value) || 1, 1),
    price: Number(row.querySelector('[name=price]').value) || 0
  })).filter(i => i.concept);
}
function readTicketForm(form) {
  const kind = form.querySelector('[name=kind]:checked').value;
  const choice = form.plan_choice.value;
  const plan = choice === '__otro' ? form.plan_other.value.trim() : choice;
  const price = Number(kind === 'web' ? form.web_price.value : form.monthly_price.value) || 0;
  const period = form.period.value || thisPeriod();
  const items = [mainItem(kind, plan || '—', price, period), ...readExtras(form)];
  return { kind, plan, price, period, items, total: itemsTotal(items) };
}
// Muestra los campos del tipo elegido y actualiza el total
function updateTicketForm(form) {
  const { kind, total } = readTicketForm(form);
  form.dataset.kind = kind;
  form.web_price.required = kind === 'web';
  form.monthly_price.required = form.period.required = kind === 'mensualidad';
  $('#ticket-form-total').textContent = mxn(total);
}

// Anota en el historial del cliente (CRM) lo que pasa con sus tickets
async function logTicketEvent(clientId, title) {
  const c = clientId != null && findClient(clientId);
  if (!c) return;
  if (db) await db.from('interactions').insert({ client_id: c.id, status: c.status, title });
  c.history.unshift({ d: 0, s: c.status, t: title, n: '' });
}

async function createTicket(form) {
  const f = new FormData(form);
  const client = findClient(f.get('client_id'));
  const t = readTicketForm(form);
  if (!client) return toast('Elige un cliente');
  if (!t.plan) return toast('Escribe el nombre del plan');
  if (t.kind === 'mensualidad' && tickets.list.some(x => x.kind === 'mensualidad' && String(x.client_id) === String(client.id) && x.period === t.period)
      && !confirm(`${client.name} ya tiene un ticket de la mensualidad de ${periodLabel(t.period)}. ¿Crear otro de todos modos?`)) return;
  const amount = Number(f.get('pay_amount')) || 0;
  const draft = { kind: t.kind, total: t.total, payments: [] };
  const row = {
    client_id: db ? client.id : null, client_name: client.name, client_contact: client.phone || client.email || null,
    kind: t.kind, period: t.kind === 'mensualidad' ? t.period : null, plan: t.plan,
    monthly_price: t.kind === 'mensualidad' ? t.price : null, months: t.kind === 'mensualidad' ? 1 : null,
    items: t.items, total: t.total,
    payments: amount > 0 ? [{ date: f.get('pay_date') || toISODate(0), amount, method: f.get('pay_method'), label: paymentLabel(draft, amount) }] : [],
    notes: f.get('notes').trim() || null
  };
  const button = form.querySelector('[type=submit]');
  button.disabled = true;
  let ticket;
  if (db) {
    const { data, error } = await db.from('receipts').insert(row).select().single();
    if (error) { button.disabled = false; return toast(missingColumns(error) || 'No se pudo crear el ticket: ' + error.message); }
    ticket = fromReceipt(data);
  } else {
    const folio = Math.max(0, ...tickets.list.map(x => x.folio)) + 1;
    ticket = fromReceipt({ ...row, client_id: client.id, id: 'demo-t' + folio, token: 'demo', folio, created_at: new Date().toISOString() });
  }
  tickets.list.unshift(ticket);
  await logTicketEvent(client.id, `Ticket ${folioOf(ticket)} · ${ticketTitle(ticket)} · ${mxn(row.total)}${amount ? ` (${row.payments[0].label.toLowerCase() || 'pagó'} ${mxn(amount)})` : ''}`);
  render();
  openTicket(ticket.id);
  toast('Ticket creado');
}

// ---------- Detalle ----------
function openTicket(id) {
  state.openId = null;
  renderTicketDrawer(id);
  showDrawer();
}

function renderTicketDrawer(id) {
  const t = tickets.list.find(x => String(x.id) === String(id));
  const url = ticketUrl(t);
  const paid = paidOf(t), due = dueOf(t);
  const pct = t.total ? Math.min(paid / t.total * 100, 100) : 0;
  const wa = contactWa(t.client_contact);
  const message = `Hola ${t.client_name}, te comparto tu comprobante de pago de Orion Studio (${folioOf(t)} · ${ticketTitle(t)}): ${url}`;
  const email = t.client_contact && t.client_contact.includes('@') ? t.client_contact : '';
  const mainPrice = t.kind === 'web' ? (t.items.find(i => i.main)?.price ?? t.total) : t.monthly_price;
  // Sugerencia del siguiente ticket: primera mensualidad al liquidar la página, o el mes siguiente
  const next = t.kind === 'web' && !due ? { label: 'Crear primera mensualidad', period: thisPeriod(), price: planPrice(t.plan) }
    : t.kind === 'mensualidad' && t.period ? { label: `Crear mensualidad de ${periodLabel(nextPeriod(t.period))}`, period: nextPeriod(t.period), price: t.monthly_price } : null;
  const halfLeft = t.kind === 'web' && paid === 0 ? round2(t.total / 2) : due;
  $('#drawer').innerHTML = `
    <div class="drawer-head" data-ticket-drawer="${t.id}">
      <span class="avatar avatar-blue">$</span>
      <div><h2>${folioOf(t)} · ${esc(t.client_name)}</h2><small>${esc(ticketTitle(t))} · ${shortDate(t.created_at)}</small></div>
      <button class="icon-btn" data-close aria-label="Cerrar"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
    </div>
    <div class="drawer-body">
      <section class="drawer-section">
        <div class="ticket-status">${ticketPill(t)}<span class="muted">${Math.round(pct)}% pagado</span></div>
        <div class="meter ticket-meter"><i style="width:${pct}%"></i></div>
        <div class="info">
          <div><span>Total</span><b>${mxn(t.total)}</b></div>
          <div><span>Pagado</span><b>${mxn(paid)}</b></div>
          <div class="span-2"><span>${t.kind === 'web' && paid > 0 && due ? 'Finiquito pendiente' : 'Saldo pendiente'}</span><b class="${due ? 'due-amount' : ''}">${mxn(due)}</b></div>
        </div>
        ${next ? `<button class="btn btn-ghost btn-block next-ticket" data-tact="next-ticket" data-period="${next.period}" data-price="${next.price ?? ''}">${next.label} <span>→</span></button>` : ''}
      </section>
      <section class="drawer-section">
        <p class="eyebrow">${t.kind === 'web' ? 'PRECIO DE LA PÁGINA' : 'PLAN CONTRATADO'}</p>
        <div class="plan-box">
          <div><strong>${t.kind === 'web' ? 'Página web' : 'Plan'} · ${esc(t.plan)}</strong>
            <small>${mainPrice != null ? `${mxn(mainPrice)}${t.kind === 'web' ? ' (precio total)' : ' /mes'}` : 'Sin precio registrado'}</small></div>
          <button class="mini-btn mini-text" data-tact="edit-price">Cambiar precio</button>
        </div>
        <form class="pay-form" id="price-form" hidden>
          <label class="field span-2"><span>${t.kind === 'web' ? 'Precio total de la página' : 'Precio mensual'}</span><input name="price" type="number" min="0" step="0.01" value="${mainPrice ?? ''}" required></label>
          <button class="btn btn-dark btn-sm" type="submit">Guardar precio y recalcular total</button>
        </form>
      </section>
      <section class="drawer-section">
        <p class="eyebrow">ENVIAR AL CLIENTE</p>
        <div class="quick">
          <a class="btn btn-dark" href="${esc(url)}" target="_blank" rel="noopener">Ver ticket</a>
          <button class="btn btn-ghost" data-tact="copy-link" data-url="${esc(url)}">Copiar enlace</button>
          ${wa ? `<a class="btn btn-ghost" href="https://wa.me/${wa}?text=${encodeURIComponent(message)}" target="_blank" rel="noopener">WhatsApp</a>` : ''}
          <a class="btn btn-ghost" href="mailto:${esc(email)}?subject=${encodeURIComponent(`Tu comprobante de pago ${folioOf(t)} · Orion Studio`)}&body=${encodeURIComponent(message)}">Correo</a>
        </div>
      </section>
      <section class="drawer-section">
        <p class="eyebrow">PAGOS</p>
        ${t.payments.length ? `<ul class="pay-list">${t.payments.map(p => `<li><span>${p.label ? `<b class="pay-label">${esc(p.label)}</b> · ` : ''}${shortDate(p.date)} · ${esc(p.method || '—')}</span><b>${mxn(p.amount)}</b></li>`).join('')}</ul>` : '<p class="muted" style="font-size:13px;margin:0 0 12px">Todavía no hay pagos registrados.</p>'}
        ${due ? `<form class="pay-form" id="pay-form">
          <input name="amount" type="number" min="0.01" step="0.01" value="${halfLeft}" required aria-label="Monto del pago">
          <select name="method" aria-label="Método">${PAY_METHODS.map(m => `<option>${m}</option>`).join('')}</select>
          <input name="date" type="date" value="${toISODate(0)}" required aria-label="Fecha">
          <button class="btn btn-dark btn-sm" type="submit">${t.kind === 'web' ? (paid === 0 ? 'Registrar anticipo' : 'Registrar finiquito') : 'Registrar pago'}</button>
        </form>` : ''}
      </section>
      <section class="drawer-section">
        <p class="eyebrow">CONCEPTOS</p>
        <ul class="pay-list">${t.items.map(i => `<li><span>${esc(i.concept)}${i.qty > 1 ? ` × ${i.qty}` : ''}</span><b>${mxn(i.qty * i.price)}</b></li>`).join('')}</ul>
        ${t.notes ? `<p class="ticket-notes">${esc(t.notes)}</p>` : ''}
      </section>
      <button class="link-danger" data-tact="delete">Eliminar ticket</button>
    </div>`;
}

const currentTicket = () => tickets.list.find(x => String(x.id) === $('#drawer [data-ticket-drawer]')?.dataset.ticketDrawer);

async function saveTicket(t, patch) {
  if (db) {
    const { error } = await db.from('receipts').update(patch).eq('id', t.id);
    if (error) { toast(missingColumns(error) || 'No se pudo guardar: ' + error.message); return false; }
  }
  Object.assign(t, patch);
  return true;
}

async function changePrice(form) {
  const t = currentTicket();
  const price = Number(form.price.value) || 0;
  // Reemplaza el concepto principal (página o mensualidad) y recalcula el total
  const kind = t.kind || 'mensualidad';
  const items = [mainItem(kind, t.plan, price, t.period), ...extrasOf(t)];
  const patch = { items, total: itemsTotal(items) };
  if (kind === 'mensualidad') patch.monthly_price = price;
  const before = t.kind === 'web' ? t.items.find(i => i.main)?.price : t.monthly_price;
  if (!await saveTicket(t, patch)) return;
  await logTicketEvent(t.client_id, `${folioOf(t)} · precio ${before != null ? `${mxn(before)} → ` : ''}${mxn(price)}`);
  render();
  renderTicketDrawer(t.id);
  toast('Precio actualizado');
}

async function addPayment(form) {
  const t = currentTicket();
  const f = new FormData(form);
  const amount = Number(f.get('amount'));
  if (!(amount > 0)) return toast('Escribe el monto del pago');
  const payment = { date: f.get('date'), amount, method: f.get('method'), label: paymentLabel(t, amount) };
  if (!await saveTicket(t, { payments: [...t.payments, payment] })) return;
  await logTicketEvent(t.client_id, `${payment.label || 'Pago'} recibido ${mxn(amount)} · ${folioOf(t)}`);
  render();
  renderTicketDrawer(t.id);
  toast(dueOf(t) ? 'Pago registrado' : 'Pago registrado · ticket liquidado');
}

async function deleteTicket() {
  const t = currentTicket();
  if (!confirm(`¿Eliminar el ticket ${folioOf(t)} de ${t.client_name}? El enlace que le enviaste dejará de funcionar.`)) return;
  if (db) {
    const { error } = await db.from('receipts').delete().eq('id', t.id);
    if (error) return toast('No se pudo eliminar: ' + error.message);
  }
  tickets.list = tickets.list.filter(x => x !== t);
  closeDrawer();
  render();
  toast('Ticket eliminado');
}

// ---------- Ajustes: planes y precios ----------
function renderPlansPanel() {
  const panel = $('#plans-panel');
  if (!panel) return;
  if (!tickets.loaded) {
    panel.innerHTML = '<div class="panel-head"><h2>Planes y precios</h2></div><p class="panel-text">Cargando…</p>';
    if (!db || state.email) loadTickets();
    return;
  }
  panel.innerHTML = `
    <div class="panel-head"><h2>Planes y precios</h2><span class="eyebrow">PRECIO MENSUAL · MXN</span></div>
    <p class="panel-text">Estos precios se usan al crear mensualidades nuevas. Los tickets que ya creaste conservan el precio con el que se contrataron.</p>
    ${tickets.plansMissing ? '<p class="info-banner" style="margin:0 0 14px">Falta actualizar la base: corre <code>supabase/migrations/004_planes.sql</code> en Supabase para guardar tus precios.</p>' : ''}
    <form id="plans-form" class="plans-grid">
      ${tickets.plans.map(p => `<label class="field"><span>${esc(p.name)}</span><input data-plan="${p.id}" type="number" min="0" step="0.01" value="${p.monthly_price}"${tickets.plansMissing ? ' disabled' : ''}></label>`).join('')}
      <button class="btn btn-dark" type="submit"${tickets.plansMissing ? ' disabled' : ''}>Guardar precios</button>
    </form>`;
}

async function savePlans(form) {
  const rows = tickets.plans.map(p => ({ ...p, monthly_price: Number(form.querySelector(`[data-plan="${p.id}"]`).value) || 0 }));
  if (db) {
    const { error } = await db.from('plans').upsert(rows);
    if (error) return toast('No se pudieron guardar los precios: ' + error.message);
  }
  tickets.plans = rows;
  toast('Precios guardados');
}

// ---------- Eventos ----------
$('#view-tickets').addEventListener('click', e => {
  if (e.target.closest('[data-tact="new"]')) return openNewTicket();
  if (e.target.closest('a')) return;
  const row = e.target.closest('[data-ticket]');
  if (row) openTicket(row.dataset.ticket);
});
$('#drawer').addEventListener('click', e => {
  const btn = e.target.closest('[data-tact]');
  if (!btn) return;
  const act = btn.dataset.tact;
  const form = $('#ticket-form');
  if (act === 'add-item') return $('#ticket-items').insertAdjacentHTML('beforeend', itemRow());
  if (act === 'remove-item') { btn.closest('.item-row').remove(); return updateTicketForm(form); }
  if (act === 'fill-half') { form.pay_amount.value = round2(readTicketForm(form).total / 2); return; }
  if (act === 'fill-total') { form.pay_amount.value = readTicketForm(form).total; return; }
  if (act === 'edit-price') { const f = $('#price-form'); f.hidden = !f.hidden; if (!f.hidden) f.price.focus(); return; }
  if (act === 'copy-link') return navigator.clipboard?.writeText(btn.dataset.url).then(() => toast('Enlace copiado'), () => toast('No se pudo copiar'));
  if (act === 'delete') return deleteTicket();
  if (act === 'new-for-client') return openNewTicket({ clientId: btn.dataset.client });
  if (act === 'next-ticket') {
    const t = currentTicket();
    return openNewTicket({ clientId: t.client_id, kind: 'mensualidad', plan: t.plan, period: btn.dataset.period, price: btn.dataset.price === '' ? undefined : Number(btn.dataset.price) });
  }
});
$('#drawer').addEventListener('change', e => {
  const form = e.target.closest('#ticket-form');
  if (!form) return;
  if (e.target.name === 'plan_choice') {
    // Al elegir un plan se prellena su precio mensual actual (editable)
    const other = e.target.value === '__otro';
    $('#plan-other').hidden = !other;
    form.plan_other.required = other;
    if (!other) form.monthly_price.value = planPrice(e.target.value);
  }
  updateTicketForm(form);
});
$('#drawer').addEventListener('input', e => {
  const form = e.target.closest('#ticket-form');
  if (form) updateTicketForm(form);
});
$('#drawer').addEventListener('submit', e => {
  if (e.target.id === 'ticket-form') createTicket(e.target);
  if (e.target.id === 'pay-form') addPayment(e.target);
  if (e.target.id === 'price-form') changePrice(e.target);
});
$('#views').addEventListener('submit', e => {
  if (e.target.id === 'plans-form') savePlans(e.target);
});

if (currentView() === 'tickets') render();
if (currentView() === 'ajustes') renderPlansPanel();
