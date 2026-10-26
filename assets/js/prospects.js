// Orion CRM — buscador de prospectos.
// Sin clave de Google usa OpenStreetMap (gratis: búsqueda con Nominatim y mapa con Leaflet).
// Con clave en google-config.js usa Google Places API (New), que tiene datos más completos.
// Depende de admin.js (clients, db, render, toast, esc, norm, fromRow, toISODate…).

const gcfg = window.ORION_GOOGLE || {};
const useGoogle = Boolean(gcfg.mapsKey);
const prospects = { list: [], filter: 'all', what: '', where: '', loading: false, searched: false, map: null, markers: [], active: null };

const mapsSearchUrl = q => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
const shortUrl = url => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/.*$/, '');
const inCrm = p => clients.some(c => (c.placeId && c.placeId === p.id) || norm(c.name) === norm(p.name));
// Teléfono en formato +52XXXXXXXXXX para WhatsApp; vacío si no parece número mexicano
function toIntlMx(raw) {
  const d = (raw || '').replace(/\D/g, '');
  if (d.length === 10) return '+52' + d;
  if (d.startsWith('52') && d.length >= 12) return '+' + d;
  return '';
}

const PROSPECT_FILTERS = [
  { id: 'all', label: 'Todos', test: () => true },
  { id: 'noweb', label: 'Sin sitio web', test: p => !p.website },
  { id: 'web', label: 'Con sitio web', test: p => p.website },
  { id: 'phone', label: 'Con teléfono', test: p => p.phone }
];
const filteredProspects = () => prospects.list.filter(PROSPECT_FILTERS.find(f => f.id === prospects.filter).test);

// ---------- Google Places ----------
const PLACE_FIELDS = ['id', 'displayName', 'formattedAddress', 'nationalPhoneNumber', 'internationalPhoneNumber',
  'websiteURI', 'rating', 'userRatingCount', 'location', 'googleMapsURI', 'businessStatus'];

