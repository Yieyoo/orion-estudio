// Idioma de la portada (ES / EN). El texto fijo se traduce con un diccionario;
// las secciones que se dibujan con JavaScript escuchan el evento "orion:lang" y se redibujan.
(() => {
  const keyed = {
    "hero.title": {
      es: '<span class="w" style="--i:0">Ideas</span> <span class="w" style="--i:1">con</span><br><span class="w" style="--i:2">una</span> <span class="w" style="--i:3">gran</span> <em class="w" style="--i:4">presencia.</em>',
      en: '<span class="w" style="--i:0">Ideas</span> <span class="w" style="--i:1">with</span><br><span class="w" style="--i:2">a</span> <span class="w" style="--i:3">bold</span> <em class="w" style="--i:4">presence.</em>'
    },
    manifesto: {
      es: "Tu sitio es lo primero que ven tus clientes. Lo diseñamos para que en segundos entiendan qué haces, <em>confíen en ti</em> y <em>te escriban.</em>",
      en: "Your website is the first thing your customers see. We design it so that in seconds they understand what you do, <em>trust you</em> and <em>reach out.</em>"
    }
  };

  // Español → inglés. Las claves son el texto (o el HTML con <em>/<br>) tal como está en la página.
  const pairs = [
    ["Conceptos", "Concepts"], ["Servicios", "Services"], ["Proceso", "Process"], ["Crea el tuyo", "Build yours"], ["Hablemos", "Let's talk"],
    ["ESTUDIO DIGITAL INDEPENDIENTE · CDMX", "INDEPENDENT DIGITAL STUDIO · MEXICO CITY"],
    ["Diseñamos sitios web y experiencias digitales que hacen que tu negocio se vea tan bien como lo que ofrece.", "We design websites and digital experiences that make your business look as good as what it offers."],
    ["Cuéntame tu idea", "Tell me your idea"], ["Ver conceptos", "See concepts"],
    ["ESTRATEGIA", "STRATEGY"], ["DISEÑO", "DESIGN"], ["DESARROLLO", "DEVELOPMENT"], ["DESLIZA PARA EXPLORAR", "SCROLL TO EXPLORE"],
    ["POR QUÉ ORION", "WHY ORION"],
    ["Diseño original, sin plantillas", "Original design, no templates"],
    ["Pensado primero para el celular", "Mobile-first by design"],
    ["Listo para recibir clientes desde el primer día", "Ready to welcome customers from day one"],
    ["CONCEPTOS EN VIVO", "LIVE CONCEPTS"],
    ["Una web <em>a tu medida.</em>", "A website <em>made for you.</em>"],
    ["No son capturas: son sitios funcionando. Elige un giro y pruébalo como si fueras tu cliente.", "These aren't screenshots: they're working sites. Pick an industry and try it like your customer would."],
    ["Tienda en línea", "Online store"], ["Catálogo, carrito y pago", "Catalog, cart and checkout"],
    ["Servicios profesionales", "Professional services"], ["Portafolio y cotizador", "Portfolio and quote tool"],
    ["Eventos y espacios", "Events and venues"], ["Calendario y presupuesto", "Calendar and budget"],
    ["Restaurante", "Restaurant"], ["Carta y reservaciones", "Menu and reservations"],
    ["Menú digital", "Digital menu"], ["Pedidos desde el celular", "Orders from your phone"],
    ["Toca para probarla", "Tap to try it"], ["Desliza para ver otro concepto", "Swipe to see another concept"], ["Probar esta demo", "Try this demo"],
    ["PROPUESTA VISUAL", "VISUAL PROPOSAL"], ["Una muestra de estilo; el contenido se adapta a cada proyecto.", "A style sample; content is tailored to each project."],
    ["ARMA TU SITIO EN VIVO", "BUILD YOUR SITE LIVE"],
    ["Diseña tu web <em>en 30 segundos.</em>", "Design your website <em>in 30 seconds.</em>"],
    ["Elige giro, colores, tipografía y estilo. Así imaginamos contigo; tu sitio final se diseña a la medida.", "Pick your industry, colors, type and style. That's how we imagine with you; your final site is designed to measure."],
    ["SERVICIOS", "SERVICES"],
    ["Todo lo que tu web necesita <em>para vender.</em>", "Everything your website needs <em>to sell.</em>"],
    ["Diseño, tecnología y estrategia en un solo equipo. Tú te enfocas en tu negocio; nosotros, en que tu web trabaje por ti.", "Design, technology and strategy in one team. You focus on your business; we make your website work for you."],
    ["01 · Diseño a la medida", "01 · Custom design"], ["Un sitio que se ve como tu marca, no como una plantilla.", "A site that looks like your brand, not a template."],
    ["02 · Celular primero", "02 · Mobile first"], ["Impecable en cualquier pantalla.", "Flawless on any screen."], ["Se adapta solo", "Adapts on its own"],
    ["03 · Visible en Google", "03 · Found on Google"], ["Que te encuentren justo cuando te buscan.", "Get found right when they search for you."],
    ["Tu Negocio · Sitio oficial", "Your Business · Official site"], ["Horarios, ubicación y contacto directo por WhatsApp.", "Hours, location and direct WhatsApp contact."],
    ["04 · Contacto directo", "04 · Direct contact"], ["Visitas que se convierten en mensajes.", "Visits that turn into messages."],
    ["Hola, vi su página. ¿Tienen lugar el sábado?", "Hi, I saw your site. Any spots on Saturday?"], ["¡Hola! Sí, te comparto opciones.", "Hi! Yes, here are some options."], ["Perfecto, quiero apartar para 6.", "Perfect, I'd like to book for 6."],
    ["05 · Rápido y seguro", "05 · Fast and secure"], ["Carga al instante. Candado incluido.", "Loads instantly. Padlock included."],
    ["06 · Identidad visual", "06 · Visual identity"], ["Juega con colores y tipografía.", "Play with colors and type."],
    ["Tu marca", "Your brand"], ["Toca el texto y escribe el nombre de tu negocio", "Tap the text and type your business name"],
    ["Moderna", "Modern"], ["Elegante", "Elegant"], ["Divertida", "Playful"], ["Técnica", "Technical"],
    ["ANTES Y DESPUÉS", "BEFORE AND AFTER"],
    ["La diferencia se nota <em>en un segundo.</em>", "You can see the difference <em>in a second.</em>"],
    ["Arrastra para comparar un sitio típico con uno diseñado por Orion. Mismo negocio, otra historia.", "Drag to compare a typical site with one designed by Orion. Same business, a different story."],
    ["Antes", "Before"], ["Después", "After"],
    ["Se ve anticuado", "Looks outdated"], ["Se ve profesional", "Looks professional"],
    ["Difícil de usar en celular", "Hard to use on a phone"], ["Perfecto en cualquier pantalla", "Perfect on any screen"],
    ["Un correo que nadie revisa", "An inbox nobody checks"], ["WhatsApp a un toque", "WhatsApp in one tap"],
    ["SISTEMAS A LA MEDIDA", "CUSTOM SYSTEMS"],
    ["Más que páginas: <em>herramientas para tu negocio.</em>", "More than websites: <em>tools for your business.</em>"],
    ["También construimos sistemas: clientes, prospectos, cotizaciones y reportes en un solo lugar. Pruébalo; son datos de ejemplo.", "We also build systems: clients, leads, quotes and reports in one place. Try it — it's sample data."],
    ["Clientes y embudo de ventas", "Clients and sales pipeline"], ["Prospección con Google Maps", "Prospecting with Google Maps"],
    ["Tickets y recibos por WhatsApp", "Tickets and receipts on WhatsApp"], ["Reportes al día", "Up-to-date reports"],
    ["CÓMO TRABAJAMOS", "HOW WE WORK"],
    ["De la idea a tu web <em>en línea.</em>", "From idea to your website <em>online.</em>"],
    ["Un proceso claro, sin tecnicismos. Siempre sabes en qué paso vamos.", "A clear process, no jargon. You always know which step we're on."],
    ["Platicamos", "We talk"], ["Nos cuentas de tu negocio, tus clientes y lo que quieres lograr.", "You tell us about your business, your customers and your goals."],
    ["Diseñamos", "We design"], ["Te mostramos una propuesta visual antes de programar una sola línea.", "We show you a visual proposal before writing a single line of code."],
    ["Afinamos", "We refine"], ["Revisamos juntos cada detalle hasta que se sienta tuyo.", "We review every detail together until it feels like yours."],
    ["Lanzamos", "We launch"], ["Publicamos tu sitio y te acompañamos después del lanzamiento.", "We publish your site and stay with you after launch."],
    ["PREGUNTAS FRECUENTES", "FAQ"],
    ["Lo que nos preguntan <em>antes de empezar.</em>", "What people ask us <em>before starting.</em>"],
    ["¿Cuánto tarda en estar lista mi página?", "How long until my site is ready?"],
    ["Depende del tamaño del proyecto. Cuando platicamos te damos una fecha de entrega clara, antes de empezar.", "It depends on the size of the project. When we talk, we give you a clear delivery date before we start."],
    ["¿Qué necesito para empezar?", "What do I need to get started?"],
    ["Solo contarnos de tu negocio. Si ya tienes logo, fotos o textos, los usamos; si no, te ayudamos a definirlos.", "Just tell us about your business. If you already have a logo, photos or copy, we'll use them; if not, we'll help you define them."],
    ["¿Se va a ver bien en celular?", "Will it look good on phones?"],
    ["Sí. Diseñamos pensando primero en el celular, que es donde tus clientes te van a buscar.", "Yes. We design mobile-first, because that's where your customers will look for you."],
    ["¿Puedo pedir cambios después de lanzar?", "Can I request changes after launch?"],
    ["Sí. Seguimos contigo después del lanzamiento para que tu sitio se mantenga al día.", "Yes. We stay with you after launch so your site stays up to date."],
    ["¿Y si no sé exactamente qué quiero?", "What if I don't know exactly what I want?"],
    ["Para eso estamos. Revisa los conceptos de arriba, dinos cuál se parece a lo que imaginas y lo aterrizamos juntos.", "That's what we're here for. Check the concepts above, tell us which one feels closest and we'll shape it together."],
    ["¿TIENES ALGO EN MENTE?", "GOT SOMETHING IN MIND?"],
    ["Hagamos algo <em>que destaque.</em>", "Let's make something <em>that stands out.</em>"],
    ["Contesta cuatro preguntas rápidas y te dejamos tu idea lista para mandarla por WhatsApp. Te respondemos personalmente.", "Answer four quick questions and we'll have your idea ready to send on WhatsApp. We reply personally."],
    ["Prefiero escribir directo por WhatsApp", "I'd rather message directly on WhatsApp"],
    ["Arma tu idea", "Build your idea"], ["en línea", "online"],
    ["¿Hablamos?", "Let's talk"],
    ["¿Listo para destacar?", "Ready to stand out?"], ["Empecemos hoy", "Let's start today"],
    ["Preguntas", "FAQ"], ["Contacto", "Contact"],
    ["DISEÑO CON INTENCIÓN. HECHO PARA DESTACAR.", "DESIGN WITH INTENT. MADE TO STAND OUT."]
  ];
  const attrs = [
    ["Escríbenos por WhatsApp", "Message us on WhatsApp"], ["Concepto anterior", "Previous concept"], ["Siguiente concepto", "Next concept"],
    ["Escribe el nombre de tu negocio", "Type your business name"], ["Comparar antes y después", "Compare before and after"],
    ["pastelería en coyoacán|dentista cerca de mí|taquería en la roma|salón de eventos en cdmx", "bakery in coyoacan|dentist near me|tacos in roma norte|event venue in mexico city"]
  ];
  const titles = { es: "Orion Studio® — Diseño digital con intención", en: "Orion Studio® — Digital design with intent" };
  const descriptions = {
    es: "Orion Studio crea sitios web e identidades digitales para negocios con ambición.",
    en: "Orion Studio builds websites and digital identities for ambitious businesses."
  };

  const toEn = new Map(pairs);
  const toEs = new Map(pairs.map(([es, en]) => [en, es]));
  const attrEn = new Map(attrs);
  const attrEs = new Map(attrs.map(([es, en]) => [en, es]));
  const normalize = html => html.replace(/\s+/g, " ").trim();
  // Zonas que se dibujan solas en su idioma o que son demos de clientes (se quedan como están)
  const skip = "script, style, svg, [data-i18n], [data-chat-body], [data-chat-input], [data-make], [data-sys], [data-show-desc], .concept-site, .ox-show-screen, .ox-ba-site, .ox-phone, .ox-wordmark";
  const inlineOnly = el => [...el.children].every(child => ["EM", "BR", "STRONG"].includes(child.tagName));

  function translate(lang, live) {
    const map = lang === "en" ? toEn : toEs;
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const entry = keyed[el.dataset.i18n];
      if (!entry) return;
      el.innerHTML = entry[lang];
      // Con la página ya cargada, el texto nuevo aparece directo en lugar de repetir su entrada
      if (live) el.classList.add("is-static");
    });
    const walk = el => {
      if (el.matches(skip)) return;
      if (el.children.length && inlineOnly(el)) {
        const next = map.get(normalize(el.innerHTML));
        if (next) { el.innerHTML = next; return; }
      }
      el.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.data.trim();
          const next = text && map.get(text);
          if (next) node.data = node.data.replace(text, next);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          walk(node);
        }
      });
    };
    walk(document.body);
    const attrMap = lang === "en" ? attrEn : attrEs;
    document.querySelectorAll("[aria-label], [data-type]").forEach(el => {
      ["aria-label", "data-type"].forEach(name => {
        const value = el.getAttribute(name);
        if (value && attrMap.has(value)) el.setAttribute(name, attrMap.get(value));
      });
    });
    document.documentElement.lang = lang;
    document.title = titles[lang];
    document.querySelector('meta[name="description"]')?.setAttribute("content", descriptions[lang]);
    document.querySelectorAll("[data-lang-toggle]").forEach(button => button.setAttribute("aria-label", lang === "en" ? "Cambiar a español" : "Switch to English"));
  }

  const setLang = (lang, announce = true) => {
    translate(lang, announce);
    try { localStorage.setItem("orion-lang", lang); } catch (error) { /* sin almacenamiento disponible */ }
    if (announce) document.dispatchEvent(new CustomEvent("orion:lang", { detail: { lang } }));
  };

  document.addEventListener("click", event => {
    if (!event.target.closest("[data-lang-toggle]")) return;
    setLang(document.documentElement.lang === "en" ? "es" : "en");
  });

  let saved = null;
  try { saved = localStorage.getItem("orion-lang"); } catch (error) { /* sin almacenamiento disponible */ }
  if (saved === "en") setLang("en", false);
})();
