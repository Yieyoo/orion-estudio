// Orion CRM — buscador de prospectos con Google Maps (Places API New).
// Depende de admin.js (clients, db, render, toast, esc, norm, fromRow, toISODate…).

const gcfg = window.ORION_GOOGLE || {};
const prospects = { list: [], filter: 'all', what: '', loading: false, searched: false, map: null, markers: [], active: null };

const PLACE_FIELDS = ['id', 'displayName', 'formattedAddress', 'nationalPhoneNumber', 'internationalPhoneNumber',
  'websiteURI', 'rating', 'userRatingCount', 'location', 'googleMapsURI', 'businessStatus'];

// Resultados ficticios para el modo demo
const DEMO_PLACES = [
  { id: 'demo-1', name: 'Café Tlacuache', address: 'Colima 152, Roma Nte., Cuauhtémoc, CDMX', phone: '55 1111 2201', intlPhone: '+52 55 1111 2201', website: '', rating: 4.7, reviews: 312, lat: 19.4185, lng: -99.1610 },
  { id: 'demo-2', name: 'Molienda Roma', address: 'Córdoba 88, Roma Nte., Cuauhtémoc, CDMX', phone: '55 1111 2202', intlPhone: '+52 55 1111 2202', website: 'https://example.com', rating: 4.5, reviews: 128, lat: 19.4202, lng: -99.1575 },
  { id: 'demo-3', name: 'La Esquina del Grano', address: 'Orizaba 40, Roma Nte., Cuauhtémoc, CDMX', phone: '55 1111 2203', intlPhone: '+52 55 1111 2203', website: '', rating: 4.4, reviews: 76, lat: 19.4170, lng: -99.1588 },
  { id: 'demo-4', name: 'Tostador Álvaro', address: 'Álvaro Obregón 120, Roma Nte., CDMX', phone: '', intlPhone: '', website: '', rating: 4.8, reviews: 54, lat: 19.4158, lng: -99.1630 },
  { id: 'demo-5', name: 'Casa Cenzontle Café', address: 'Durango 210, Roma Nte., Cuauhtémoc, CDMX', phone: '55 1111 2205', intlPhone: '+52 55 1111 2205', website: 'https://example.org', rating: 4.3, reviews: 410, lat: 19.4220, lng: -99.1650 },
  { id: 'demo-6', name: 'Barra Copal', address: 'Tabasco 75, Roma Nte., Cuauhtémoc, CDMX', phone: '55 1111 2206', intlPhone: '+52 55 1111 2206', website: '', rating: 4.6, reviews: 189, lat: 19.4195, lng: -99.1622 },
  { id: 'demo-7', name: 'Pan y Grano Roma', address: 'Mérida 31, Roma Nte., Cuauhtémoc, CDMX', phone: '55 1111 2207', intlPhone: '+52 55 1111 2207', website: 'https://example.net', rating: 4.2, reviews: 95, lat: 19.4210, lng: -99.1560 }
];

const normPlace = p => ({
  id: p.id, name: p.displayName || 'Sin nombre', address: p.formattedAddress || '',
  phone: p.nationalPhoneNumber || '', intlPhone: p.internationalPhoneNumber || '', website: p.websiteURI || '',
  rating: p.rating ?? null, reviews: p.userRatingCount || 0, mapsUrl: p.googleMapsURI || '',
  lat: p.location ? p.location.lat() : null, lng: p.location ? p.location.lng() : null,
  closed: Boolean(p.businessStatus && p.businessStatus !== 'OPERATIONAL')
});
const mapsUrlOf = p => p.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name + ' ' + p.address)}`;
const shortUrl = url => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/.*$/, '');
const inCrm = p => clients.some(c => (c.placeId && c.placeId === p.id) || norm(c.name) === norm(p.name));

const PROSPECT_FILTERS = [
  { id: 'all', label: 'Todos', test: () => true },
  { id: 'noweb', label: 'Sin sitio web', test: p => !p.website },
  { id: 'web', label: 'Con sitio web', test: p => p.website },
  { id: 'phone', label: 'Con teléfono', test: p => p.phone }
];
const filteredProspects = () => prospects.list.filter(PROSPECT_FILTERS.find(f => f.id === prospects.filter).test);

// ---------- Google Maps ----------
function loadMaps() {
  if (!loadMaps.promise) {
    loadMaps.promise = new Promise((resolve, reject) => {
      window.__orionMapsReady = resolve;
      window.gm_authFailure = () => toast('Google rechazó la clave de Maps: revisa la clave y sus restricciones.');
      const s = document.createElement('script');
      s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(gcfg.mapsKey)}&v=weekly&language=es&region=MX&loading=async&callback=__orionMapsReady`;
      s.async = true;
      s.onerror = () => { loadMaps.promise = null; reject(new Error('No se pudo cargar Google Maps')); };
      document.head.appendChild(s);
    });
  }
  return loadMaps.promise;
}