function loadGoogle() {
  loadGoogle.promise ||= new Promise((resolve, reject) => {
    window.__orionMapsReady = resolve;
    window.gm_authFailure = () => toast('Google rechazó la clave de Maps: revisa la clave y sus restricciones.');
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(gcfg.mapsKey)}&v=weekly&language=es&region=MX&loading=async&callback=__orionMapsReady`;
    s.async = true;
    s.onerror = () => { loadGoogle.promise = null; reject(new Error('No se pudo cargar Google Maps')); };
    document.head.appendChild(s);
  });
  return loadGoogle.promise;
}

async function searchGoogle(what, where) {
  await loadGoogle();
  const { Place } = await google.maps.importLibrary('places');
  const { places } = await Place.searchByText({
    textQuery: `${what} en ${where}`, fields: PLACE_FIELDS, language: 'es', region: 'mx', maxResultCount: 20
  });
  return places.filter(p => !p.businessStatus || p.businessStatus === 'OPERATIONAL').map(p => ({
    id: p.id, name: p.displayName || 'Sin nombre', address: p.formattedAddress || '',
    phone: p.nationalPhoneNumber || '', intlPhone: p.internationalPhoneNumber || '', website: p.websiteURI || '',
    rating: p.rating ?? null, reviews: p.userRatingCount || 0,
    mapsUrl: p.googleMapsURI || mapsSearchUrl(`${p.displayName} ${p.formattedAddress}`),
    lat: p.location ? p.location.lat() : null, lng: p.location ? p.location.lng() : null
  }));
}

// ---------- OpenStreetMap ----------
const tag = (k, v) => `[${k}=${v}]`;
// Palabra que escribe el usuario (sin acentos) → etiquetas de OpenStreetMap
const OSM_CATEGORIES = [
  [['cafe'], [tag('amenity', 'cafe')]],
  [['restaurant', 'comida', 'fonda', 'cocina'], [tag('amenity', 'restaurant')]],
  [['taco', 'taqueria', 'hamburguesa', 'pizza', 'torta', 'comida rapida'], [tag('amenity', 'fast_food'), tag('amenity', 'restaurant')]],
  [['bar', 'cantina', 'cerveceria', 'mezcaleria'], [tag('amenity', 'bar'), tag('amenity', 'pub')]],
  [['dentist', 'dental', 'odontolog'], [tag('amenity', 'dentist'), tag('healthcare', 'dentist')]],
  [['doctor', 'medic', 'consultorio', 'clinica'], [tag('amenity', 'doctors'), tag('amenity', 'clinic')]],
  [['gimnasio', 'gym', 'crossfit', 'yoga', 'pilates', 'fitness'], [tag('leisure', 'fitness_centre'), tag('leisure', 'sports_centre')]],
  [['hotel', 'hostal', 'posada'], [tag('tourism', 'hotel'), tag('tourism', 'guest_house'), tag('tourism', 'hostel')]],
  [['panaderia', 'pasteleria', 'reposteria', 'pan '], [tag('shop', 'bakery'), tag('shop', 'pastry')]],
  [['estetica', 'belleza', 'salon', 'unas', 'manicure'], [tag('shop', 'beauty'), tag('shop', 'hairdresser')]],
  [['barberia', 'peluqueria'], [tag('shop', 'hairdresser')]],
  [['veterinari'], [tag('amenity', 'veterinary')]],
  [['farmacia'], [tag('amenity', 'pharmacy')]],
  [['abogad', 'despacho', 'notaria'], [tag('office', 'lawyer'), tag('office', 'notary')]],
  [['contador', 'contable'], [tag('office', 'accountant')]],
  [['inmobiliaria', 'bienes raices'], [tag('office', 'estate_agent')]],
  [['taller', 'mecanic', 'autos'], [tag('shop', 'car_repair')]],
  [['floreria', 'flores'], [tag('shop', 'florist')]],
  [['ropa', 'boutique'], [tag('shop', 'clothes'), tag('shop', 'boutique')]],
  [['zapat'], [tag('shop', 'shoes')]],
  [['optica'], [tag('shop', 'optician')]],
  [['joyeria'], [tag('shop', 'jewelry')]],
  [['escuela', 'colegio', 'academia'], [tag('amenity', 'school'), tag('amenity', 'college')]],
  [['guarderia', 'kinder'], [tag('amenity', 'kindergarten')]],
  [['spa', 'masaje'], [tag('shop', 'massage'), tag('leisure', 'spa')]],
  [['helad', 'nieve'], [tag('amenity', 'ice_cream')]],
  [['ferreteria'], [tag('shop', 'hardware')]],
  [['papeleria'], [tag('shop', 'stationery')]],
  [['lavanderia', 'tintoreria'], [tag('shop', 'laundry'), tag('shop', 'dry_cleaning')]],
  [['mascota'], [tag('shop', 'pet')]],
  [['mueble'], [tag('shop', 'furniture')]],
  [['tatuaje', 'tattoo'], [tag('shop', 'tattoo')]]
];

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const pause = ms => new Promise(r => setTimeout(r, ms));
async function nominatim(params) {
  const res = await fetch(`${NOMINATIM}?${new URLSearchParams({ format: 'jsonv2', 'accept-language': 'es', ...params })}`);
  if (!res.ok) throw new Error('OpenStreetMap no respondió, intenta en un minuto');
  return res.json();
}

function fromOsm(x, where) {
  const t = x.extratags || {}, a = x.address || {};
  const street = [a.road, a.house_number].filter(Boolean).join(' ');
  const address = [street, a.neighbourhood || a.suburb || a.quarter, a.city || a.town || a.borough].filter(Boolean).join(', ');
  const phone = (t.phone || t['contact:phone'] || t['contact:mobile'] || '').split(';')[0].trim();
  const whatsapp = (t['contact:whatsapp'] || '').split(';')[0].trim();
  let website = (t.website || t['contact:website'] || t.url || '').split(';')[0].trim();
  if (website && !/^https?:\/\//.test(website)) website = 'https://' + website;
  return {
    id: `osm-${x.osm_type}-${x.osm_id}`, name: x.name, address, phone, intlPhone: toIntlMx(whatsapp || phone), website,
    rating: null, reviews: 0, mapsUrl: mapsSearchUrl(`${x.name} ${address || where}`),
    lat: Number(x.lat), lng: Number(x.lon)
  };
}

// Nominatim pide máximo 1 consulta por segundo: las búsquedas van una tras otra
async function searchOsm(what, where) {
  const geo = await nominatim({ q: where, countrycodes: 'mx', limit: 1 });
  if (!geo.length) throw new Error(`no encontramos la zona "${where}"`);
  let [s, n, w, e] = geo[0].boundingbox.map(Number);
  // Una ciudad entera es demasiado grande (se recorta a ~6 km) y una colonia muy chica (se amplía a ~2 km)
  const MAX = 0.06, MIN = 0.02;
  const lat = Number(geo[0].lat), lon = Number(geo[0].lon);
  if (n - s > MAX || e - w > MAX) [s, n, w, e] = [lat - MAX / 2, lat + MAX / 2, lon - MAX / 2, lon + MAX / 2];
  else if (n - s < MIN && e - w < MIN) [s, n, w, e] = [lat - MIN / 2, lat + MIN / 2, lon - MIN / 2, lon + MIN / 2];
  const term = norm(what);
  const categories = [...new Set(OSM_CATEGORIES.filter(([keys]) => keys.some(k => term.includes(k))).flatMap(([, f]) => f))].slice(0, 3);
  const byName = term.replace(/[^a-z0-9 ]/g, '').trim().replace(/(es|s)$/, '');
  const found = [];
  for (const q of [...categories, byName].filter(Boolean)) {
    await pause(1100);
    found.push(...await nominatim({ q, viewbox: [w, n, e, s].join(','), bounded: 1, limit: 40, extratags: 1, addressdetails: 1 }));
  }
  const seen = new Set();
  return found
    .filter(x => x.name)
    .map(x => fromOsm(x, where))
    .filter(p => !seen.has(norm(p.name)) && seen.add(norm(p.name)))
    .sort((a, b) => Boolean(b.phone) - Boolean(a.phone) || Boolean(b.website) - Boolean(a.website))
    .slice(0, 40);
}

// ---------- Mapa (Google o Leaflet) ----------
const LEAFLET = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/';
function loadLeaflet() {
  loadLeaflet.promise ||= new Promise((resolve, reject) => {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = LEAFLET + 'leaflet.min.css';
    document.head.appendChild(css);
    const s = document.createElement('script');
    s.src = LEAFLET + 'leaflet.min.js';
    s.onload = resolve;
    s.onerror = () => { loadLeaflet.promise = null; reject(new Error('No se pudo cargar el mapa')); };
    document.head.appendChild(s);
  });
  return loadLeaflet.promise;
}

function ensureMap() {
  ensureMap.promise ||= (async () => {
    const el = $('#prospect-map');
    if (useGoogle) {
      await loadGoogle();
      const { Map } = await google.maps.importLibrary('maps');
      await google.maps.importLibrary('marker');
      prospects.map = new Map(el, {
        center: { lat: 19.4326, lng: -99.1332 }, zoom: 11, mapId: gcfg.mapId || 'DEMO_MAP_ID',
        disableDefaultUI: true, zoomControl: true, gestureHandling: 'cooperative'
      });
    } else {
      await loadLeaflet();
      prospects.map = L.map(el, { scrollWheelZoom: false }).setView([19.4326, -99.1332], 11);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(prospects.map);
    }
  })().catch(e => { ensureMap.promise = null; throw e; });
  return ensureMap.promise;
}

function addPin(p, number) {
  const pin = document.createElement('div');
  pin.className = 'map-pin' + (p.website ? '' : ' is-opportunity');
  pin.textContent = number;
  const onClick = () => focusProspect(p.id, true);
  if (useGoogle) {
    const marker = new google.maps.marker.AdvancedMarkerElement({ map: prospects.map, position: { lat: p.lat, lng: p.lng }, content: pin, title: p.name });
    marker.addListener('click', onClick);
    return { id: p.id, pin, remove: () => { marker.map = null; } };
  }
  const marker = L.marker([p.lat, p.lng], { title: p.name, icon: L.divIcon({ className: 'map-pin-wrap', html: pin, iconSize: [28, 28] }) })
    .addTo(prospects.map).on('click', onClick);
  return { id: p.id, pin, remove: () => marker.remove() };
}

function drawMarkers() {
  if (!prospects.map) return;
  prospects.markers.forEach(m => m.remove());
  prospects.markers = [];
  const points = [];
  filteredProspects().forEach((p, i) => {
    if (p.lat === null) return;
    prospects.markers.push(addPin(p, i + 1));
    points.push([p.lat, p.lng]);
  });
  if (!points.length) return;
  if (points.length === 1) return panTo(points[0], 16);
  if (useGoogle) {
    const bounds = new google.maps.LatLngBounds();
    points.forEach(([lat, lng]) => bounds.extend({ lat, lng }));
    prospects.map.fitBounds(bounds, 50);
  } else {
    prospects.map.fitBounds(points, { padding: [40, 40] });
  }
}

function panTo([lat, lng], zoom) {
  if (useGoogle) {
    prospects.map.panTo({ lat, lng });
    if (zoom) prospects.map.setZoom(zoom);
  } else {
    zoom ? prospects.map.setView([lat, lng], zoom) : prospects.map.panTo([lat, lng]);
  }
}

function focusProspect(id, fromMap) {
  prospects.active = id;
  document.querySelectorAll('.pl-card').forEach(el => el.classList.toggle('is-active', el.dataset.place === id));
  prospects.markers.forEach(m => m.pin.classList.toggle('is-active', m.id === id));
  const p = prospects.list.find(x => x.id === id);
  if (fromMap) document.querySelector(`.pl-card[data-place="${CSS.escape(id)}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  else if (prospects.map && p.lat !== null) panTo([p.lat, p.lng]);
}

// ---------- Búsqueda ----------
async function searchPlaces(what, where) {
  prospects.loading = true;
  prospects.what = what;
  prospects.where = where;
  prospects.active = null;
  renderProspects();
  try {
    prospects.list = useGoogle ? await searchGoogle(what, where) : await searchOsm(what, where);
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
    tags: [prospects.what.trim().toLowerCase(), p.website ? '' : useGoogle ? 'sin web' : 'web por verificar'].filter(Boolean),
    website: p.website || null, address: p.address || null, place_id: p.id, maps_url: p.mapsUrl
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
  const verify = `https://www.google.com/search?q=${encodeURIComponent(`${p.name} ${p.address || prospects.where}`)}`;
  return `<article class="pl-card${prospects.active === p.id ? ' is-active' : ''}" data-place="${esc(p.id)}">
    <span class="pl-num${p.website ? '' : ' is-opportunity'}">${i + 1}</span>
    <div class="pl-body">
      <div class="pl-head">
        <strong>${esc(p.name)}</strong>
        ${p.rating ? `<span class="pl-rating">★ ${p.rating.toFixed(1)} <em>(${p.reviews})</em></span>` : ''}
      </div>
      <p class="pl-address">${esc(p.address) || 'Dirección no registrada'}</p>
      <div class="pl-facts">
        ${p.phone ? `<span class="pl-fact"><svg viewBox="0 0 24 24">${CHANNELS.llamada.icon}</svg>${esc(p.phone)}</span>` : '<span class="pl-fact muted">Sin teléfono registrado</span>'}
        ${p.website
          ? `<a class="pl-fact pl-web" href="${esc(p.website)}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>${esc(shortUrl(p.website))}</a>`
          : `<span class="badge-opportunity">${useGoogle ? 'Sin sitio web · oportunidad' : 'Sin web registrada'}</span>`}
      </div>
      <div class="pl-actions">
        ${wa ? `<a class="mini-btn" href="${wa}" target="_blank" rel="noopener" title="WhatsApp (si el número lo tiene)" aria-label="WhatsApp"><svg viewBox="0 0 24 24">${CHANNELS.whatsapp.icon}</svg></a>` : ''}
        ${p.phone ? `<a class="mini-btn" href="tel:${esc(p.intlPhone || p.phone)}" title="Llamar" aria-label="Llamar"><svg viewBox="0 0 24 24">${CHANNELS.llamada.icon}</svg></a>` : ''}
        <a class="mini-btn mini-text" href="${esc(p.mapsUrl)}" target="_blank" rel="noopener">Ver en Maps</a>
        ${!useGoogle && (!p.website || !p.phone) ? `<a class="mini-btn mini-text" href="${esc(verify)}" target="_blank" rel="noopener" title="Buscar teléfono y web en Google">Verificar en Google</a>` : ''}
        ${inCrm(p)
          ? '<span class="pl-added">✓ En tus clientes</span>'
          : '<button class="btn btn-dark btn-sm pl-add" data-pact="add">+ Agregar al CRM</button>'}
      </div>
    </div>
  </article>`;
}

function renderProspects() {
  $('#maps-banner').hidden = useGoogle;
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
    $('#prospect-list').innerHTML = `<div class="ps-empty"><strong>Sin resultados</strong>
      <p>Prueba otra zona, otro giro o cambia el filtro.</p>
      <a class="btn btn-ghost btn-sm" href="${esc(mapsSearchUrl(`${prospects.what} en ${prospects.where}`))}" target="_blank" rel="noopener">Ver esta búsqueda en Google Maps</a></div>`;
  } else {
    $('#prospect-list').innerHTML = list.map(prospectCard).join('');
  }
  ensureMap().catch(e => toast(e.message));
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
