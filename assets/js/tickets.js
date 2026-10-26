// Orion CRM — tickets (comprobantes de pago) que se comparten con el cliente por enlace.
// Depende de admin.js (clients, db, state, render, toast, esc, kpiHtml, findClient, toISODate…).

const tickets = { list: [], loaded: false, loading: false };
const PLAN_SUGGESTIONS = ['Landing page', 'Sitio web', 'Sitio web + menú digital', 'Menú digital QR', 'Tienda en línea', 'Identidad visual', 'Mantenimiento mensual'];
const PAY_METHODS = ['Transferencia', 'Efectivo', 'Tarjeta', 'Depósito'];

const mxn = n => Number(n || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
const folioOf = t => '#' + String(t.folio).padStart(4, '0');
const paidOf = t => t.payments.reduce((s, p) => s + Number(p.amount || 0), 0);
const dueOf = t => Math.max(t.total - paidOf(t), 0);
const ticketStatus = t => {
  const paid = paidOf(t);
  if (t.total > 0 && paid >= t.total) return { label: 'Pagado', color: 'var(--st-respondio)' };
  if (paid > 0) return { label: 'Pago parcial', color: 'var(--st-silencio)' };
  return { label: 'Pendiente', color: 'var(--st-nuevo)' };
};
const ticketPill = t => { const s = ticketStatus(t); return `<span class="pill" style="--c:${s.color}">${s.label}</span>`; };
const ticketUrl = t => new URL(db ? `../ticket.html?t=${t.token}` : '../ticket.html?demo=1', location.href).href;
const shortDate = v => new Date(v.length > 10 ? v : v + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
const fromReceipt = r => ({ ...r, total: Number(r.total) || 0, items: r.items || [], payments: r.payments || [] });
// WhatsApp del cliente a partir de su contacto (10 dígitos → +52)
function contactWa(contact) {
  const d = (contact || '').replace(/\D/g, '');
  if (d.length === 10) return '52' + d;
  return d.length >= 12 ? d : '';
}

async function loadTickets() {
  if (tickets.loading || tickets.loaded) return;
  tickets.loading = true;
  if (db) {
    const { data, error } = await db.from('receipts').select('*').order('created_at', { ascending: false });
    tickets.loading = false;
    if (error) {
      $('#view-tickets').innerHTML = `<div class="empty"><strong>No se pudieron cargar los tickets</strong><p>${/receipts|schema cache|does not exist/i.test(error.message)
        ? 'Falta crear la tabla: corre <code>supabase/migrations/003_tickets.sql</code> en Supabase.' : esc(error.message)}</p></div>`;
      return;
    }
    tickets.list = data.map(fromReceipt);
  } else {
    const today = toISODate(0);
    tickets.list = [
      fromReceipt({ id: 'demo-t2', token: 'demo', folio: 2, created_at: new Date().toISOString(), client_id: 4, client_name: 'Jorge Méndez', client_contact: '+52 55 7788 9900', plan: 'Sitio web', items: [{ concept: 'Sitio corporativo (5 secciones)', qty: 1, price: 52000 }], total: 52000, payments: [{ date: today, amount: 26000, method: 'Transferencia' }], notes: 'Anticipo del 50%. El resto a la entrega.' }),
      fromReceipt({ id: 'demo-t1', token: 'demo', folio: 1, created_at: new Date(Date.now() - 12 * 864e5).toISOString(), client_id: 11, client_name: 'Fernanda Cruz', client_contact: '+52 55 1212 3434', plan: 'Landing page', items: [{ concept: 'Landing page', qty: 1, price: 15000 }, { concept: 'Mantenimiento mensual', qty: 1, price: 3000 }], total: 18000, payments: [{ date: today, amount: 18000, method: 'Efectivo' }], notes: '' })
    ];
    tickets.loading = false;
  }
  tickets.loaded = true;
  render();
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
  view.innerHTML = `
    <section class="kpis kpis-4">
      ${kpiHtml('Cobrado', mxn(collected), `${list.length} ticket${list.length === 1 ? '' : 's'}`, true)}
      ${kpiHtml('Por cobrar', mxn(pending), `${withDue} con saldo pendiente`)}
      ${kpiHtml('Vendido', mxn(list.reduce((s, t) => s + t.total, 0)), 'suma de todos los tickets')}
      ${kpiHtml('Liquidados', list.length - withDue, 'pagados al 100%')}
    </section>
    <section class="board">
      <div class="board-toolbar">
        <h2 class="board-title">Comprobantes de pago</h2>
        <button class="btn btn-dark btn-sm" data-tact="new">+ Nuevo ticket</button>
      </div>
      ${list.length ? `<div class="table-wrap"><table class="table">
        <thead><tr><th>Cliente</th><th>Estado</th><th>Plan</th><th>Total</th><th>Saldo</th><th>Fecha</th><th aria-label="Compartir"></th></tr></thead>
        <tbody>${list.map(t => `
          <tr data-ticket="${t.id}">
            <td><div class="who"><span class="avatar">${esc(folioOf(t).slice(-2))}</span><div><strong>${esc(t.client_name)}</strong><small>${folioOf(t)}</small></div></div></td>
            <td>${ticketPill(t)}</td>
            <td>${esc(t.plan)}</td>
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

function openNewTicket(clientId) {
  state.openId = null; // el panel del cliente ya no se vuelve a pintar encima
  const options = [...clients].sort((a, b) => a.name.localeCompare(b.name, 'es'))
    .map(c => `<option value="${c.id}"${String(c.id) === String(clientId) ? ' selected' : ''}>${esc(c.name)}</option>`).join('');
  $('#drawer').innerHTML = `
    <div class="drawer-head">
      <span class="avatar avatar-blue">$</span>
      <div><h2>Nuevo ticket</h2><small>Comprobante de pago para tu cliente</small></div>
      <button class="icon-btn" data-close aria-label="Cerrar"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
    </div>
    <form class="drawer-body" id="ticket-form">
      <div class="form-grid">
        <label class="field span-2"><span>Cliente *</span><select name="client_id" required><option value="">Elige un cliente…</option>${options}</select></label>
        <label class="field span-2"><span>Plan *</span><input name="plan" list="plan-list" required placeholder="Sitio web + menú digital">
          <datalist id="plan-list">${PLAN_SUGGESTIONS.map(p => `<option value="${p}">`).join('')}</datalist></label>
      </div>
      <p class="eyebrow">CONCEPTOS · CANTIDAD · PRECIO</p>
      <div class="items" id="ticket-items">${itemRow()}</div>
      <button type="button" class="mini-btn mini-text" data-tact="add-item">+ Agregar concepto</button>
      <div class="ticket-total"><span>Total</span><strong id="ticket-form-total">${mxn(0)}</strong></div>
      <p class="eyebrow">PAGO RECIBIDO (OPCIONAL)</p>
      <div class="form-grid">
        <label class="field"><span>Monto</span><input name="pay_amount" type="number" min="0" step="0.01" placeholder="0"></label>
        <label class="field"><span>Método</span><select name="pay_method">${PAY_METHODS.map(m => `<option>${m}</option>`).join('')}</select></label>
        <label class="field span-2"><span>Fecha del pago</span><input name="pay_date" type="date" value="${toISODate(0)}"></label>
        <label class="field span-2"><span>Notas para el cliente</span><textarea name="notes" class="note-box" placeholder="Incluye dominio y hosting por 1 año. Entrega estimada: 3 semanas."></textarea></label>
      </div>
      <button class="btn btn-dark btn-block" type="submit">Crear ticket <span>→</span></button>
    </form>`;
  showDrawer();
}

function readItems(form) {
  return [...form.querySelectorAll('.item-row')].map(row => ({
    concept: row.querySelector('[name=concept]').value.trim(),
    qty: Math.max(Number(row.querySelector('[name=qty]').value) || 1, 1),
    price: Number(row.querySelector('[name=price]').value) || 0
  })).filter(i => i.concept);
}
const itemsTotal = items => Math.round(items.reduce((s, i) => s + i.qty * i.price, 0) * 100) / 100;

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
  const items = readItems(form);
  if (!client || !items.length) return toast('Elige un cliente y agrega al menos un concepto');
  const amount = Number(f.get('pay_amount')) || 0;
  const row = {
    client_id: db ? client.id : null, client_name: client.name, client_contact: client.phone || client.email || null,
    plan: f.get('plan').trim(), items, total: itemsTotal(items),
    payments: amount > 0 ? [{ date: f.get('pay_date') || toISODate(0), amount, method: f.get('pay_method') }] : [],
    notes: f.get('notes').trim() || null
  };
  const button = form.querySelector('[type=submit]');
  button.disabled = true;
  let ticket;
  if (db) {
    const { data, error } = await db.from('receipts').insert(row).select().single();
    if (error) { button.disabled = false; return toast('No se pudo crear el ticket: ' + error.message); }
    ticket = fromReceipt(data);
  } else {
    const folio = Math.max(0, ...tickets.list.map(t => t.folio)) + 1;
    ticket = fromReceipt({ ...row, client_id: client.id, id: 'demo-t' + folio, token: 'demo', folio, created_at: new Date().toISOString() });
  }
  tickets.list.unshift(ticket);
  await logTicketEvent(client.id, `Ticket ${folioOf(ticket)} · ${row.plan} · ${mxn(row.total)}${amount ? ` (pagó ${mxn(amount)})` : ''}`);
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
  const message = `Hola ${t.client_name}, te comparto tu comprobante de pago de Orion Studio (${folioOf(t)}): ${url}`;
  const email = t.client_contact && t.client_contact.includes('@') ? t.client_contact : '';
  $('#drawer').innerHTML = `
    <div class="drawer-head" data-ticket-drawer="${t.id}">
      <span class="avatar avatar-blue">$</span>
      <div><h2>${folioOf(t)} · ${esc(t.client_name)}</h2><small>${esc(t.plan)} · ${shortDate(t.created_at)}</small></div>
      <button class="icon-btn" data-close aria-label="Cerrar"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
    </div>
    <div class="drawer-body">
      <section class="drawer-section">
        <div class="ticket-status">${ticketPill(t)}<span class="muted">${Math.round(pct)}% pagado</span></div>
        <div class="meter ticket-meter"><i style="width:${pct}%"></i></div>
        <div class="info">
          <div><span>Total</span><b>${mxn(t.total)}</b></div>
          <div><span>Pagado</span><b>${mxn(paid)}</b></div>
          <div class="span-2"><span>Saldo pendiente</span><b class="${due ? 'due-amount' : ''}">${mxn(due)}</b></div>
        </div>
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
        ${t.payments.length ? `<ul class="pay-list">${t.payments.map(p => `<li><span>${shortDate(p.date)} · ${esc(p.method || '—')}</span><b>${mxn(p.amount)}</b></li>`).join('')}</ul>` : '<p class="muted" style="font-size:13px;margin:0 0 12px">Todavía no hay pagos registrados.</p>'}
        ${due ? `<form class="pay-form" id="pay-form">
          <input name="amount" type="number" min="0.01" step="0.01" value="${due}" required aria-label="Monto del pago">
          <select name="method" aria-label="Método">${PAY_METHODS.map(m => `<option>${m}</option>`).join('')}</select>
          <input name="date" type="date" value="${toISODate(0)}" required aria-label="Fecha">
          <button class="btn btn-dark btn-sm" type="submit">Registrar pago</button>
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

const currentTicketId = () => $('#drawer [data-ticket-drawer]')?.dataset.ticketDrawer;

async function addPayment(form) {
  const t = tickets.list.find(x => String(x.id) === currentTicketId());
  const f = new FormData(form);
  const payment = { date: f.get('date'), amount: Number(f.get('amount')), method: f.get('method') };
  if (!(payment.amount > 0)) return toast('Escribe el monto del pago');
  const payments = [...t.payments, payment];
  if (db) {
    const { error } = await db.from('receipts').update({ payments }).eq('id', t.id);
    if (error) return toast('No se pudo registrar el pago: ' + error.message);
  }
  t.payments = payments;
  await logTicketEvent(t.client_id, `Pago recibido ${mxn(payment.amount)} · ${folioOf(t)}`);
  render();
  renderTicketDrawer(t.id);
  toast(dueOf(t) ? 'Pago registrado' : 'Pago registrado · ticket liquidado');
}

async function deleteTicket() {
  const t = tickets.list.find(x => String(x.id) === currentTicketId());
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
  if (act === 'add-item') return $('#ticket-items').insertAdjacentHTML('beforeend', itemRow());
  if (act === 'remove-item') {
    if (document.querySelectorAll('#ticket-items .item-row').length > 1) btn.closest('.item-row').remove();
    $('#ticket-form-total').textContent = mxn(itemsTotal(readItems($('#ticket-form'))));
    return;
  }
  if (act === 'copy-link') return navigator.clipboard?.writeText(btn.dataset.url).then(() => toast('Enlace copiado'), () => toast('No se pudo copiar'));
  if (act === 'delete') return deleteTicket();
  if (act === 'new-for-client') return openNewTicket(btn.dataset.client);
});
$('#drawer').addEventListener('input', e => {
  const form = e.target.closest('#ticket-form');
  if (!form) return;
  // Al escribir el plan, el primer concepto vacío toma ese nombre
  if (e.target.name === 'plan') {
    const first = form.querySelector('.item-row [name=concept]');
    if (first && (!first.value || first.dataset.auto)) { first.value = e.target.value; first.dataset.auto = '1'; }
  }
  if (e.target.name === 'concept') delete e.target.dataset.auto;
  $('#ticket-form-total').textContent = mxn(itemsTotal(readItems(form)));
});
$('#drawer').addEventListener('submit', e => {
  if (e.target.id === 'ticket-form') createTicket(e.target);
  if (e.target.id === 'pay-form') addPayment(e.target);
});

if (currentView() === 'tickets') render();
