// Secciones de la portada: armador de sitios en vivo, antes y después, y demo de sistemas
(() => {
  const lang = () => (document.documentElement.lang === "en" ? "en" : "es");
  const img = (id, w = 900) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75`;
  const esc = text => text.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const arrow = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19 19 5M8 5h11v11"/></svg>';
  const onLang = fn => document.addEventListener("orion:lang", fn);

  // Escala un sitio diseñado a cierto ancho para que quepa en su marco
  function fitInto(screen, site, width, height) {
    const scale = screen.clientWidth / width;
    site.style.width = `${width}px`;
    site.style.height = `${height || screen.clientHeight / scale}px`;
    site.style.transform = `scale(${scale})`;
  }

  /* ------------------------------------------------------------ Arma tu sitio en vivo */
  const giros = {
    cafe: { img: "1509042239860-f550ce710b93", img2: "1501339847302-ac426a4a7cbb",
      es: { label: "Cafetería", name: "Café Aurora", tag: "Café de especialidad", headline: "Tu café favorito, a dos cuadras.", text: "Granos mexicanos tostados en casa, pan del día y un lugar para quedarte.", cta: "Ordenar para llevar", links: ["Menú", "Nosotros", "Ubicación"], items: [["Espresso", "$45"], ["Latte de temporada", "$68"], ["Pan de la casa", "$38"]], about: "Tostamos cada semana en pequeños lotes para que cada taza sepa a su origen.", quote: "El mejor latte de la colonia, y siempre te reciben con una sonrisa.", strip: "Pide desde tu celular y recoge sin hacer fila" },
      en: { label: "Coffee shop", name: "Aurora Coffee", tag: "Specialty coffee", headline: "Your favorite coffee, around the corner.", text: "Mexican beans roasted in house, fresh bread and a place to stay.", cta: "Order to go", links: ["Menu", "About", "Location"], items: [["Espresso", "$45"], ["Seasonal latte", "$68"], ["House bread", "$38"]], about: "We roast small batches every week so each cup tastes like its origin.", quote: "The best latte in the neighborhood, always served with a smile.", strip: "Order from your phone and skip the line" } },
    barber: { img: "1585747860715-2ba37e788b70", img2: "1622286342621-4bd786c2447c",
      es: { label: "Barbería", name: "Barbería Norte", tag: "Cortes clásicos y modernos", headline: "Sal sintiéndote como nuevo.", text: "Corte, barba y toalla caliente con barberos que saben lo que hacen.", cta: "Agendar cita", links: ["Servicios", "Barberos", "Citas"], items: [["Corte clásico", "$250"], ["Barba completa", "$180"], ["Corte + barba", "$380"]], about: "Barberos con oficio, buena música y una cerveza fría mientras esperas.", quote: "Llevo años viniendo y nunca he salido inconforme.", strip: "Agenda en línea en menos de un minuto" },
      en: { label: "Barbershop", name: "North Barbers", tag: "Classic and modern cuts", headline: "Walk out feeling brand new.", text: "Cut, beard and hot towel with barbers who know their craft.", cta: "Book now", links: ["Services", "Barbers", "Booking"], items: [["Classic cut", "$250"], ["Full beard", "$180"], ["Cut + beard", "$380"]], about: "Skilled barbers, good music and a cold beer while you wait.", quote: "I've been coming for years and never left unhappy.", strip: "Book online in under a minute" } },
    dental: { img: "1629909613654-28e377c37b09", img2: "1606811971618-4486d14f3f99",
      es: { label: "Dentista", name: "Sonríe Dental", tag: "Odontología integral", headline: "Una sonrisa sana, sin miedo al dentista.", text: "Tecnología moderna, trato cálido y citas puntuales para toda la familia.", cta: "Agendar valoración", links: ["Tratamientos", "Equipo", "Contacto"], items: [["Limpieza dental", "$700"], ["Blanqueamiento", "$3,500"], ["Valoración", "$300"]], about: "Tratamientos explicados con calma, sin sorpresas en el precio.", quote: "Por fin un dentista al que no me da miedo ir.", strip: "Confirmamos tu cita por WhatsApp" },
      en: { label: "Dentist", name: "Smile Dental", tag: "Complete dental care", headline: "A healthy smile, no fear of the dentist.", text: "Modern technology, warm care and on-time appointments for the whole family.", cta: "Book a checkup", links: ["Treatments", "Team", "Contact"], items: [["Cleaning", "$700"], ["Whitening", "$3,500"], ["Checkup", "$300"]], about: "Treatments explained calmly, with no surprises on the bill.", quote: "Finally a dentist I'm not afraid to visit.", strip: "We confirm your appointment on WhatsApp" } },
    flowers: { img: "1487070183336-b863922373d4", img2: "1561181286-d3fee7d55364",
      es: { label: "Florería", name: "Florería Pétalo", tag: "Arreglos hechos a mano", headline: "Flores frescas para cada momento.", text: "Arreglos a domicilio el mismo día en toda la ciudad.", cta: "Enviar flores", links: ["Arreglos", "Ocasiones", "Envíos"], items: [["Ramo de tulipanes", "$650"], ["Caja de rosas", "$890"], ["Arreglo de temporada", "$540"]], about: "Flores de temporada elegidas cada mañana en el mercado.", quote: "El arreglo llegó a tiempo y más bonito que en la foto.", strip: "Envío el mismo día si pides antes de las 2 pm" },
      en: { label: "Florist", name: "Petal Flowers", tag: "Handmade arrangements", headline: "Fresh flowers for every moment.", text: "Same-day delivery across the city.", cta: "Send flowers", links: ["Bouquets", "Occasions", "Delivery"], items: [["Tulip bouquet", "$650"], ["Box of roses", "$890"], ["Seasonal arrangement", "$540"]], about: "Seasonal flowers picked every morning at the market.", quote: "The arrangement arrived on time and prettier than the photo.", strip: "Same-day delivery if you order before 2 pm" } },
    gym: { img: "1534438327276-14e5300c3a48", img2: "1571019613454-1cb2f99b2d8b",
      es: { label: "Gimnasio", name: "Pulso Gym", tag: "Entrena a tu ritmo", headline: "Más fuerte cada semana.", text: "Clases grupales, pesas y coaches que te acompañan desde el primer día.", cta: "Prueba una clase", links: ["Clases", "Horarios", "Planes"], items: [["Clase de prueba", "$0"], ["Mensualidad", "$799"], ["Coach personal", "$1,200"]], about: "Coaches certificados y un ambiente donde todos se apoyan.", quote: "En tres meses cambió por completo mi energía.", strip: "Reserva tu lugar en la clase desde el celular" },
      en: { label: "Gym", name: "Pulse Gym", tag: "Train at your pace", headline: "Stronger every week.", text: "Group classes, weights and coaches with you from day one.", cta: "Try a class", links: ["Classes", "Schedule", "Plans"], items: [["Trial class", "$0"], ["Monthly", "$799"], ["Personal coach", "$1,200"]], about: "Certified coaches and a place where everyone has your back.", quote: "In three months my energy completely changed.", strip: "Save your spot in class from your phone" } },
    beauty: { img: "1522335789203-aabd1fc54bc9", img2: "1490750967868-88aa4486c946",
      es: { label: "Belleza", name: "Estudio Bella", tag: "Salón de belleza", headline: "Tu mejor versión empieza aquí.", text: "Maquillaje, uñas y peinado con productos profesionales.", cta: "Reservar cita", links: ["Servicios", "Galería", "Citas"], items: [["Maquillaje social", "$900"], ["Manicure gel", "$350"], ["Peinado", "$600"]], about: "Productos profesionales y un equipo que escucha lo que quieres.", quote: "Salí lista para la boda y me sentí increíble.", strip: "Elige servicio, día y hora en un solo paso" },
      en: { label: "Beauty", name: "Bella Studio", tag: "Beauty salon", headline: "Your best version starts here.", text: "Makeup, nails and hair with professional products.", cta: "Book now", links: ["Services", "Gallery", "Booking"], items: [["Event makeup", "$900"], ["Gel manicure", "$350"], ["Hairstyle", "$600"]], about: "Professional products and a team that listens to what you want.", quote: "I left ready for the wedding and felt amazing.", strip: "Pick service, day and time in one step" } }
  };
  const palettes = [
    { es: "Noche", en: "Night", bg: "#0e1220", ink: "#f2f4fa", accent: "#6c8cff", soft: "#1a2033" },
    { es: "Terracota", en: "Terracotta", bg: "#f4ece2", ink: "#2a1d17", accent: "#c4622d", soft: "#e8dccd" },
    { es: "Bosque", en: "Forest", bg: "#eef2ea", ink: "#14231b", accent: "#4f8a5b", soft: "#dfe7da" },
    { es: "Rosa", en: "Rose", bg: "#fbf0f2", ink: "#2a1620", accent: "#d6457a", soft: "#f3dde3" },
    { es: "Arena", en: "Sand", bg: "#f7f1e6", ink: "#1f1b16", accent: "#b8913f", soft: "#ece2cf" },
    { es: "Océano", en: "Ocean", bg: "#0d1d2a", ink: "#eaf4f7", accent: "#2bb3cc", soft: "#15293a" }
  ];
  const fonts = [
    { es: "Moderna", en: "Modern", css: "Sora, sans-serif" },
    { es: "Elegante", en: "Elegant", css: "Fraunces, Georgia, serif" },
    { es: "Divertida", en: "Playful", css: "'Bricolage Grotesque', sans-serif" },
    { es: "Técnica", en: "Technical", css: "'DM Mono', monospace" }
  ];
  const layouts = [
    { id: "minimal", es: "Minimal", en: "Minimal" },
    { id: "bold", es: "Audaz", en: "Bold" },
    { id: "elegant", es: "Elegante", en: "Elegant" },
    { id: "editorial", es: "Revista", en: "Editorial" },
    { id: "playful", es: "Divertido", en: "Playful" },
    { id: "brutal", es: "Brutalista", en: "Brutalist" }
  ];
  const makeText = {
    es: { name: "Nombre de tu negocio", giro: "Giro", colors: "Colores", font: "Tipografía", style: "Estilo", send: "Quiero un sitio así", surprise: "Sorpréndeme" },
    en: { name: "Your business name", giro: "Business", colors: "Colors", font: "Typeface", style: "Style", send: "I want a site like this", surprise: "Surprise me" }
  };

  const make = document.querySelector("[data-make]");
  if (make) {
    const panel = make.querySelector(".ox-make-panel");
    const desk = make.querySelector("[data-make-site]");
    const phone = make.querySelector("[data-make-phone]");
    const domain = make.querySelector("[data-make-domain]");
    const state = { giro: "cafe", palette: 1, font: 0, layout: "minimal", name: "" };

    const renderPanel = () => {
      const l = lang();
      const t = makeText[l];
      const chip = (group, value, label, on, extra = "") => `<button type="button" data-${group}="${value}" aria-pressed="${on}" ${extra}>${label}</button>`;
      panel.innerHTML = `
        <label class="ox-make-name"><span>${t.name}</span><input data-make-name maxlength="22" autocomplete="organization" placeholder="${esc(giros[state.giro][l].name)}" value="${esc(state.name)}"></label>
        <div class="ox-make-group"><span>${t.giro}</span><div class="ox-make-chips">${Object.entries(giros).map(([id, g]) => chip("giro", id, g[l].label, state.giro === id)).join("")}</div></div>
        <div class="ox-make-group"><span>${t.colors}</span><div class="ox-make-palettes">${palettes.map((p, i) => chip("palette", i, `<i style="background:${p.bg}"></i><i style="background:${p.accent}"></i><i style="background:${p.ink}"></i><small>${p[l]}</small>`, state.palette === i, `aria-label="${p[l]}"`)).join("")}</div></div>
        <div class="ox-make-group"><span>${t.font}</span><div class="ox-make-chips">${fonts.map((f, i) => chip("font", i, f[l], state.font === i, `style="font-family:${f.css.replace(/"/g, "'")}"`)).join("")}</div></div>
        <div class="ox-make-group"><span>${t.style}</span><div class="ox-make-styles">${layouts.map(s => chip("layout", s.id, `<i class="ox-ws ox-ws-${s.id}"><b></b><b></b><b></b><b></b></i>${s[l]}`, state.layout === s.id)).join("")}</div></div>
        <div class="ox-make-actions">
          <button type="button" class="ox-make-send" data-make-send>${t.send} ${arrow}</button>
          <button type="button" class="ox-make-random" data-make-random><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h3l10 10h3M4 17h3l3-3M14 10l3-3h3M18 4l3 3-3 3M18 14l3 3-3 3"/></svg>${t.surprise}</button>
        </div>`;
    };

    // Cada plantilla tiene su propia estructura, no solo otra foto
    const templates = {
      minimal: c => `
        ${c.nav}
        <section class="mk-hero"><div class="mk-media"><img src="${c.img1}" alt=""></div><div class="mk-copy"><small>${c.t.tag}</small><h1>${c.t.headline}</h1><p>${c.t.text}</p><span class="mk-btn">${c.t.cta}</span></div></section>
        <section class="mk-cards">${c.t.items.map(([item, price], i) => `<article><div class="mk-thumb" style="background-image:url('${i === 1 ? c.thumb2 : c.thumb1}')"></div><b>${item}</b><span>${price}</span></article>`).join("")}</section>
        <div class="mk-strip">${c.t.strip}</div>`,
      bold: c => `
        ${c.nav}
        <section class="mk-hero"><div class="mk-media"><img src="${c.img1}" alt=""></div><div class="mk-copy"><small>${c.t.tag}</small><h1>${c.t.headline}</h1><p>${c.t.text}</p><span class="mk-btn">${c.t.cta}</span></div></section>
        <div class="mk-ticker"><div>${[...c.t.links, c.t.tag, ...c.t.links, c.t.tag].map(word => `<span>${word}</span>`).join("")}</div></div>
        <section class="mk-list">${c.t.items.map(([item, price], i) => `<div><b>0${i + 1}</b><strong>${item}</strong><span>${price}</span></div>`).join("")}</section>
        <section class="mk-cta"><h2>${c.t.strip}</h2><span class="mk-btn">${c.t.cta}</span></section>`,
      elegant: c => `
        ${c.nav}
        <section class="mk-hero"><div class="mk-copy"><small>${c.t.tag}</small><h1>${c.t.headline}</h1><p>${c.t.text}</p><span class="mk-btn">${c.t.cta}</span></div><div class="mk-media"><img src="${c.img1}" alt=""></div></section>
        <section class="mk-gallery">${[c.thumb1, c.thumb2, c.thumb1].map((src, i) => `<figure><img src="${src}" alt=""><figcaption>${c.t.items[i][0]}</figcaption></figure>`).join("")}</section>
        <blockquote class="mk-quote">“${c.t.quote}”</blockquote>
        <section class="mk-menu">${c.t.items.map(([item, price]) => `<div><span>${item}</span><i></i><b>${price}</b></div>`).join("")}</section>`,
      editorial: c => `
        <header class="mk-mast"><span>${c.t.tag}</span><b>${c.name}</b><span>N.º 01 · 2026</span></header>
        <nav class="mk-nav mk-nav-thin"><span class="mk-links">${c.t.links.map(link => `<i>${link}</i>`).join("")}</span><span class="mk-nav-cta">${c.t.cta}</span></nav>
        <section class="mk-ed-grid"><div class="mk-media"><img src="${c.img1}" alt=""></div><div class="mk-ed-copy"><small>${c.t.links[0]}</small><h1>${c.t.headline}</h1><p class="mk-drop">${c.t.about} ${c.t.text}</p><span class="mk-btn">${c.t.cta}</span></div></section>
        <section class="mk-ed-cols">${c.t.items.map(([item, price], i) => `<article><b>0${i + 1}</b><h3>${item}</h3><p>${price}</p></article>`).join("")}</section>
        <blockquote class="mk-pull">“${c.t.quote}”</blockquote>`,
      playful: c => `
        ${c.nav}
        <section class="mk-hero"><div class="mk-copy"><span class="mk-sticker">${c.l === "en" ? "New!" : "¡Nuevo!"}</span><small>${c.t.tag}</small><h1>${c.t.headline}</h1><p>${c.t.text}</p><span class="mk-btn">${c.t.cta}</span></div><div class="mk-blob"><img src="${c.img1}" alt=""><span class="mk-sticker s2">${c.t.items[0][0]}</span></div></section>
        <svg class="mk-wave" viewBox="0 0 1100 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 30 Q 70 0 140 30 T 280 30 T 420 30 T 560 30 T 700 30 T 840 30 T 980 30 T 1120 30 V60 H0z"/></svg>
        <section class="mk-pcards">${c.t.items.map(([item, price], i) => `<article style="--r:${[-3, 2, -2][i]}deg"><div style="background-image:url('${i === 1 ? c.thumb2 : c.thumb1}')"></div><b>${item}</b><span>${price}</span></article>`).join("")}</section>
        <section class="mk-pquote"><p>“${c.t.quote}”</p><span class="mk-btn">${c.t.cta}</span></section>`,
      brutal: c => `
        <nav class="mk-bnav"><b>${c.name}</b>${c.t.links.map(link => `<span>${link}</span>`).join("")}<span class="mk-bnav-cta">${c.t.cta}</span></nav>
        <section class="mk-bhero"><div class="mk-bcopy"><small>[ ${c.t.tag} ]</small><h1>${c.t.headline}</h1></div><div class="mk-bmedia"><img src="${c.img1}" alt=""></div><p class="mk-btext">${c.t.text}</p><span class="mk-bbtn">${c.t.cta} →</span></section>
        <div class="mk-btable">${c.t.items.map(([item, price], i) => `<div><span>0${i + 1}</span><b>${item}</b><em>${price}</em></div>`).join("")}</div>
        <div class="mk-bstrip">${c.t.strip} ✱ ${c.t.strip}</div>`
    };
    const siteHtml = () => {
      const l = lang();
      const g = giros[state.giro];
      const t = g[l];
      const p = palettes[state.palette];
      const name = esc(state.name.trim() || t.name);
      const c = {
        l, t, name,
        img1: img(g.img, 1200), thumb1: img(g.img, 500), thumb2: img(g.img2, 500),
        nav: `<nav class="mk-nav"><b class="mk-brand">${name}</b><span class="mk-links">${t.links.map(link => `<i>${link}</i>`).join("")}</span><span class="mk-nav-cta">${t.cta}</span></nav>`
      };
      return `<div class="mk mk-${state.layout}" style="--bg:${p.bg};--ink:${p.ink};--accent:${p.accent};--soft:${p.soft};--font:${fonts[state.font].css.replace(/"/g, "'")}">${templates[state.layout](c)}</div>`;
    };

    const renderSite = () => {
      const html = siteHtml();
      [desk, phone].forEach(site => {
        site.classList.add("is-swap");
        site.innerHTML = html;
        requestAnimationFrame(() => site.classList.remove("is-swap"));
      });
      const name = state.name.trim() || giros[state.giro][lang()].name;
      tour = 0;
      domain.textContent = `${name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "") || "tunegocio"}.mx`;
    };

    const fit = () => {
      fitInto(desk.parentElement, desk, 1100);
      fitInto(phone.parentElement, phone, 380);
    };

    panel.addEventListener("click", event => {
      const button = event.target.closest("button");
      if (!button) return;
      if (button.dataset.giro) state.giro = button.dataset.giro;
      if (button.dataset.palette) state.palette = Number(button.dataset.palette);
      if (button.dataset.font) state.font = Number(button.dataset.font);
      if (button.dataset.layout) state.layout = button.dataset.layout;
      if (button.hasAttribute("data-make-random")) {
        const keys = Object.keys(giros);
        state.giro = keys[Math.floor(Math.random() * keys.length)];
        state.palette = Math.floor(Math.random() * palettes.length);
        state.font = Math.floor(Math.random() * fonts.length);
        state.layout = layouts[Math.floor(Math.random() * layouts.length)].id;
      }
      if (button.hasAttribute("data-make-send")) {
        const l = lang();
        const g = giros[state.giro][l];
        const name = state.name.trim() || g.name;
        const text = l === "en"
          ? `Hi Orion Studio! I designed a site on your page: "${name}" (${g.label}), ${palettes[state.palette].en} colors, ${fonts[state.font].en} type, ${layouts.find(s => s.id === state.layout).en} style. Can you help me make it real?`
          : `¡Hola Orion Studio! Armé un sitio en su página: "${name}" (${g.label}), colores ${palettes[state.palette].es}, tipografía ${fonts[state.font].es}, estilo ${layouts.find(s => s.id === state.layout).es}. ¿Me ayudan a hacerlo realidad?`;
        window.open(`https://wa.me/${window.ORION_WHATSAPP || "525522574365"}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
        return;
      }
      renderPanel();
      renderSite();
    });
    panel.addEventListener("input", event => {
      if (!event.target.matches("[data-make-name]")) return;
      state.name = event.target.value;
      renderSite();
    });

    // La vista previa baja y sube sola para mostrar todo el diseño; se detiene si el cursor está encima
    let tour = 0;
    let touring = true;
    const stage = make.querySelector(".ox-make-stage");
    stage.addEventListener("pointerenter", event => { if (event.pointerType === "mouse") touring = false; });
    stage.addEventListener("pointerleave", () => { touring = true; });
    let last = performance.now();
    const loop = now => {
      requestAnimationFrame(loop);
      const delta = Math.min(now - last, 100);
      last = now;
      const r = make.getBoundingClientRect();
      if (!touring || reduceMotion || r.bottom < 0 || r.top > innerHeight) return;
      tour += delta / 14000;
      const k = (1 - Math.cos(Math.min(Math.max((tour % 1) * 1.25 - 0.1, 0), 1) * Math.PI * 2)) / 2;
      [desk, phone].forEach(site => { site.scrollTop = (site.scrollHeight - site.clientHeight) * k; });
    };
    requestAnimationFrame(loop);

    renderPanel();
    renderSite();
    fit();
    if ("ResizeObserver" in window) new ResizeObserver(fit).observe(make);
    onLang(() => { renderPanel(); renderSite(); });
  }

  /* ------------------------------------------------------------ Antes y después */
  const ba = document.querySelector("[data-ba]");
  if (ba) {
    const screen = ba.querySelector(".ox-ba-screen");
    const oldSite = ba.querySelector(".ox-ba-old");
    const newSite = ba.querySelector(".ox-ba-new");
    const range = ba.querySelector("[data-ba-range]");
    const phoneQuery = window.matchMedia("(max-width: 700px)");
    const fit = () => {
      // El sitio viejo no se adapta: en celular se ve diminuto. El nuevo sí se reacomoda.
      fitInto(screen, oldSite, 1100);
      fitInto(screen, newSite, phoneQuery.matches ? 390 : 1100);
    };
    const setPos = value => ba.style.setProperty("--pos", `${value}%`);
    range.addEventListener("input", () => { setPos(range.value); hinted = true; });
    let hinted = reduceMotion;
    const hint = () => {
      if (hinted) return;
      hinted = true;
      // Un pequeño vaivén invita a arrastrar
      const frames = [[0, 50], [700, 22], [1500, 78], [2200, 50]];
      const start = performance.now();
      const step = now => {
        const t = now - start;
        const i = frames.findIndex(([at]) => at > t);
        if (i < 0 || range.matches(":active")) { setPos(range.value); return; }
        const [t0, v0] = frames[i - 1];
        const [t1, v1] = frames[i];
        const k = (t - t0) / (t1 - t0);
        const value = v0 + (v1 - v0) * (0.5 - Math.cos(Math.PI * k) / 2);
        setPos(value);
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const check = () => {
      const r = ba.getBoundingClientRect();
      if (r.top < innerHeight * 0.6 && r.bottom > innerHeight * 0.3) { hint(); removeEventListener("scroll", check); }
    };
    addEventListener("scroll", check, { passive: true });
    fit();
    if ("ResizeObserver" in window) new ResizeObserver(fit).observe(screen);
  }

  /* ------------------------------------------------------------ Demo de sistemas */
  const sysText = {
    es: {
      badge: "Datos de ejemplo", user: "Tu negocio",
      views: { dash: "Inicio", funnel: "Embudo", leads: "Prospectar", tickets: "Tickets" },
      kpis: ["Clientes activos", "Prospectos", "Propuestas enviadas", "Ingresos del mes"],
      chart: "Ingresos por mes", months: ["Jun", "Jul", "Ago", "Sep", "Oct", "Nov"],
      activity: "Actividad reciente",
      feed: [["Propuesta enviada", "Café Aurora", "hace 5 min"], ["Pago recibido", "Barbería Norte", "hace 1 h"], ["Nuevo prospecto", "Florería Pétalo", "hace 3 h"], ["Contrato firmado", "Pulso Gym", "ayer"]],
      columns: ["Prospecto", "Contactado", "Propuesta", "Cliente"],
      funnelHint: "Toca o arrastra una tarjeta para avanzarla en el embudo.",
      leadsTitle: "Encuentra negocios sin sitio web", giro: "Giro", zone: "Zona", search: "Buscar en Maps", searching: "Buscando…",
      giros: ["Restaurantes", "Dentistas", "Gimnasios"], noSite: "Sin sitio web", hasSite: "Con sitio", add: "Agregar", added: "Agregado",
      addedToast: name => `${name} se agregó al embudo`, reviews: "reseñas",
      ticketsTitle: "Tickets recientes", paid: "Pagado", pending: "Pendiente", folio: "Folio", total: "Total",
      send: "Enviar por WhatsApp", sentToast: name => `Ticket enviado a ${name}`,
      items: [["Diseño de sitio web", 8500], ["Mensualidad", 799]]
    },
    en: {
      badge: "Sample data", user: "Your business",
      views: { dash: "Home", funnel: "Pipeline", leads: "Prospect", tickets: "Tickets" },
      kpis: ["Active clients", "Leads", "Proposals sent", "Revenue this month"],
      chart: "Revenue by month", months: ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"],
      activity: "Recent activity",
      feed: [["Proposal sent", "Aurora Coffee", "5 min ago"], ["Payment received", "North Barbers", "1 h ago"], ["New lead", "Petal Flowers", "3 h ago"], ["Contract signed", "Pulse Gym", "yesterday"]],
      columns: ["Lead", "Contacted", "Proposal", "Client"],
      funnelHint: "Tap or drag a card to move it forward in the pipeline.",
      leadsTitle: "Find businesses without a website", giro: "Category", zone: "Area", search: "Search Maps", searching: "Searching…",
      giros: ["Restaurants", "Dentists", "Gyms"], noSite: "No website", hasSite: "Has site", add: "Add", added: "Added",
      addedToast: name => `${name} was added to the pipeline`, reviews: "reviews",
      ticketsTitle: "Recent tickets", paid: "Paid", pending: "Pending", folio: "Invoice", total: "Total",
      send: "Send on WhatsApp", sentToast: name => `Ticket sent to ${name}`,
      items: [["Website design", 8500], ["Monthly plan", 799]]
    }
  };
  const money = n => `$${Math.round(n).toLocaleString("es-MX")}`;
  const sys = document.querySelector("[data-sys]");
  if (sys) {
    const viewEl = sys.querySelector("[data-sys-view]");
    const title = sys.querySelector("[data-sys-title]");
    let view = "dash";
    let ticket = 0;
    let giroIndex = 0;
    const funnel = [
      { name: "Café Aurora", giro: "cafe", value: 9300, col: 2 },
      { name: "Barbería Norte", giro: "barber", value: 7800, col: 3 },
      { name: "Florería Pétalo", giro: "flowers", value: 8200, col: 0 },
      { name: "Sonríe Dental", giro: "dental", value: 12500, col: 1 },
      { name: "Pulso Gym", giro: "gym", value: 10400, col: 3 },
      { name: "Estudio Bella", giro: "beauty", value: 6900, col: 0 }
    ];
    const leadsData = [
      [["La Fonda de Mary", 4.7, 312, true], ["Tacos El Güero", 4.5, 1280, true], ["Bistró Olivo", 4.8, 204, false], ["Mariscos La Ola", 4.4, 532, true], ["Cocina Doña Lupe", 4.9, 87, true]],
      [["Clínica Dental Sonrisas", 4.8, 156, true], ["Dra. Paula Ríos", 4.9, 64, true], ["Dental Coyoacán", 4.3, 221, false], ["OdontoKids", 4.7, 98, true], ["Implantes del Sur", 4.6, 140, true]],
      [["Box Fuerza", 4.8, 233, true], ["Yoga Raíz", 4.9, 120, true], ["Gym Titán", 4.2, 610, false], ["Cycle Up", 4.7, 175, true], ["Crossfit Volcán", 4.6, 302, true]]
    ];
    const tickets = [["0142", "Café Aurora", true], ["0141", "Pulso Gym", false], ["0140", "Barbería Norte", true], ["0139", "Sonríe Dental", true]];
    const icons = {
      dash: '<path d="M4 13h6V4H4zM14 20h6v-9h-6zM14 4v4h6V4zM4 20h6v-3H4z"/>',
      funnel: '<path d="M4 5h16l-6 8v6l-4-2v-4z"/>',
      leads: '<path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z"/><circle cx="12" cy="10" r="2"/>',
      tickets: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>'
    };

    const toast = text => {
      const note = document.createElement("div");
      note.className = "ox-sys-toast";
      note.textContent = text;
      sys.append(note);
      setTimeout(() => note.classList.add("is-out"), 2200);
      setTimeout(() => note.remove(), 2700);
    };
    const countUp = (el, to, format) => {
      if (reduceMotion) { el.textContent = format(to); return; }
      const start = performance.now();
      const tick = now => {
        const k = Math.min((now - start) / 1200, 1);
        el.textContent = format(to * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const renderNav = () => {
      const t = sysText[lang()];
      sys.querySelector(".ox-sys-nav").innerHTML = Object.keys(t.views).map(id => `<button type="button" data-sys-go="${id}" aria-pressed="${id === view}"><svg viewBox="0 0 24 24" aria-hidden="true">${icons[id]}</svg><span>${t.views[id]}</span></button>`).join("");
      title.textContent = t.views[view];
      sys.querySelector(".ox-sys-badge").textContent = t.badge;
      sys.querySelector(".ox-sys-user span").textContent = t.user;
    };

    const views = {
      dash() {
        const t = sysText[lang()];
        const values = [42, 55, 48, 63, 71, 86];
        const clients = funnel.filter(f => f.col === 3).length + 46;
        viewEl.innerHTML = `
          <div class="ox-sys-kpis">${[clients, 126, 17, 86400].map((v, i) => `<article><span>${t.kpis[i]}</span><b data-count="${v}" data-money="${i === 3}">0</b><em>+${[8, 12, 3, 18][i]}%</em></article>`).join("")}</div>
          <div class="ox-sys-grid">
            <article class="ox-sys-card"><h4>${t.chart}</h4><div class="ox-sys-chart">${values.map((v, i) => `<div><i style="--h:${v}%;--d:${i * 80}ms"></i><span>${t.months[i]}</span></div>`).join("")}</div></article>
            <article class="ox-sys-card"><h4>${t.activity}</h4><ul class="ox-sys-feed">${t.feed.map(([what, who, when]) => `<li><i></i><div><b>${what}</b><span>${who}</span></div><small>${when}</small></li>`).join("")}</ul></article>
          </div>`;
        viewEl.querySelectorAll("[data-count]").forEach(el => countUp(el, Number(el.dataset.count), n => el.dataset.money === "true" ? money(n) : Math.round(n).toString()));
      },
      funnel() {
        const t = sysText[lang()];
        viewEl.innerHTML = `<p class="ox-sys-hint">${t.funnelHint}</p><div class="ox-sys-kanban">${t.columns.map((col, c) => {
          const cards = funnel.map((f, i) => ({ ...f, i })).filter(f => f.col === c);
          const total = cards.reduce((sum, f) => sum + f.value, 0);
          return `<section data-col="${c}"><header><b>${col}</b><span>${cards.length}</span></header><small>${money(total)}</small>${cards.map(f => `<button type="button" class="ox-sys-deal" draggable="true" data-deal="${f.i}"><b>${esc(f.name)}</b><span>${giros[f.giro] ? giros[f.giro][lang()].label : f.giro}</span><em>${money(f.value)}</em></button>`).join("")}</section>`;
        }).join("")}</div>`;
      },
      leads() {
        const t = sysText[lang()];
        viewEl.innerHTML = `
          <div class="ox-sys-leads">
            <div class="ox-sys-search">
              <h4>${t.leadsTitle}</h4>
              <div class="ox-sys-fields"><label><span>${t.giro}</span><select data-lead-giro>${t.giros.map((g, i) => `<option value="${i}" ${i === giroIndex ? "selected" : ""}>${g}</option>`).join("")}</select></label><label><span>${t.zone}</span><input data-lead-zone value="Coyoacán"></label></div>
              <button type="button" class="ox-sys-btn" data-lead-search>${icons.leads ? `<svg viewBox="0 0 24 24" aria-hidden="true">${icons.leads}</svg>` : ""}${t.search}</button>
              <ul class="ox-sys-results" data-lead-results></ul>
            </div>
            <div class="ox-sys-map" data-lead-map><i class="road a"></i><i class="road b"></i><i class="road c"></i><i class="park"></i></div>
          </div>`;
      },
      tickets() {
        const t = sysText[lang()];
        const [folio, client, paid] = tickets[ticket];
        const subtotal = t.items.reduce((sum, [, price]) => sum + price, 0);
        viewEl.innerHTML = `
          <div class="ox-sys-tickets">
            <div><h4>${t.ticketsTitle}</h4><ul class="ox-sys-list">${tickets.map(([f, c, p], i) => `<li><button type="button" data-ticket="${i}" aria-pressed="${i === ticket}"><b>#${f}</b><span>${c}</span><em class="${p ? "is-paid" : ""}">${p ? t.paid : t.pending}</em></button></li>`).join("")}</ul></div>
            <article class="ox-sys-receipt">
              <header><b>O<span>·</span> Orion Studio</b><small>${t.folio} #${folio}</small></header>
              <p class="ox-sys-client">${client}</p>
              <ul>${t.items.map(([item, price]) => `<li><span>${item}</span><b>${money(price)}</b></li>`).join("")}</ul>
              <div class="ox-sys-total"><span>${t.total}</span><b>${money(subtotal)}</b></div>
              <em class="ox-sys-stamp ${paid ? "is-paid" : ""}">${paid ? t.paid : t.pending}</em>
              <button type="button" class="ox-sys-btn ox-sys-wa" data-ticket-send><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1.3-3.9A8 8 0 1 1 8 18.8L4 20z"/></svg>${t.send}</button>
            </article>
          </div>`;
      }
    };

    const show = id => {
      view = id;
      renderNav();
      viewEl.classList.remove("is-in");
      views[id]();
      requestAnimationFrame(() => viewEl.classList.add("is-in"));
    };

    const search = () => {
      const t = sysText[lang()];
      const results = viewEl.querySelector("[data-lead-results]");
      const map = viewEl.querySelector("[data-lead-map]");
      const button = viewEl.querySelector("[data-lead-search]");
      giroIndex = Number(viewEl.querySelector("[data-lead-giro]").value);
      button.disabled = true;
      button.lastChild.textContent = t.searching;
      results.innerHTML = Array.from({ length: 4 }, () => '<li class="is-loading"><i></i><i></i></li>').join("");
      map.querySelectorAll(".pin").forEach(pin => pin.remove());
      setTimeout(() => {
        button.disabled = false;
        button.lastChild.textContent = t.search;
        const list = leadsData[giroIndex];
        results.innerHTML = list.map(([name, rating, reviews, noSite], i) => `<li style="--d:${i * 90}ms"><div><b>${name}</b><span>${rating.toFixed(1)} · ${reviews} ${t.reviews}</span></div><em class="${noSite ? "is-hot" : ""}">${noSite ? t.noSite : t.hasSite}</em><button type="button" data-lead-add="${i}">${t.add}</button></li>`).join("");
        list.forEach((lead, i) => {
          const pin = document.createElement("span");
          pin.className = `pin${lead[3] ? " is-hot" : ""}`;
          pin.style.left = `${[22, 58, 38, 74, 48][i]}%`;
          pin.style.top = `${[30, 22, 62, 55, 42][i]}%`;
          pin.style.animationDelay = `${i * 90}ms`;
          map.append(pin);
        });
      }, reduceMotion ? 0 : 900);
    };

    sys.addEventListener("click", event => {
      const t = sysText[lang()];
      const go = event.target.closest("[data-sys-go]");
      if (go) { show(go.dataset.sysGo); return; }
      const deal = event.target.closest("[data-deal]");
      if (deal) {
        const item = funnel[Number(deal.dataset.deal)];
        item.col = (item.col + 1) % 4;
        views.funnel();
        return;
      }
      if (event.target.closest("[data-lead-search]")) { search(); return; }
      const add = event.target.closest("[data-lead-add]");
      if (add && !add.disabled) {
        const [name] = leadsData[giroIndex][Number(add.dataset.leadAdd)];
        if (!funnel.some(f => f.name === name)) funnel.push({ name, giro: ["cafe", "dental", "gym"][giroIndex], value: 6000 + Math.round(Math.random() * 6) * 1000, col: 0 });
        add.disabled = true;
        add.textContent = t.added;
        toast(t.addedToast(name));
        return;
      }
      const pick = event.target.closest("[data-ticket]");
      if (pick) { ticket = Number(pick.dataset.ticket); views.tickets(); return; }
      if (event.target.closest("[data-ticket-send]")) toast(t.sentToast(tickets[ticket][1]));
    });

    // Arrastrar tarjetas entre columnas del embudo (con mouse)
    let dragging = null;
    sys.addEventListener("dragstart", event => {
      const deal = event.target.closest("[data-deal]");
      if (!deal) return;
      dragging = Number(deal.dataset.deal);
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", String(dragging));
    });
    sys.addEventListener("dragover", event => {
      const col = event.target.closest("[data-col]");
      if (!col || dragging === null) return;
      event.preventDefault();
      sys.querySelectorAll("[data-col]").forEach(c => c.classList.toggle("is-over", c === col));
    });
    sys.addEventListener("drop", event => {
      const col = event.target.closest("[data-col]");
      if (!col || dragging === null) return;
      event.preventDefault();
      funnel[dragging].col = Number(col.dataset.col);
      dragging = null;
      views.funnel();
    });
    sys.addEventListener("dragend", () => {
      dragging = null;
      sys.querySelectorAll("[data-col]").forEach(c => c.classList.remove("is-over"));
    });

    show("dash");
    onLang(() => show(view));
  }
})();