function ensureMap() {
  if (!gcfg.mapsKey) return Promise.resolve();
  ensureMap.promise ||= (async () => {
    await loadMaps();
    const { Map } = await google.maps.importLibrary('maps');
    await google.maps.importLibrary('marker');
    prospects.map = new Map($('#prospect-map'), {
      center: { lat: 19.4326, lng: -99.1332 }, zoom: 11, mapId: gcfg.mapId || 'DEMO_MAP_ID',
      disableDefaultUI: true, zoomControl: true, gestureHandling: 'cooperative'
    });
  })().catch(e => { ensureMap.promise = null; throw e; });
  return ensureMap.promise;
}

function drawMarkers() {
  if (!prospects.map) return;
  prospects.markers.forEach(m => { m.marker.map = null; });
  prospects.markers = [];
  const list = filteredProspects().filter(p => p.lat !== null);
  if (!list.length) return;
  const bounds = new google.maps.LatLngBounds();
  filteredProspects().forEach((p, i) => {
    if (p.lat === null) return;
    const pin = document.createElement('div');
    pin.className = 'map-pin' + (p.website ? '' : ' is-opportunity');
    pin.textContent = i + 1;
    const marker = new google.maps.marker.AdvancedMarkerElement({ map: prospects.map, position: { lat: p.lat, lng: p.lng }, content: pin, title: p.name });
    marker.addListener('click', () => focusProspect(p.id, true));
    prospects.markers.push({ id: p.id, marker, pin });
    bounds.extend({ lat: p.lat, lng: p.lng });
  });
  if (list.length === 1) { prospects.map.setCenter(bounds.getCenter()); prospects.map.setZoom(16); }
  else prospects.map.fitBounds(bounds, 50);
}

