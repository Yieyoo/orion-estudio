// Demos interactivos que se abren desde el carrusel de conceptos.
// Cada demo es un mini sitio con su propia identidad y funciones reales (carrito, calendario, reservas, pedidos).
(() => {
  const img = (id, w = 900) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;
  const money = n => "$" + Math.round(n).toLocaleString("es-MX");
  const $ = (root, selector) => root.querySelector(selector);
  const $$ = (root, selector) => [...root.querySelectorAll(selector)];
  const svg = path => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${path}</svg>`;
  const I = {
    bag: svg('<path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>'),
    heart: svg('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
    minus: svg('<path d="M5 12h14"/>'),
    close: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
    check: svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
    arrow: svg('<path d="M6 18 18 6M8 6h10v10"/>'),
    right: svg('<path d="M5 12h14m-6-6 6 6-6 6"/>'),
    left: svg('<path d="M19 12H5m6-6-6 6 6 6"/>'),
    down: svg('<path d="M12 5v14m-6-6 6 6 6-6"/>'),
    search: svg('<circle cx="11" cy="11" r="6"/><path d="m20 20-4.5-4.5"/>'),
    chili: svg('<path d="M14 6c-1-2 0-3 2-3"/><path d="M14 6c3 0 5 2 4 6-1.5 5-7 8-12 8 3-2 5-5 5-9 0-3 1-5 3-5z"/>'),
    leaf: svg('<path d="M5 19c0-8 5-14 14-14 0 9-6 14-14 14z"/><path d="M5 19 13 11"/>'),
    star: svg('<path d="m12 4 2.4 5 5.4.6-4 3.7 1.1 5.3L12 16l-4.9 2.6 1.1-5.3-4-3.7 5.4-.6z"/>'),
    users: svg('<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 5a3 3 0 0 1 0 6M18 14c2 .6 3 2.8 3 6"/>'),
    clock: svg('<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>'),
    cal: svg('<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>'),
    pin: svg('<path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z"/><circle cx="12" cy="10" r="2"/>'),
    spark: svg('<path d="M12 3c.6 4.6 3.4 7.4 9 9-5.6 1.6-8.4 4.4-9 9-.6-4.6-3.4-7.4-9-9 5.6-1.6 8.4-4.4 9-9z"/>'),
    drag: svg('<path d="m9 7-5 5 5 5M15 7l5 5-5 5"/>'),
    pot: svg('<path d="M4 11h16v3a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6v-3z"/><path d="M2 11h20M9 7c0-1 1-1 1-2M14 7c0-1 1-1 1-2"/>'),
    truck: svg('<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17" r="1.6"/><circle cx="17" cy="17" r="1.6"/>'),
    shield: svg('<path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3z"/><path d="m9 12 2 2 4-4"/>'),
    refresh: svg('<path d="M20 11a8 8 0 0 0-14-4.5L4 9M4 4v5h5M4 13a8 8 0 0 0 14 4.5l2-2.5M20 20v-5h-5"/>')
  };

  let cleanups = [];
  const later = (fn, ms) => { const id = setTimeout(fn, ms); cleanups.push(() => clearTimeout(id)); return id; };
  const every = (fn, ms) => { const id = setInterval(fn, ms); cleanups.push(() => clearInterval(id)); return id; };

  function tween(el, to, { duration = 700, format = money } = {}) {
    const from = Number(el.dataset.value || 0);
    el.dataset.value = to;
    const start = performance.now();
    const step = now => {
      const t = Math.min((now - start) / duration, 1);
      el.textContent = format(from + (to - from) * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function toast(root, message) {
    const layer = $(root, ".demo-layer");
    const note = document.createElement("div");
    note.className = "demo-toast";
    note.innerHTML = `${I.check}<span>${message}</span>`;
    layer.append(note);
    later(() => note.classList.add("is-out"), 2600);
    later(() => note.remove(), 3100);
  }

  // Anima un elemento (foto del producto) volando hacia otro (la bolsa)
  function fly(root, fromEl, toEl) {
    const layer = $(root, ".demo-layer");
    const layerRect = layer.getBoundingClientRect();
    const a = fromEl.getBoundingClientRect();
    const b = toEl.getBoundingClientRect();
    const dot = document.createElement("div");
    dot.className = "demo-fly";
    if (fromEl.tagName === "IMG") dot.style.backgroundImage = `url("${fromEl.currentSrc || fromEl.src}")`;
    dot.style.left = `${a.left - layerRect.left + a.width / 2 - 32}px`;
    dot.style.top = `${a.top - layerRect.top + a.height / 2 - 32}px`;
    layer.append(dot);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2);
    const dy = b.top + b.height / 2 - (a.top + a.height / 2);
    dot.animate([
      { transform: "translate(0,0) scale(1)", opacity: 1 },
      { transform: `translate(${dx * 0.45}px,${dy * 0.45 - 70}px) scale(.75)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${dx}px,${dy}px) scale(.18)`, opacity: 0.5 }
    ], { duration: 800, easing: "cubic-bezier(.55,0,.25,1)" }).onfinish = () => {
      dot.remove();
      toEl.classList.remove("is-bump");
      void toEl.offsetWidth;
      toEl.classList.add("is-bump");
    };
  }

  // Muestra con animación los elementos conforme entran en la ventana de la demo
  function observe(root, scroller) {
    let pending = $$(root, "[data-reveal],[data-count]");
    let frame = 0;
    const check = () => {
      frame = 0;
      const box = scroller.getBoundingClientRect();
      const limit = box.bottom - box.height * 0.08;
      pending = pending.filter(el => {
        const r = el.getBoundingClientRect();
        if (r.top >= limit || r.bottom <= box.top) return true;
        el.classList.add("is-in");
        if (el.dataset.count) tween(el, Number(el.dataset.count), { duration: 1600, format: n => Math.round(n).toLocaleString("es-MX") + (el.dataset.suffix || "") });
        return false;
      });
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(check); };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    cleanups.push(() => { scroller.removeEventListener("scroll", onScroll); cancelAnimationFrame(frame); });
    check();
    later(check, 120);
  }

  const cta = `<a class="demo-cta" href="#contacto" data-concept-contact>${I.spark}<span>¿Te gusta? <b>Hagamos el tuyo</b></span>${I.arrow}</a>`;

  /* ---------------------------------------------------------------- Tienda en línea */
  const storeProducts = [
    { id: "nara", name: "Bolso Nara", cat: "Accesorios", price: 1890, img: "1548036328-c9fa89d128fa", badge: "Favorito", note: "Piel curtida a mano" },
    { id: "alba", name: "Camisa Alba", cat: "Textiles", price: 1250, img: "1529139574466-a303027c1d8b", badge: "Nuevo", note: "Lino europeo lavado" },
    { id: "bruma", name: "Jarrón Bruma", cat: "Cerámica", price: 680, img: "1578749556568-bc2c40e68b61", badge: "Hecho a mano", note: "Cada pieza es única" },
    { id: "arena", name: "Set Arena", cat: "Cerámica", price: 540, img: "1610701596007-11502861dcfa", note: "4 tazas de gres" },
    { id: "sol", name: "Cojín Sol", cat: "Textiles", price: 420, img: "1584100936595-c0654b55a2e2", note: "Algodón orgánico" },
    { id: "brisa", name: "Camisa Brisa", cat: "Textiles", price: 1180, img: "1602810318383-e386cc2a3ccf", note: "Tres tonos de temporada" },
    { id: "perla", name: "Collar Perla", cat: "Accesorios", price: 2350, img: "1515562141207-7a88fb7ce338", badge: "Edición limitada", note: "Perla cultivada y plata" },
    { id: "mostaza", name: "Sillón Mostaza", cat: "Hogar", price: 8900, img: "1586023492125-27b2c045efd7", note: "Terciopelo y roble" }
  ];
  const swatches = [["#c9b49a", "none"], ["#8f9c7c", "hue-rotate(45deg) saturate(.85)"], ["#b9806e", "hue-rotate(-28deg) saturate(1.25)"]];
  const FREE_SHIPPING = 1500;

  const store = {
    domain: "casalino.mx",
    html: () => `
    <div class="demo demo-store">
      <div class="st-marquee" aria-hidden="true"><div>${"<span>Envío gratis desde $1,500</span><i></i><span>Hecho en México</span><i></i><span>Devoluciones en 30 días</span><i></i><span>Meses sin intereses</span><i></i>".repeat(4)}</div></div>
      <header class="st-nav">
        <a class="st-brand" href="#st-top">casa lino<span>.</span></a>
        <nav><a href="#st-shop">Tienda</a><a href="#st-story">Historia</a><a href="#st-club">Club</a></nav>
        <div class="st-actions">
          <button class="st-icon" type="button" data-wish aria-label="Favoritos">${I.heart}<b>0</b></button>
          <button class="st-bag" type="button" data-open-cart>${I.bag}<span>Bolsa</span><b data-bag-count>0</b></button>
        </div>
      </header>
      <section class="st-hero" id="st-top">
        <div class="st-hero-copy">
          <small class="st-kicker" data-reveal>Colección otoño · 2026</small>
          <h1 class="st-title"><span style="--i:0">Un poco</span> <span style="--i:1">más de</span> <em style="--i:2">calma</em> <span style="--i:3">en casa.</span></h1>
          <p data-reveal>Textiles, cerámica y objetos hechos por talleres mexicanos para acompañar tus rituales de todos los días.</p>
          <div class="st-hero-cta" data-reveal>
            <a class="st-btn" href="#st-shop">Explorar colección ${I.down}</a>
            <span class="st-rating">${I.star.repeat(5)} <b>4.9</b> · 2,300 reseñas</span>
          </div>
        </div>
        <div class="st-hero-media" data-tilt>
          <img src="${img("1616486338812-3dadae4b4ace", 1100)}" alt="Sala cálida con objetos de diseño">
          <div class="st-spot" style="--x:66%;--y:62%">
            <button type="button" data-spot aria-label="Ver producto en la foto"></button>
            <div class="st-spot-card"><img src="${img("1578749556568-bc2c40e68b61", 200)}" alt=""><div><b>Jarrón Bruma</b><span>$680</span></div><button type="button" data-add="bruma">${I.plus}</button></div>
          </div>
          <div class="st-spot" style="--x:28%;--y:70%">
            <button type="button" data-spot aria-label="Ver producto en la foto"></button>
            <div class="st-spot-card"><img src="${img("1584100936595-c0654b55a2e2", 200)}" alt=""><div><b>Cojín Sol</b><span>$420</span></div><button type="button" data-add="sol">${I.plus}</button></div>
          </div>
          <span class="st-hero-tag">Toca los puntos · foto comprable</span>
        </div>
      </section>
      <section class="st-perks">
        <div data-reveal>${I.truck}<b>Envío gratis</b><span>Desde $1,500 a todo México</span></div>
        <div data-reveal>${I.refresh}<b>30 días</b><span>Para cambios y devoluciones</span></div>
        <div data-reveal>${I.shield}<b>Pago seguro</b><span>Tarjeta, OXXO y transferencia</span></div>
      </section>
      <section class="st-shop" id="st-shop">
        <div class="st-head">
          <div><small class="st-kicker">Selección del estudio</small><h2>Piezas para quedarte.</h2></div>
          <div class="st-chips" role="tablist">${["Todo", "Textiles", "Cerámica", "Accesorios", "Hogar"].map((c, i) => `<button type="button" class="${i ? "" : "is-on"}" data-filter="${c}">${c}</button>`).join("")}</div>
        </div>
        <div class="st-grid">${storeProducts.map(p => `
          <article class="st-card" data-cat="${p.cat}" data-reveal>
            <div class="st-media">
              <img src="${img(p.img, 700)}" alt="${p.name}" loading="lazy" data-img="${p.id}">
              ${p.badge ? `<span class="st-badge">${p.badge}</span>` : ""}
              <button class="st-heart" type="button" data-heart aria-label="Agregar a favoritos">${I.heart}</button>
              <button class="st-quick" type="button" data-add="${p.id}">${I.plus} Añadir a la bolsa</button>
            </div>
            <div class="st-info">
              <div><small>${p.cat}</small><h3>${p.name}</h3><p>${p.note}</p></div>
              <b>${money(p.price)}</b>
            </div>
            <div class="st-swatches">${swatches.map(([color, filter], i) => `<button type="button" class="${i ? "" : "is-on"}" style="--c:${color}" data-swatch="${filter}" aria-label="Color ${i + 1}"></button>`).join("")}</div>
          </article>`).join("")}
        </div>
      </section>
      <section class="st-story" id="st-story">
        <div class="st-story-img" data-reveal><img src="${img("1493663284031-b7e3aefcae8e", 1100)}" alt="Sala luminosa" loading="lazy"></div>
        <div class="st-story-copy">
          <small class="st-kicker">Hecho con tiempo</small>
          <h2 data-reveal>Elegir menos.<br><em>Elegir mejor.</em></h2>
          <p data-reveal>Trabajamos con talleres independientes de Oaxaca, Puebla y Jalisco. Materiales nobles, pagos justos y piezas que duran años.</p>
          <div class="st-stats">
            <div><b data-count="12">0</b><span>talleres aliados</span></div>
            <div><b data-count="3400" data-suffix="+">0</b><span>piezas entregadas</span></div>
            <div><b data-count="98" data-suffix="%">0</b><span>clientes que regresan</span></div>
          </div>
        </div>
      </section>
      <section class="st-club" id="st-club">
        <h2 data-reveal>Únete al club y recibe <em>10% de descuento</em> en tu primera compra.</h2>
        <form class="st-form" data-news><input type="email" placeholder="tu@correo.com" aria-label="Correo" required><button class="st-btn" type="submit">Suscribirme</button></form>
      </section>
      <footer class="st-foot"><span class="st-brand">casa lino<span>.</span></span><span>Objetos con intención · Ciudad de México</span><span>Instagram · Pinterest · TikTok</span></footer>
      <div class="demo-layer">
        <div class="demo-scrim" data-close-cart></div>
        <aside class="st-drawer" aria-label="Tu bolsa">
          <header><b>Tu bolsa</b><button type="button" data-close-cart aria-label="Cerrar">${I.close}</button></header>
          <div class="st-meter"><p data-ship-text></p><div><i data-ship-bar></i></div></div>
          <div class="st-lines" data-lines></div>
          <footer>
            <div class="st-sub"><span>Subtotal</span><b data-subtotal>$0</b></div>
            <button class="st-btn st-pay" type="button" data-checkout>Pagar de forma segura ${I.shield}</button>
            <small>Hasta 12 meses sin intereses · OXXO · Transferencia</small>
          </footer>
          <div class="st-done" data-done>
            <div class="demo-check">${I.check}</div>
            <h3>¡Pedido confirmado!</h3>
            <p>Orden <b data-order></b>. Te enviamos el seguimiento por correo y WhatsApp.</p>
            <button class="st-btn" type="button" data-close-cart>Seguir comprando</button>
            <div class="demo-confetti">${Array.from({ length: 18 }, (_, i) => `<i style="--i:${i}"></i>`).join("")}</div>
          </div>
        </aside>
        ${cta}
      </div>
    </div>`,
    init(root) {
      const cart = new Map();
      const product = id => storeProducts.find(p => p.id === id);
      const bag = $(root, "[data-open-cart]");
      const render = () => {
        const lines = [...cart.entries()];
        const subtotal = lines.reduce((sum, [id, qty]) => sum + product(id).price * qty, 0);
        const count = lines.reduce((sum, [, qty]) => sum + qty, 0);
        $(root, "[data-bag-count]").textContent = count;
        $(root, "[data-lines]").innerHTML = lines.length ? lines.map(([id, qty]) => {
          const p = product(id);
          return `<div class="st-line"><img src="${img(p.img, 160)}" alt=""><div><b>${p.name}</b><small>${p.cat}</small>
            <div class="demo-stepper"><button type="button" data-qty="${id}" data-d="-1" aria-label="Quitar uno">${I.minus}</button><span>${qty}</span><button type="button" data-qty="${id}" data-d="1" aria-label="Agregar uno">${I.plus}</button></div></div>
            <strong>${money(p.price * qty)}</strong></div>`;
        }).join("") : `<div class="st-empty">${I.bag}<p>Tu bolsa está vacía.<br>Empieza por algo bonito.</p></div>`;
        tween($(root, "[data-subtotal]"), subtotal);
        const missing = Math.max(FREE_SHIPPING - subtotal, 0);
        $(root, "[data-ship-text]").innerHTML = missing ? `Te faltan <b>${money(missing)}</b> para envío gratis` : `<b>¡Tienes envío gratis!</b> ${I.truck}`;
        $(root, "[data-ship-bar]").style.width = `${Math.min(subtotal / FREE_SHIPPING, 1) * 100}%`;
        $(root, "[data-checkout]").disabled = !count;
      };
      const add = (id, source) => {
        cart.set(id, (cart.get(id) || 0) + 1);
        render();
        const photo = source?.closest(".st-card, .st-spot-card")?.querySelector("img");
        if (photo) fly(root, photo, bag);
        toast(root, `${product(id).name} se agregó a tu bolsa`);
      };
      const setCart = open => root.classList.toggle("is-cart-open", open);

      root.addEventListener("click", event => {
        const t = event.target;
        const addBtn = t.closest("[data-add]");
        if (addBtn) { add(addBtn.dataset.add, addBtn); return; }
        if (t.closest("[data-open-cart]")) { root.classList.remove("is-done"); setCart(true); return; }
        if (t.closest("[data-close-cart]")) { setCart(false); later(() => root.classList.remove("is-done"), 400); return; }
        const qty = t.closest("[data-qty]");
        if (qty) {
          const next = (cart.get(qty.dataset.qty) || 0) + Number(qty.dataset.d);
          next > 0 ? cart.set(qty.dataset.qty, next) : cart.delete(qty.dataset.qty);
          render();
          return;
        }
        if (t.closest("[data-checkout]")) {
          $(root, "[data-order]").textContent = "#CL-" + Math.floor(10000 + Math.random() * 89999);
          root.classList.add("is-done");
          cart.clear();
          later(render, 500);
          return;
        }
        const filter = t.closest("[data-filter]");
        if (filter) {
          $$(root, "[data-filter]").forEach(b => b.classList.toggle("is-on", b === filter));
          $$(root, ".st-card").forEach(card => {
            const show = filter.dataset.filter === "Todo" || card.dataset.cat === filter.dataset.filter;
            card.classList.toggle("is-hidden", !show);
          });
          return;
        }
        const swatch = t.closest("[data-swatch]");
        if (swatch) {
          const card = swatch.closest(".st-card");
          $$(card, "[data-swatch]").forEach(b => b.classList.toggle("is-on", b === swatch));
          $(card, "img").style.filter = swatch.dataset.swatch;
          return;
        }
        const heart = t.closest("[data-heart]");
        if (heart) {
          heart.classList.toggle("is-on");
          const wish = $(root, "[data-wish]");
          $(wish, "b").textContent = $$(root, "[data-heart].is-on").length;
          wish.classList.remove("is-bump"); void wish.offsetWidth; wish.classList.add("is-bump");
          return;
        }
        const spot = t.closest("[data-spot]");
        if (spot) {
          const wrap = spot.parentElement;
          $$(root, ".st-spot").forEach(s => s !== wrap && s.classList.remove("is-open"));
          wrap.classList.toggle("is-open");
        }
      });
      $(root, "[data-news]").addEventListener("submit", event => {
        event.preventDefault();
        event.target.innerHTML = `<p class="st-thanks">${I.check} ¡Bienvenida al club! Tu código: <b>CALMA10</b></p>`;
      });

      // La foto del hero se inclina siguiendo el cursor
      const media = $(root, "[data-tilt]");
      media.addEventListener("pointermove", event => {
        const r = media.getBoundingClientRect();
        const x = (event.clientX - r.left) / r.width - 0.5;
        const y = (event.clientY - r.top) / r.height - 0.5;
        media.style.transform = `perspective(900px) rotateY(${x * 7}deg) rotateX(${-y * 7}deg)`;
      });
      media.addEventListener("pointerleave", () => { media.style.transform = ""; });
      render();
    }
  };

  /* ---------------------------------------------------------------- Servicios profesionales */
  const archProjects = [
    { name: "Casa Alberca", place: "Valle de Bravo", year: 2025, area: 420, type: "Residencial", img: "1512917774080-9991f1c4c750" },
    { name: "Casa Encino", place: "Querétaro", year: 2024, area: 360, type: "Residencial", img: "1600585154340-be6161a56a0c" },
    { name: "Casa Blanca", place: "Mérida", year: 2024, area: 510, type: "Residencial", img: "1600596542815-ffad4c1539a9" },
    { name: "Casa del Patio", place: "Valle de Bravo", year: 2023, area: 280, type: "Interiorismo", img: "1600210492486-724fe5c67fb0" },
    { name: "Espacio Niebla", place: "Ciudad de México", year: 2023, area: 190, type: "Interiorismo", img: "1600566753086-00f18fb6b3ea" },
    { name: "Estudio Roble", place: "Monterrey", year: 2022, area: 240, type: "Comercial", img: "1600047509807-ba8f99d2cdde" }
  ];

  const professional = {
    domain: "arista.mx",
    html: () => `
    <div class="demo demo-arch">
      <header class="ar-nav"><a class="ar-brand" href="#ar-top">ARISTA<span>/</span></a><nav><a href="#ar-work">Proyectos</a><a href="#ar-process">Proceso</a><a href="#ar-quote">Cotizar</a></nav><a class="ar-pill" href="#ar-quote">Iniciar proyecto ${I.arrow}</a></header>
      <section class="ar-hero" id="ar-top">
        <img src="${img("1600585154340-be6161a56a0c", 1600)}" alt="Casa contemporánea al atardecer">
        <div class="ar-hero-copy">
          <small>Arquitectura · Interiorismo · Desde 2014</small>
          <h1><span><i>Espacios</i></span><span><i>que se sienten</i></span><span><i>propios.</i></span></h1>
        </div>
        <div class="ar-hero-bar"><span>01 — Casa Encino, Querétaro</span><a href="#ar-work">Desliza ${I.down}</a></div>
      </section>
      <section class="ar-numbers">
        <div><b data-count="12">0</b><span>años de práctica</span></div>
        <div><b data-count="86">0</b><span>proyectos construidos</span></div>
        <div><b data-count="34000" data-suffix=" m²">0</b><span>diseñados</span></div>
        <div><b data-count="9">0</b><span>reconocimientos</span></div>
      </section>
      <section class="ar-compare-wrap">
        <div class="ar-intro"><small class="ar-kicker">Del papel al espacio</small><h2 data-reveal>Lo que imaginas,<br>construido al milímetro.</h2><p data-reveal>Arrastra para comparar el boceto con el resultado final.</p></div>
        <div class="ar-compare" style="--pos:50%">
          <img src="${img("1600121848594-d8644e57abab", 1400)}" alt="Sala terminada" loading="lazy">
          <div class="ar-before"><img src="${img("1600121848594-d8644e57abab", 1400)}" alt="" loading="lazy"></div>
          <div class="ar-handle"><span>${I.drag}</span></div>
          <b class="ar-tag ar-tag-l">Boceto</b><b class="ar-tag ar-tag-r">Resultado</b>
          <input type="range" min="0" max="100" value="50" aria-label="Comparar boceto y resultado" data-compare>
        </div>
      </section>
      <section class="ar-work" id="ar-work">
        <div class="ar-work-head"><div><small class="ar-kicker">Trabajo seleccionado</small><h2>Hecho para durar.</h2></div><div class="ar-arrows"><button type="button" data-slide="-1" aria-label="Anterior">${I.left}</button><button type="button" data-slide="1" aria-label="Siguiente">${I.right}</button></div></div>
        <div class="ar-track" data-track>${archProjects.map((p, i) => `
          <button class="ar-project" type="button" data-project="${i}">
            <span class="ar-project-img"><img src="${img(p.img, 900)}" alt="${p.name}" loading="lazy"><em>Ver proyecto ${I.arrow}</em></span>
            <span class="ar-project-meta"><b>${String(i + 1).padStart(2, "0")}</b><strong>${p.name}</strong><small>${p.place} · ${p.year}</small></span>
          </button>`).join("")}
        </div>
      </section>
      <section class="ar-process" id="ar-process">
        <small class="ar-kicker">Cómo trabajamos</small>
        <h2 data-reveal>Cuatro pasos. Cero sorpresas.</h2>
        <div class="ar-steps" data-steps>
          <i class="ar-line"><i></i></i>
          ${[["Escuchar", "Visitamos el terreno y entendemos cómo vives."], ["Imaginar", "Bocetos, maqueta 3D y recorrido virtual."], ["Detallar", "Planos ejecutivos, materiales y presupuesto cerrado."], ["Construir", "Supervisión en obra hasta entregarte las llaves."]].map(([title, text], i) => `<div class="ar-step" data-reveal><b>0${i + 1}</b><h3>${title}</h3><p>${text}</p></div>`).join("")}
        </div>
      </section>
      <section class="ar-quote" id="ar-quote">
        <div class="ar-quote-copy"><small class="ar-kicker">Cotizador en línea</small><h2 data-reveal>¿Cuánto cuesta<br>tu proyecto?</h2><p data-reveal>Una estimación al instante. Te enviamos la propuesta detallada en 48 horas.</p></div>
        <form class="ar-form" data-quote>
          <fieldset><legend>Tipo de proyecto</legend><div class="ar-seg">${[["Residencial", 14000], ["Interiorismo", 6500], ["Comercial", 11000]].map(([name, rate], i) => `<label><input type="radio" name="ar-type" value="${rate}" ${i ? "" : "checked"}><span>${name}</span></label>`).join("")}</div></fieldset>
          <fieldset><legend>Superficie <b data-area-out>180 m²</b></legend><input class="ar-range" type="range" min="40" max="800" step="10" value="180" data-area aria-label="Superficie en metros cuadrados"></fieldset>
          <fieldset><legend>Nivel de acabados</legend><div class="ar-seg">${[["Esencial", 1], ["Premium", 1.35], ["A medida", 1.8]].map(([name, factor], i) => `<label><input type="radio" name="ar-finish" value="${factor}" ${i === 1 ? "checked" : ""}><span>${name}</span></label>`).join("")}</div></fieldset>
          <div class="ar-result"><span>Inversión estimada</span><strong><b data-low>$0</b> – <b data-high>$0</b> MXN</strong><small data-time></small></div>
          <button class="ar-pill ar-submit" type="submit">Agendar llamada gratuita ${I.arrow}</button>
          <div class="ar-sent">${I.check}<div><b>¡Listo! Te llamamos mañana.</b><span>Revisa tu correo: te enviamos la estimación en PDF.</span></div></div>
        </form>
      </section>
      <footer class="ar-foot"><span class="ar-brand">ARISTA<span>/</span></span><span>Colonia Roma · CDMX</span><span>hola@arista.mx</span></footer>
      <div class="demo-layer">
        <div class="demo-scrim" data-close-project></div>
        <article class="ar-sheet" data-sheet></article>
        ${cta}
      </div>
    </div>`,
    init(root, scroller) {
      const compare = $(root, ".ar-compare");
      $(root, "[data-compare]").addEventListener("input", event => compare.style.setProperty("--pos", `${event.target.value}%`));

      const track = $(root, "[data-track]");
      let current = 0;
      const showProject = i => {
        current = (i + archProjects.length) % archProjects.length;
        const p = archProjects[current];
        $(root, "[data-sheet]").innerHTML = `
          <img src="${img(p.img, 1400)}" alt="${p.name}">
          <div class="ar-sheet-body">
            <small class="ar-kicker">${String(current + 1).padStart(2, "0")} / ${p.type}</small>
            <h3>${p.name}</h3>
            <dl><div><dt>Ubicación</dt><dd>${p.place}</dd></div><div><dt>Año</dt><dd>${p.year}</dd></div><div><dt>Superficie</dt><dd>${p.area} m²</dd></div></dl>
            <p>Un proyecto que dialoga con su entorno: luz natural, materiales locales y espacios que se abren al paisaje.</p>
            <div class="ar-sheet-nav"><button type="button" data-step-project="-1">${I.left} Anterior</button><button type="button" data-step-project="1">Siguiente ${I.right}</button></div>
          </div>
          <button class="ar-sheet-close" type="button" data-close-project aria-label="Cerrar">${I.close}</button>`;
        root.classList.add("is-sheet-open");
      };
      root.addEventListener("click", event => {
        const t = event.target;
        const slide = t.closest("[data-slide]");
        if (slide) track.scrollBy({ left: Number(slide.dataset.slide) * track.clientWidth * 0.8, behavior: "smooth" });
        const project = t.closest("[data-project]");
        if (project) showProject(Number(project.dataset.project));
        const step = t.closest("[data-step-project]");
        if (step) showProject(current + Number(step.dataset.stepProject));
        if (t.closest("[data-close-project]")) root.classList.remove("is-sheet-open");
      });

      // La línea del proceso se llena conforme bajas
      const steps = $(root, "[data-steps]");
      const onScroll = () => {
        const box = scroller.getBoundingClientRect();
        const r = steps.getBoundingClientRect();
        const progress = (box.bottom - r.top - box.height * 0.25) / (r.height + box.height * 0.2);
        steps.style.setProperty("--p", Math.max(0, Math.min(1, progress)).toFixed(3));
      };
      scroller.addEventListener("scroll", onScroll, { passive: true });
      cleanups.push(() => scroller.removeEventListener("scroll", onScroll));

      const form = $(root, "[data-quote]");
      const update = () => {
        const rate = Number(form.elements["ar-type"].value);
        const factor = Number(form.elements["ar-finish"].value);
        const area = Number($(root, "[data-area]").value);
        $(root, "[data-area-out]").textContent = `${area} m²`;
        $(root, "[data-area]").style.setProperty("--fill", `${(area - 40) / 760 * 100}%`);
        const base = rate * factor * area;
        tween($(root, "[data-low]"), base * 0.88);
        tween($(root, "[data-high]"), base * 1.12);
        $(root, "[data-time]").textContent = `Tiempo estimado: ${Math.ceil(area / 70) + 3} meses de diseño y obra`;
      };
      form.addEventListener("input", update);
      form.addEventListener("submit", event => { event.preventDefault(); form.classList.add("is-sent"); });
      update();
    }
  };

  /* ---------------------------------------------------------------- Eventos y espacios */
  const eventPackages = [
    { name: "Íntimo", pp: 890, text: "Hasta 60 invitados · jardín" },
    { name: "Clásico", pp: 1250, text: "Ceremonia + banquete de 4 tiempos" },
    { name: "Gran celebración", pp: 1690, text: "Todo incluido · barra libre" }
  ];
  const eventExtras = [
    { name: "Música en vivo", price: 18000 },
    { name: "Fotografía y video", price: 22000 },
    { name: "Barra de mixología", perPerson: 160 }
  ];
  const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const weekdays = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

  const events = {
    domain: "casaolivo.mx",
    html: () => `
    <div class="demo demo-events">
      <header class="ev-nav"><a class="ev-brand" href="#ev-top">${I.leaf}Casa Olivo</a><nav><a href="#ev-spaces">El lugar</a><a href="#ev-plan">Planea</a><a href="#ev-gallery">Galería</a></nav><a class="ev-btn ev-btn-sm" href="#ev-plan">Consultar fecha</a></header>
      <section class="ev-hero" id="ev-top">
        <img src="${img("1523438885200-e635ba2c371e", 1600)}" alt="Jardín decorado con flores para una boda">
        <div class="ev-petals" aria-hidden="true">${Array.from({ length: 16 }, (_, i) => `<i style="--x:${(i * 37) % 100}%;--d:${(i % 5) * 1.3}s;--t:${9 + (i % 4) * 2.5}s;--s:${0.6 + (i % 3) * 0.3}"></i>`).join("")}</div>
        <div class="ev-hero-copy">
          <small>Valle de Bravo · Desde 2018</small>
          <h1>Hay días que merecen <em>su propio lugar.</em></h1>
          <a class="ev-btn" href="#ev-plan">Planea tu celebración ${I.down}</a>
        </div>
      </section>
      <section class="ev-intro"><p data-reveal>“Un jardín entre árboles, un salón con luz de tarde y un equipo que cuida cada detalle para que tú solo te dediques a disfrutar.”</p></section>
      <section class="ev-spaces" id="ev-spaces">${[["El jardín", "Ceremonias al aire libre para hasta 300 invitados.", "1464366400600-7168b8af9bc3"], ["El salón", "Una mesa larga, buena comida y todos cerca.", "1511795409834-ef04bbd61622"], ["La terraza", "Cocteles al atardecer con vista al lago.", "1519225421980-715cb0215aed"]].map(([title, text, id], i) => `
        <article data-reveal style="--delay:${i * 0.12}s"><div><img src="${img(id, 800)}" alt="${title}" loading="lazy"></div><small>0${i + 1}</small><h3>${title}</h3><p>${text}</p></article>`).join("")}
      </section>
      <section class="ev-plan" id="ev-plan">
        <div class="ev-plan-head"><small>Planeador en línea</small><h2>Elige tu fecha y arma <em>tu celebración.</em></h2></div>
        <div class="ev-planner">
          <div class="ev-cal">
            <div class="ev-cal-head"><button type="button" data-month="-1" aria-label="Mes anterior">${I.left}</button><b data-month-label></b><button type="button" data-month="1" aria-label="Mes siguiente">${I.right}</button></div>
            <div class="ev-week">${["L", "M", "M", "J", "V", "S", "D"].map(d => `<span>${d}</span>`).join("")}</div>
            <div class="ev-days" data-days></div>
            <div class="ev-legend"><span><i class="free"></i>Disponible</span><span><i class="hot"></i>Pocas fechas</span><span><i class="taken"></i>Reservado</span></div>
          </div>
          <div class="ev-options">
            <label class="ev-field"><span>${I.users} Invitados <b data-guests-out>120</b></span><input class="ev-range" type="range" min="20" max="300" step="10" value="120" data-guests></label>
            <div class="ev-packs">${eventPackages.map((p, i) => `<label><input type="radio" name="ev-pack" value="${i}" ${i === 1 ? "checked" : ""}><span><b>${p.name}</b><small>${p.text}</small><em>${money(p.pp)} / persona</em></span></label>`).join("")}</div>
            <div class="ev-extras">${eventExtras.map((e, i) => `<label><input type="checkbox" value="${i}"><span>${I.plus}${e.name}</span></label>`).join("")}</div>
          </div>
          <aside class="ev-summary">
            <small>Tu celebración</small>
            <p data-date-out>Elige una fecha en el calendario</p>
            <div class="ev-total"><span>Total estimado</span><b data-total>$0</b><small data-pp></small></div>
            <button class="ev-btn" type="button" data-book disabled>Apartar fecha</button>
            <small class="ev-fine">Apartas con 10%. Sin cargos ocultos.</small>
          </aside>
        </div>
      </section>
      <section class="ev-gallery" id="ev-gallery">
        <h2 data-reveal>Momentos en <em>Casa Olivo</em></h2>
        <div class="ev-masonry">${["1519741497674-611481863552", "1465495976277-4387d4b0b4c6", "1511285560929-80b456fea0bc", "1519167758481-83f550bb49b3", "1519225421980-715cb0215aed", "1464366400600-7168b8af9bc3"].map((id, i) => `<button type="button" data-photo="${i}" data-src="${img(id, 1400)}"><img src="${img(id, 700)}" alt="Celebración ${i + 1}" loading="lazy"></button>`).join("")}</div>
      </section>
      <section class="ev-quotes">
        <div class="ev-quote-track" data-quotes>
          ${[["Desde la primera visita supimos que era aquí. Nuestros invitados siguen hablando de esa noche.", "Ana y Luis · Boda, 2025"], ["Organizaron todo con una calma increíble. Nosotros solo llegamos a disfrutar.", "Familia Treviño · XV años"], ["El jardín al atardecer es otra cosa. Las fotos quedaron como de revista.", "Mariana · Aniversario"]].map(([q, who], i) => `<figure class="${i ? "" : "is-on"}"><blockquote>“${q}”</blockquote><figcaption>${who}</figcaption></figure>`).join("")}
        </div>
        <div class="ev-dots">${[0, 1, 2].map(i => `<button type="button" class="${i ? "" : "is-on"}" data-quote="${i}" aria-label="Testimonio ${i + 1}"></button>`).join("")}</div>
      </section>
      <footer class="ev-foot"><span class="ev-brand">${I.leaf}Casa Olivo</span><span>${I.pin} Valle de Bravo, Estado de México</span><span>Visitas de martes a domingo</span></footer>
      <div class="demo-layer">
        <div class="demo-scrim" data-close-layer></div>
        <div class="ev-lightbox" data-lightbox><img alt=""><button type="button" class="ev-lb-prev" data-lb="-1" aria-label="Anterior">${I.left}</button><button type="button" class="ev-lb-next" data-lb="1" aria-label="Siguiente">${I.right}</button><button type="button" class="ev-lb-close" data-close-layer aria-label="Cerrar">${I.close}</button></div>
        <div class="ev-ticket" data-ticket></div>
        ${cta}
      </div>
    </div>`,
    init(root) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const view = new Date(today.getFullYear(), today.getMonth(), 1);
      let selected = null;
      // Disponibilidad simulada pero estable: cada día siempre tiene el mismo estado
      const status = date => {
        if (date < today) return "past";
        const seed = (date.getDate() * 31 + date.getMonth() * 17 + date.getFullYear()) % 11;
        if (seed === 0 || seed === 4) return "taken";
        if (date.getDay() === 6 && seed % 2) return "taken";
        if (date.getDay() === 6 || date.getDay() === 5) return "hot";
        return "free";
      };
      const renderCal = () => {
        $(root, "[data-month-label]").textContent = `${months[view.getMonth()]} ${view.getFullYear()}`;
        const offset = (view.getDay() + 6) % 7;
        const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
        let html = "<span></span>".repeat(offset);
        for (let d = 1; d <= days; d++) {
          const date = new Date(view.getFullYear(), view.getMonth(), d);
          const s = status(date);
          const isSel = selected && date.getTime() === selected.getTime();
          html += `<button type="button" class="is-${s}${isSel ? " is-selected" : ""}" data-day="${d}" ${s === "past" || s === "taken" ? "disabled" : ""}>${d}</button>`;
        }
        $(root, "[data-days]").innerHTML = html;
      };
      const form = $(root, ".ev-planner");
      const update = () => {
        const guests = Number($(root, "[data-guests]").value);
        $(root, "[data-guests-out]").textContent = guests;
        $(root, "[data-guests]").style.setProperty("--fill", `${(guests - 20) / 280 * 100}%`);
        const pack = eventPackages[Number(form.querySelector("[name=ev-pack]:checked").value)];
        const weekend = selected && [5, 6].includes(selected.getDay());
        let total = guests * pack.pp * (weekend ? 1.15 : 1);
        $$(form, ".ev-extras input:checked").forEach(input => {
          const extra = eventExtras[Number(input.value)];
          total += extra.price || extra.perPerson * guests;
        });
        tween($(root, "[data-total]"), total);
        $(root, "[data-pp]").textContent = `${money(total / guests)} por invitado${weekend ? " · tarifa de fin de semana" : ""}`;
        $(root, "[data-date-out]").innerHTML = selected ? `${I.cal} ${weekdays[selected.getDay()]} ${selected.getDate()} de ${months[selected.getMonth()]}` : "Elige una fecha en el calendario";
        $(root, "[data-book]").disabled = !selected;
        return { guests, pack, total };
      };
      form.addEventListener("input", update);

      const photos = $$(root, "[data-photo]");
      let photoIndex = 0;
      const showPhoto = i => {
        photoIndex = (i + photos.length) % photos.length;
        $(root, "[data-lightbox] img").src = photos[photoIndex].dataset.src;
        root.classList.add("is-lightbox");
      };
      root.addEventListener("click", event => {
        const t = event.target;
        const month = t.closest("[data-month]");
        if (month) { view.setMonth(view.getMonth() + Number(month.dataset.month)); renderCal(); }
        const day = t.closest("[data-day]");
        if (day) { selected = new Date(view.getFullYear(), view.getMonth(), Number(day.dataset.day)); renderCal(); update(); }
        const photo = t.closest("[data-photo]");
        if (photo) showPhoto(Number(photo.dataset.photo));
        const lb = t.closest("[data-lb]");
        if (lb) showPhoto(photoIndex + Number(lb.dataset.lb));
        if (t.closest("[data-close-layer]")) root.classList.remove("is-lightbox", "is-ticket");
        if (t.closest("[data-book]")) {
          const { guests, pack, total } = update();
          $(root, "[data-ticket]").innerHTML = `
            <div class="demo-check">${I.check}</div>
            <small>Fecha apartada</small>
            <h3>${weekdays[selected.getDay()]} ${selected.getDate()} de ${months[selected.getMonth()]}</h3>
            <ul><li><span>Paquete</span><b>${pack.name}</b></li><li><span>Invitados</span><b>${guests}</b></li><li><span>Total estimado</span><b>${money(total)}</b></li><li><span>Anticipo (10%)</span><b>${money(total * 0.1)}</b></li></ul>
            <p>Tu coordinadora te escribirá hoy para agendar la visita.</p>
            <button class="ev-btn" type="button" data-close-layer>Perfecto</button>`;
          root.classList.add("is-ticket");
        }
        const dot = t.closest("[data-quote]");
        if (dot) showQuote(Number(dot.dataset.quote));
      });

      let quote = 0;
      const showQuote = i => {
        quote = i % 3;
        $$(root, "[data-quotes] figure").forEach((f, n) => f.classList.toggle("is-on", n === quote));
        $$(root, "[data-quote]").forEach((b, n) => b.classList.toggle("is-on", n === quote));
      };
      every(() => showQuote(quote + 1), 5200);
      renderCal();
      update();
    }
  };

  /* ---------------------------------------------------------------- Restaurante */
  const dishes = {
    Entradas: [["Tostada de atún", "Atún aleta azul, aguacate tatemado y chile serrano.", 245, "1504674900247-0877df9cc836"], ["Huerta al centro", "Hojas tiernas, fruta de temporada y queso de cabra.", 195, "1547592180-85f173990554"], ["Ensalada de la milpa", "Calabaza, elote, flor y vinagreta de hoja santa.", 210, "1540189549336-e6e99c3679fe"]],
    Fuertes: [["Pesca del día", "Cítricos, hierbas frescas y vegetales del mercado.", 385, "1519708227418-c8fd9a32b7a2"], ["Pasta Luna", "Pasta hecha en casa con tomate rostizado.", 265, "1551183053-bf91a1d81141"], ["Rib eye a la leña", "400 g, tuétano y salsa de chiles secos.", 690, "1414235077428-338989a2e8c0"]],
    Postres: [["Tarta de frutos rojos", "Frambuesa, crema de vainilla de Papantla.", 155, "1565958011703-44f9829ba187"], ["Galletas tibias", "Chocolate oscuro, sal de mar y helado de nata.", 135, "1558961363-fa8fdf82db35"]],
    Bebidas: [["Old fashioned de mezcal", "Mezcal espadín, piloncillo y naranja.", 210, "1470337458703-46ad1756a187"], ["Coctel de temporada", "Pregunta por la fruta de la semana.", 185, "1514362545857-3bc16c4c7d1b"]]
  };
  const slots = ["13:00", "13:30", "14:00", "14:30", "15:00", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00"];

  const food = {
    domain: "mesaluna.mx",
    html: () => `
    <div class="demo demo-food">
      <div class="fd-top">Cocina de temporada · Mar a dom 13:00 — 23:00 · Roma Norte</div>
      <header class="fd-nav"><a class="fd-brand" href="#fd-top">mesa luna<span>·</span></a><nav><a href="#fd-menu">La carta</a><a href="#fd-chef">La cocina</a></nav><a class="fd-btn fd-btn-sm" href="#fd-book">Reservar</a></header>
      <section class="fd-hero" id="fd-top">
        <img src="${img("1517248135467-4c7edcad34c4", 1600)}" alt="Interior del restaurante iluminado con luz cálida">
        <div class="fd-hero-copy">
          <small>Cocina honesta · Ingredientes locales</small>
          <h1>De la tierra y el mar <em>a tu mesa.</em></h1>
          <div class="fd-hero-cta"><a class="fd-btn" href="#fd-book">${I.cal} Reservar mesa</a><a class="fd-link" href="#fd-menu">Ver la carta ${I.down}</a></div>
        </div>
        <div class="fd-badge" aria-hidden="true"><svg viewBox="0 0 100 100"><defs><path id="fd-circle" d="M50 50m-38 0a38 38 0 1 1 76 0a38 38 0 1 1-76 0"/></defs><text><textPath href="#fd-circle">COCINA DE TEMPORADA · FUEGO LENTO · </textPath></text></svg><b>ML</b></div>
      </section>
      <div class="fd-marquee" aria-hidden="true"><div>${"<span>Fuego lento</span><i></i><span>Producto local</span><i></i><span>Vinos naturales</span><i></i><span>Sobremesa sin prisa</span><i></i>".repeat(4)}</div></div>
      <section class="fd-menu" id="fd-menu">
        <div class="fd-menu-head"><small>La carta</small><h2>Favoritos de <em>la temporada</em></h2></div>
        <div class="fd-tabs" role="tablist">${Object.keys(dishes).map((k, i) => `<button type="button" role="tab" class="${i ? "" : "is-on"}" data-tab="${k}">${k}</button>`).join("")}<i class="fd-ink" data-ink></i></div>
        <div class="fd-list" data-list></div>
      </section>
      <section class="fd-chef" id="fd-chef">
        <div class="fd-chef-img" data-reveal><img src="${img("1555396273-367ea4eb4db5", 1200)}" alt="Salón del restaurante" loading="lazy"></div>
        <div class="fd-chef-copy"><small>La cocina</small><blockquote data-reveal>“Cocinamos con lo que la temporada nos da. El menú cambia; la sobremesa se queda.”</blockquote><p data-reveal>Chef Lucía Ortega · 15 años cocinando producto mexicano</p></div>
      </section>
      <section class="fd-book" id="fd-book">
        <div class="fd-book-copy"><small>Reservaciones</small><h2>Una mesa <em>te espera.</em></h2><p>Confirmación inmediata. Te recordamos un día antes por WhatsApp.</p></div>
        <div class="fd-widget" data-widget>
          <div class="fd-step"><span>${I.cal} Día</span><div class="fd-dates" data-dates></div></div>
          <div class="fd-step"><span>${I.users} Personas</span><div class="demo-stepper fd-people"><button type="button" data-people="-1" aria-label="Menos personas">${I.minus}</button><b data-people-out>2</b><button type="button" data-people="1" aria-label="Más personas">${I.plus}</button></div></div>
          <div class="fd-step"><span>${I.clock} Horario</span><div class="fd-slots" data-slots></div></div>
          <button class="fd-btn fd-confirm" type="button" data-confirm disabled>Elige un horario</button>
        </div>
      </section>
      <footer class="fd-foot"><span class="fd-brand">mesa luna<span>·</span></span><span>${I.pin} Colima 124, Roma Norte</span><span>Mar a dom · 13:00 a 23:00</span></footer>
      <div class="demo-layer">
        <div class="fd-preview" data-preview><img alt=""></div>
        <div class="demo-scrim" data-close-ticket></div>
        <div class="fd-ticket" data-ticket></div>
        ${cta}
      </div>
    </div>`,
    init(root) {
      const list = $(root, "[data-list]");
      const ink = $(root, "[data-ink]");
      const showTab = tab => {
        $$(root, "[data-tab]").forEach(b => b.classList.toggle("is-on", b === tab));
        ink.style.width = `${tab.offsetWidth}px`;
        ink.style.transform = `translateX(${tab.offsetLeft}px)`;
        list.classList.remove("is-in");
        void list.offsetWidth;
        list.innerHTML = dishes[tab.dataset.tab].map(([name, text, price, id], i) => `
          <article class="fd-dish" data-img="${img(id, 600)}" style="--i:${i}">
            <img src="${img(id, 200)}" alt="" loading="lazy">
            <div><h3>${name}</h3><p>${text}</p></div>
            <i></i><b>${money(price)}</b>
          </article>`).join("");
        list.classList.add("is-in");
      };

      // Foto del platillo que sigue al cursor
      const preview = $(root, "[data-preview]");
      const layer = $(root, ".demo-layer");
      list.addEventListener("pointermove", event => {
        if (event.pointerType !== "mouse") return;
        const dish = event.target.closest(".fd-dish");
        if (!dish) { preview.classList.remove("is-on"); return; }
        const r = layer.getBoundingClientRect();
        const previewImg = $(preview, "img");
        if (previewImg.getAttribute("src") !== dish.dataset.img) previewImg.src = dish.dataset.img;
        preview.style.transform = `translate(${event.clientX - r.left + 24}px, ${event.clientY - r.top - 90}px)`;
        preview.classList.add("is-on");
      });
      list.addEventListener("pointerleave", () => preview.classList.remove("is-on"));

      const today = new Date();
      const short = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
      const dates = Array.from({ length: 7 }, (_, i) => { const d = new Date(today); d.setDate(today.getDate() + i); return d; });
      let dateIndex = 0;
      let people = 2;
      let slot = null;
      const renderDates = () => {
        $(root, "[data-dates]").innerHTML = dates.map((d, i) => `<button type="button" class="${i === dateIndex ? "is-on" : ""}" data-date="${i}"><small>${i === 0 ? "Hoy" : i === 1 ? "Mañana" : short[d.getDay()]}</small><b>${d.getDate()}</b></button>`).join("");
      };
      const renderSlots = () => {
        $(root, "[data-slots]").innerHTML = slots.map((s, i) => {
          const full = (dateIndex * 5 + i * 3 + people) % 4 === 0;
          return `<button type="button" class="${s === slot ? "is-on" : ""}" data-slot="${s}" ${full ? "disabled" : ""}>${full ? "Lleno" : s}</button>`;
        }).join("");
        const confirm = $(root, "[data-confirm]");
        confirm.disabled = !slot;
        confirm.innerHTML = slot ? `Confirmar · ${people} ${people === 1 ? "persona" : "personas"} a las ${slot} ${I.arrow}` : "Elige un horario";
      };

      root.addEventListener("click", event => {
        const t = event.target;
        const tab = t.closest("[data-tab]");
        if (tab) showTab(tab);
        const date = t.closest("[data-date]");
        if (date) { dateIndex = Number(date.dataset.date); slot = null; renderDates(); renderSlots(); }
        const p = t.closest("[data-people]");
        if (p) { people = Math.max(1, Math.min(12, people + Number(p.dataset.people))); $(root, "[data-people-out]").textContent = people; slot = null; renderSlots(); }
        const s = t.closest("[data-slot]");
        if (s) { slot = s.dataset.slot; renderSlots(); }
        if (t.closest("[data-confirm]")) {
          const d = dates[dateIndex];
          $(root, "[data-ticket]").innerHTML = `
            <div class="fd-ticket-top"><span class="fd-brand">mesa luna<span>·</span></span><small>Reservación confirmada</small></div>
            <div class="fd-ticket-main"><b>${d.getDate()}</b><div><span>${weekdays[d.getDay()]}</span><span>${months[d.getMonth()]}</span></div><strong>${slot}</strong></div>
            <ul><li><span>Personas</span><b>${people}</b></li><li><span>Código</span><b>ML-${Math.floor(1000 + Math.random() * 8999)}</b></li><li><span>Mesa</span><b>Terraza</b></li></ul>
            <p>Te enviamos la confirmación por WhatsApp.</p>
            <button class="fd-btn" type="button" data-close-ticket>Listo</button>`;
          root.classList.add("is-ticket");
        }
        if (t.closest("[data-close-ticket]")) root.classList.remove("is-ticket");
      });
      renderDates();
      renderSlots();
      later(() => showTab($(root, "[data-tab]")), 30);
    }
  };

  /* ---------------------------------------------------------------- Menú digital */
  const menuItems = [
    { sec: "Tacos", name: "Orden al pastor", text: "5 tacos, piña rostizada, cebolla y cilantro.", price: 95, img: "1599974579688-8dbdd335c77f", tags: ["top"] },
    { sec: "Tacos", name: "Campechanos", text: "Suadero y longaniza, salsa verde cruda.", price: 85, img: "1565299585323-38d6b0865b47", tags: ["hot"] },
    { sec: "Tacos", name: "Coliflor al pastor", text: "Adobo de la casa y tortilla hecha aquí.", price: 80, img: "1613514785940-daed07799d9b", tags: ["veg"] },
    { sec: "Tacos", name: "Tacos de la esquina", text: "Tres tacos de bistec con salsa tatemada.", price: 110, img: "1551504734-5ee1c4a1479b", tags: ["top", "hot"] },
    { sec: "Para empezar", name: "Guacamole de la casa", text: "Aguacate, queso fresco y totopos hechos aquí.", price: 95, tags: ["veg"] },
    { sec: "Para empezar", name: "Esquites tatemados", text: "Elote, epazote, limón y chile de árbol.", price: 78, tags: ["veg", "hot"] },
    { sec: "Bebidas", name: "Agua de jamaica", text: "Con canela. Servida bien fría.", price: 48, tags: [] },
    { sec: "Bebidas", name: "Horchata", text: "Receta de la abuela, con un toque de vainilla.", price: 48, tags: ["top"] },
    { sec: "Postres", name: "Galletas de la abuela", text: "Recién horneadas, chispas de chocolate.", price: 45, img: "1558961363-fa8fdf82db35", tags: [] },
    { sec: "Postres", name: "Churros con cajeta", text: "Cuatro churros calientitos para compartir.", price: 70, tags: ["top"] }
  ];
  const tagLabel = { top: `${I.star}Más pedido`, hot: `${I.chili}Picante`, veg: `${I.leaf}Vegetariano` };

  // Un QR decorativo (no lleva a ningún lado) para ambientar la demo
  function qrPattern() {
    const n = 21;
    let cells = "";
    const finder = (r, c) => [[0, 0], [0, n - 7], [n - 7, 0]].some(([fr, fc]) => {
      const y = r - fr, x = c - fc;
      if (y < 0 || x < 0 || y > 6 || x > 6) return false;
      return y === 0 || y === 6 || x === 0 || x === 6 || (y > 1 && y < 5 && x > 1 && x < 5);
    });
    const inFinderZone = (r, c) => (r < 8 && c < 8) || (r < 8 && c > n - 9) || (r > n - 9 && c < 8);
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const on = inFinderZone(r, c) ? finder(r, c) : ((r * 7 + c * 13 + r * c) % 5 < 2);
      cells += `<i class="${on ? "on" : ""}"></i>`;
    }
    return cells;
  }

  const menu = {
    domain: "laesquina.mx",
    html: () => {
      const sections = [...new Set(menuItems.map(i => i.sec))];
      return `
    <div class="demo demo-menu">
      <section class="mn-stage">
        <div class="mn-pitch">
          <small>Menú digital · QR</small>
          <h2>Escanea, elige y <em>pide sin esperar.</em></h2>
          <p>Tus clientes ven fotos, precios y recomendaciones desde su celular. El pedido llega directo a la cocina.</p>
          <div class="mn-qr-wrap"><div class="mn-qr" aria-hidden="true">${qrPattern()}</div><span>Mesa 7<br><b>Escanea para ordenar</b></span></div>
          <ul><li>${I.check} Sin descargar apps</li><li>${I.check} Cambia precios en segundos</li><li>${I.check} Pedidos y propina en línea</li></ul>
          <p class="mn-try">${I.spark} Pruébalo: agrega platillos a tu pedido</p>
        </div>
        <div class="mn-phone">
          <div class="mn-screen">
            <div class="mn-status" aria-hidden="true"><b>13:45</b><i></i></div>
            <div class="mn-scroll" data-mn-scroll>
              <div class="mn-cover"><img src="${img("1613514785940-daed07799d9b", 800)}" alt="Tacos recién servidos"><span class="mn-open"><i></i>Abierto · cierra 23:00</span></div>
              <div class="mn-head">
                <h1>La Esquina</h1>
                <p>${I.star} 4.8 · Tacos y antojitos · <b>Mesa 7</b></p>
                <label class="mn-search">${I.search}<input type="search" placeholder="¿Qué se te antoja?" data-mn-search aria-label="Buscar en el menú"></label>
              </div>
              <nav class="mn-tabs" data-mn-tabs>${sections.map((s, i) => `<button type="button" class="${i ? "" : "is-on"}" data-mn-tab="${s}">${s}</button>`).join("")}</nav>
              ${sections.map(s => `<section class="mn-sec" data-mn-sec="${s}"><h2>${s}</h2>${menuItems.map((item, i) => item.sec !== s ? "" : `
                <article class="mn-item" data-mn-item="${i}" data-search="${(item.name + " " + item.text).toLowerCase()}">
                  <div><h3>${item.name}</h3><p>${item.text}</p><div class="mn-tags">${item.tags.map(t => `<span class="mn-tag-${t}">${tagLabel[t]}</span>`).join("")}</div><b>${money(item.price)}</b></div>
                  <div class="mn-thumb">${item.img ? `<img src="${img(item.img, 300)}" alt="" loading="lazy">` : `<span>${I.pot}</span>`}<div class="mn-ctrl" data-mn-ctrl="${i}"><button type="button" class="mn-add" data-mn-add="${i}" aria-label="Agregar ${item.name}">${I.plus}</button></div></div>
                </article>`).join("")}</section>`).join("")}
              <p class="mn-empty" data-mn-empty>No encontramos ese antojo. Prueba con “taco” o “agua”.</p>
              <div class="mn-spacer"></div>
            </div>
            <button class="mn-bar" type="button" data-mn-open><span><b data-mn-count>0</b> en tu pedido</span><strong data-mn-total>$0</strong></button>
            <div class="mn-scrim" data-mn-close></div>
            <div class="mn-sheet" data-mn-sheet></div>
          </div>
        </div>
      </section>
      <div class="demo-layer">${cta}</div>
    </div>`;
    },
    init(root) {
      const order = new Map();
      const scroll = $(root, "[data-mn-scroll]");
      const tabs = $(root, "[data-mn-tabs]");
      let tip = 10;
      const totals = () => {
        const subtotal = [...order.entries()].reduce((sum, [i, q]) => sum + menuItems[i].price * q, 0);
        const count = [...order.values()].reduce((a, b) => a + b, 0);
        return { subtotal, count, tipAmount: subtotal * tip / 100, total: subtotal * (1 + tip / 100) };
      };
      const renderControls = i => {
        const q = order.get(i) || 0;
        $(root, `[data-mn-ctrl="${i}"]`).innerHTML = q
          ? `<div class="demo-stepper mn-step"><button type="button" data-mn-q="${i}" data-d="-1" aria-label="Quitar">${I.minus}</button><span>${q}</span><button type="button" data-mn-q="${i}" data-d="1" aria-label="Agregar">${I.plus}</button></div>`
          : `<button type="button" class="mn-add" data-mn-add="${i}" aria-label="Agregar ${menuItems[i].name}">${I.plus}</button>`;
      };
      const renderBar = () => {
        const { count, subtotal } = totals();
        $(root, "[data-mn-count]").textContent = count;
        tween($(root, "[data-mn-total]"), subtotal);
        root.classList.toggle("has-order", count > 0);
      };
      const renderSheet = () => {
        const { subtotal, tipAmount, total } = totals();
        $(root, "[data-mn-sheet]").innerHTML = `
          <i class="mn-grip"></i>
          <h3>Tu pedido · Mesa 7</h3>
          <div class="mn-lines">${[...order.entries()].map(([i, q]) => `<div><span>${q}×</span><b>${menuItems[i].name}</b><em>${money(menuItems[i].price * q)}</em></div>`).join("") || "<p>Aún no agregas nada.</p>"}</div>
          <textarea placeholder="¿Algo especial? Sin cebolla, salsa aparte…" aria-label="Notas para cocina"></textarea>
          <div class="mn-tip"><span>Propina</span>${[0, 10, 15, 20].map(p => `<button type="button" class="${p === tip ? "is-on" : ""}" data-mn-tip="${p}">${p}%</button>`).join("")}</div>
          <div class="mn-sum"><span>Subtotal</span><b>${money(subtotal)}</b><span>Propina</span><b>${money(tipAmount)}</b><span class="mn-total">Total</span><b class="mn-total">${money(total)}</b></div>
          <button class="mn-send" type="button" data-mn-send ${subtotal ? "" : "disabled"}>Enviar a cocina ${I.arrow}</button>`;
      };
      const change = (i, d) => {
        const q = Math.max(0, (order.get(i) || 0) + d);
        q ? order.set(i, q) : order.delete(i);
        renderControls(i);
        renderBar();
      };
      const track = () => {
        const steps = [["Recibido", "La cocina ya tiene tu pedido."], ["Preparando", "Tus tacos están en el comal."], ["¡En camino!", "Va directo a la mesa 7."]];
        const sheet = $(root, "[data-mn-sheet]");
        sheet.innerHTML = `<i class="mn-grip"></i><h3>Pedido #${Math.floor(100 + Math.random() * 899)}</h3>
          <ol class="mn-track">${steps.map(([t, d]) => `<li><i>${I.check}</i><div><b>${t}</b><span>${d}</span></div></li>`).join("")}</ol>
          <div class="mn-pot">${I.pot}</div>
          <button class="mn-send mn-again" type="button" data-mn-again>Hacer otro pedido</button>`;
        const items = $$(sheet, ".mn-track li");
        items.forEach((li, i) => later(() => li.classList.add("is-done"), 300 + i * 1700));
        later(() => sheet.classList.add("is-ready"), 300 + 2 * 1700);
      };

      root.addEventListener("click", event => {
        const t = event.target;
        const add = t.closest("[data-mn-add]");
        if (add) { change(Number(add.dataset.mnAdd), 1); return; }
        const q = t.closest("[data-mn-q]");
        if (q) { change(Number(q.dataset.mnQ), Number(q.dataset.d)); return; }
        const tab = t.closest("[data-mn-tab]");
        if (tab) {
          const sec = $(root, `[data-mn-sec="${tab.dataset.mnTab}"]`);
          scroll.scrollTo({ top: sec.offsetTop - tabs.offsetHeight + 2, behavior: "smooth" });
          return;
        }
        if (t.closest("[data-mn-open]")) { renderSheet(); root.classList.add("is-sheet"); return; }
        if (t.closest("[data-mn-close]")) { root.classList.remove("is-sheet"); return; }
        const tipBtn = t.closest("[data-mn-tip]");
        if (tipBtn) { tip = Number(tipBtn.dataset.mnTip); renderSheet(); return; }
        if (t.closest("[data-mn-send]")) { track(); return; }
        if (t.closest("[data-mn-again]")) {
          const ids = [...order.keys()];
          order.clear();
          ids.forEach(renderControls);
          renderBar();
          root.classList.remove("is-sheet");
        }
      });

      // Las pestañas siguen la sección visible
      const sections = $$(root, "[data-mn-sec]");
      const onScroll = () => {
        const y = scroll.scrollTop + tabs.offsetHeight + 12;
        let active = sections[0];
        sections.forEach(s => { if (!s.hidden && s.offsetTop <= y) active = s; });
        $$(root, "[data-mn-tab]").forEach(b => {
          const on = b.dataset.mnTab === active.dataset.mnSec;
          if (on && !b.classList.contains("is-on")) tabs.scrollTo({ left: b.offsetLeft - 16, behavior: "smooth" });
          b.classList.toggle("is-on", on);
        });
        tabs.classList.toggle("is-stuck", scroll.scrollTop > tabs.offsetTop - 2);
      };
      scroll.addEventListener("scroll", onScroll, { passive: true });

      $(root, "[data-mn-search]").addEventListener("input", event => {
        const term = event.target.value.trim().toLowerCase();
        let any = false;
        sections.forEach(s => {
          let visible = 0;
          $$(s, "[data-mn-item]").forEach(item => {
            const show = !term || item.dataset.search.includes(term);
            item.hidden = !show;
            if (show) visible++;
          });
          s.hidden = !visible;
          if (visible) any = true;
        });
        $(root, "[data-mn-empty]").classList.toggle("is-on", !any);
      });
      renderBar();
    }
  };

  const demos = { store, professional, events, food, menu };

  let fontsLoaded = false;
  function loadFonts() {
    if (fontsLoaded) return;
    fontsLoaded = true;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..600&family=Bricolage+Grotesque:opsz,wght@12..96,400..800&display=swap";
    document.head.append(link);
  }

  // Monta una demo en un contenedor; cada montaje lleva su propia lista de limpieza
  function mount(type, site, { preview = false } = {}) {
    const demo = demos[type] || demos.store;
    const list = [];
    cleanups = list;
    loadFonts();
    site.innerHTML = demo.html();
    site.scrollTop = 0;
    const root = site.firstElementChild;
    if (!preview) {
      // Los enlaces internos desplazan dentro de la demo en lugar de mover la página
      root.addEventListener("click", event => {
        const link = event.target.closest('a[href^="#"]');
        if (!link || link.hasAttribute("data-concept-contact")) return;
        event.preventDefault();
        const target = root.querySelector(link.getAttribute("href"));
        if (target) site.scrollTo({ top: target.getBoundingClientRect().top - site.getBoundingClientRect().top + site.scrollTop - 56, behavior: "smooth" });
      });
    }
    demo.init(root, site);
    observe(root, site);
    return { domain: demo.domain, destroy: () => list.splice(0).forEach(fn => fn()) };
  }

  let modal = null;
  window.OrionConcepts = {
    open(type, site) {
      modal?.destroy();
      site.className = `concept-site demo-site-${type}`;
      modal = mount(type, site);
      return modal.domain;
    },
    close() {
      modal?.destroy();
      modal = null;
    },
    // Vista previa sin interacción para la vitrina de la portada
    preview: (type, site) => mount(type, site, { preview: true }),
    domain: type => (demos[type] || demos.store).domain
  };
})();