function focusProspect(id, fromMap) {
  prospects.active = id;
  document.querySelectorAll('.pl-card').forEach(el => el.classList.toggle('is-active', el.dataset.place === id));
  prospects.markers.forEach(m => {
    m.pin.classList.toggle('is-active', m.id === id);
    m.marker.zIndex = m.id === id ? 10 : null;
  });
  if (fromMap) document.querySelector(`.pl-card[data-place="${CSS.escape(id)}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  else {
    const m = prospects.markers.find(x => x.id === id);
    if (m) prospects.map.panTo(m.marker.position);
  }
}

// ---------- Búsqueda ----------
async function searchPlaces(what, where) {
  prospects.loading = true;
  prospects.what = what;
  prospects.active = null;
  renderProspects();
  try {
    if (!gcfg.mapsKey) {
      await new Promise(r => setTimeout(r, 450));
      prospects.list = DEMO_PLACES;
    } else {
      await loadMaps();
      const { Place } = await google.maps.importLibrary('places');
      const { places } = await Place.searchByText({
        textQuery: `${what} en ${where}`, fields: PLACE_FIELDS, language: 'es', region: 'mx', maxResultCount: 20
      });
      prospects.list = places.map(normPlace).filter(p => !p.closed);
    }
  } catch (e) {
    prospects.list = [];
    toast('Error al buscar: ' + e.message);
  }
  prospects.loading = false;
  prospects.searched = true;
  renderProspects();
  try { await ensureMap(); drawMarkers(); } catch (e) { toast(e.message); }
}

async function addProspect(p, button) {
  const row = {
    name: p.name, phone: p.intlPhone || p.phone || null, status: 'nuevo',
    channel: p.phone ? 'whatsapp' : 'email', service: p.website ? 'Rediseño web' : 'Sitio web',
    next_step: toISODate(0), next_label: 'Primer contacto',
    tags: [prospects.what.trim().toLowerCase(), p.website ? '' : 'sin web'].filter(Boolean),
    website: p.website || null, address: p.address || null, place_id: p.id, maps_url: mapsUrlOf(p)
  };
  button.disabled = true;
  let client;
  if (db) {
    const { data, error } = await db.from('clients').insert(row).select().single();
    if (error) {
      button.disabled = false;
      return toast(/column|schema cache/i.test(error.message)
        ? 'Falta actualizar la base: corre supabase/migrations/002_prospectos.sql en Supabase'
        : 'No se pudo agregar: ' + error.message);
    }
    client = fromRow(data);
  } else {
    client = fromRow({ ...row, id: 'demo-' + Date.now() });
  }
  clients.push(client);
  render();
  toast(`${p.name} agregado a tus clientes`);
}

// ---------- Vista ----------
function prospectCard(p, i) {
  const wa = p.intlPhone ? 'https://wa.me/' + p.intlPhone.replace(/\D/g, '') : '';
  const added = inCrm(p);
  return `<article class="pl-card${prospects.active === p.id ? ' is-active' : ''}" data-place="${esc(p.id)}">
    <span class="pl-num${p.website ? '' : ' is-opportunity'}">${i + 1}</span>
    <div class="pl-body">
      <div class="pl-head">
        <strong>${esc(p.name)}</strong>
        ${p.rating ? `<span class="pl-rating">★ ${p.rating.toFixed(1)} <em>(${p.reviews})</em></span>` : ''}
      </div>
      <p class="pl-address">${esc(p.address)}</p>
      <div class="pl-facts">
        ${p.phone ? `<span class="pl-fact"><svg viewBox="0 0 24 24">${CHANNELS.llamada.icon}</svg>${esc(p.phone)}</span>` : '<span class="pl-fact muted">Sin teléfono</span>'}
        ${p.website
          ? `<a class="pl-fact pl-web" href="${esc(p.website)}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>${esc(shortUrl(p.website))}</a>`
          : '<span class="badge-opportunity">Sin sitio web · oportunidad</span>'}
      </div>
      <div class="pl-actions">
        ${wa ? `<a class="mini-btn" href="${wa}" target="_blank" rel="noopener" title="WhatsApp (si el número lo tiene)" aria-label="WhatsApp"><svg viewBox="0 0 24 24">${CHANNELS.whatsapp.icon}</svg></a>` : ''}
        ${p.phone ? `<a class="mini-btn" href="tel:${esc(p.intlPhone || p.phone)}" title="Llamar" aria-label="Llamar"><svg viewBox="0 0 24 24">${CHANNELS.llamada.icon}</svg></a>` : ''}
        <a class="mini-btn mini-text" href="${esc(mapsUrlOf(p))}" target="_blank" rel="noopener">Ver en Maps</a>
        ${added
          ? '<span class="pl-added">✓ En tus clientes</span>'
          : `<button class="btn btn-dark btn-sm pl-add" data-pact="add">+ Agregar al CRM</button>`}
      </div>
    </div>
  </article>`;
}

function renderProspects() {
  $('#maps-banner').hidden = Boolean(gcfg.mapsKey);
  const list = filteredProspects();
  $('#prospect-toolbar').hidden = !prospects.list.length;
  $('#prospect-chips').innerHTML = PROSPECT_FILTERS.map(f =>
    `<button class="chip${prospects.filter === f.id ? ' is-active' : ''}" data-pfilter="${f.id}">${f.label} <em>${prospects.list.filter(f.test).length}</em></button>`).join('');
  $('#prospect-count').textContent = prospects.list.length
    ? `${prospects.list.filter(p => !p.website).length} SIN WEB · ${prospects.list.filter(inCrm).length} YA EN TU CRM` : '';

  if (prospects.loading) {
    $('#prospect-list').innerHTML = Array.from({ length: 4 }, () => '<div class="pl-card pl-skeleton"><i></i><i></i><i></i></div>').join('');
  } else if (!prospects.searched) {
    $('#prospect-list').innerHTML = `<div class="ps-empty">
      <strong>Encuentra negocios para contactar</strong>
      <p>Busca un giro y una zona. Te mostramos dirección, teléfono y si tienen página web.</p>
      <div class="ps-suggest">${[['Cafeterías', 'Roma Norte, CDMX'], ['Dentistas', 'Polanco, CDMX'], ['Gimnasios', 'Coyoacán, CDMX'], ['Restaurantes', 'Condesa, CDMX']]
        .map(([w, z]) => `<button class="chip" data-suggest="${w}|${z}">${w} · ${z.split(',')[0]}</button>`).join('')}</div>
    </div>`;
  } else if (!list.length) {
    $('#prospect-list').innerHTML = '<div class="ps-empty"><strong>Sin resultados</strong><p>Prueba otra zona, otro giro o cambia el filtro.</p></div>';
  } else {
    $('#prospect-list').innerHTML = list.map(prospectCard).join('');
  }

  if (gcfg.mapsKey) ensureMap().catch(e => toast(e.message));
  else if (!$('#prospect-map').childElementCount) {
    $('#prospect-map').innerHTML = `<div class="map-placeholder"><svg viewBox="0 0 24 24"><path d="M12 21s-7-6.1-7-11.5a7 7 0 0 1 14 0C19 14.9 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>
      <strong>Aquí aparecerá el mapa</strong><p>Se activa al agregar tu clave de Google Maps.</p></div>`;
  }
}

$('#prospect-form').addEventListener('submit', e => {
  e.preventDefault();
  const f = new FormData(e.target);
  searchPlaces(f.get('what').trim(), f.get('where').trim());
});
$('#prospect-chips').addEventListener('click', e => {
  const b = e.target.closest('[data-pfilter]');
  if (!b) return;
  prospects.filter = b.dataset.pfilter;
  renderProspects();
  drawMarkers();
});
$('#prospect-list').addEventListener('click', e => {
  const suggest = e.target.closest('[data-suggest]');
  if (suggest) {
    const [what, where] = suggest.dataset.suggest.split('|');
    $('#prospect-form').what.value = what;
    $('#prospect-form').where.value = where;
    return searchPlaces(what, where);
  }
  const card = e.target.closest('.pl-card[data-place]');
  if (!card) return;
  const p = prospects.list.find(x => x.id === card.dataset.place);
  if (e.target.closest('[data-pact="add"]')) return addProspect(p, e.target.closest('button'));
  if (!e.target.closest('a')) focusProspect(p.id, false);
});

if (currentView() === 'prospectar') render();
