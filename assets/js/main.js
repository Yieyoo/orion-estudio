(() => {
  const menuButton = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav");
  const header = document.querySelector(".header");
  const hero = document.querySelector(".hero-immersive");

  if (header && hero) {
    const updateHeader = () => {
      header.classList.toggle("is-scrolled", window.scrollY > hero.offsetHeight - header.offsetHeight - 24);
      // El menú se oscurece cuando debajo de él hay una sección oscura
      const line = header.offsetHeight / 2;
      header.classList.toggle("is-dark", [...document.querySelectorAll(".ox-manifesto, .ox-show.is-dark, .ox-services, .ox-sys, .ox-contact, .ox-footer")].some(section => {
        const r = section.getBoundingClientRect();
        return r.top <= line && r.bottom > line;
      }));
    };
    window.addEventListener("scroll", updateHeader, { passive: true });
    updateHeader();
  }

  if (menuButton && nav) {
    const closeMenu = () => {
      nav.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "Abrir menú");
    };

    menuButton.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      menuButton.setAttribute("aria-expanded", String(open));
      menuButton.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    });

    nav.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));
    window.addEventListener("resize", () => {
      if (window.innerWidth > 700) closeMenu();
    });
  }

  // Vitrina de conceptos: cada demo real se muestra desplazándose sola dentro de un navegador
  const show = document.querySelector(".ox-show");
  const conceptModal = document.querySelector(".concept-modal");
  if (show && window.OrionConcepts) {
    const concepts = {
      store: { name: "Tienda en línea", en: ["Online store", "Filters, colors, a shoppable photo and a cart that tracks free shipping."], desc: "Filtros, colores, foto comprable y un carrito que calcula el envío gratis.", theme: ["#efe6d8", "#2a241e", "#b4532a", false] },
      professional: { name: "Servicios profesionales", en: ["Professional services", "Animated headline, sketch-to-result comparison and an instant quote tool."], desc: "Titular animado, comparador boceto–resultado y un cotizador al instante.", theme: ["#e4e2dc", "#0e0e0e", "#ff5a1f", false] },
      events: { name: "Eventos y espacios", en: ["Events and venues", "Availability calendar and a calculator that builds the budget."], desc: "Calendario de disponibilidad y una calculadora que arma el presupuesto.", theme: ["#2c3520", "#f5f0e6", "#d8c08e", true] },
      food: { name: "Restaurante", en: ["Restaurant", "Interactive menu and reservations with real-time availability."], desc: "Carta interactiva y reservaciones con horarios disponibles en tiempo real.", theme: ["#14100c", "#efe6d6", "#d99a4e", true] },
      menu: { name: "Menú digital", en: ["Digital menu", "QR menu: search, order with tip and live tracking."], desc: "Menú con QR: buscador, pedido con propina y seguimiento en vivo.", theme: ["#f7d77a", "#1d1a16", "#e2412b", false] }
    };
    const DURATION = 12000;
    const english = () => document.documentElement.lang === "en";
    const tabs = [...show.querySelectorAll("[data-concept]")];
    const device = show.querySelector(".ox-show-device");
    const screen = show.querySelector(".ox-show-screen");
    const domainLabel = show.querySelector("[data-show-domain]");
    const description = show.querySelector("[data-show-desc]");
    const counter = show.querySelector("[data-show-count]");
    const peeks = [...show.querySelectorAll(".ox-show-peek")];
    const dots = show.querySelector(".ox-show-dots");
    // Foto de portada de cada concepto, para los teléfonos que se asoman a los lados en celular
    const covers = { store: "1616486338812-3dadae4b4ace", professional: "1600585154340-be6161a56a0c", events: "1523438885200-e635ba2c371e", food: "1517248135467-4c7edcad34c4", menu: "1613514785940-daed07799d9b" };
    dots.innerHTML = tabs.map(() => "<i><b></b></i>").join("");
    const phone = window.matchMedia("(max-width: 760px)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let index = 0;
    let preview = null;
    let site = null;
    let elapsed = 0;
    let last = performance.now();
    let visible = false;
    let hovering = false;
    let switching = 0;

    // Ajusta la demo (pensada a 1280 px, o 390 px en celular) al tamaño real del marco
    const fit = () => {
      if (!site) return;
      const width = phone.matches ? 390 : 1280;
      const scale = screen.clientWidth / width;
      site.style.width = `${width}px`;
      site.style.height = `${screen.clientHeight / scale}px`;
      site.style.transform = `scale(${scale})`;
    };
    const mountPreview = () => {
      preview?.destroy();
      site = document.createElement("div");
      site.className = "ox-show-site";
      site.inert = true;
      screen.replaceChildren(site);
      fit();
      preview = window.OrionConcepts.preview(tabs[index].dataset.concept, site);
    };

    const select = (next, dir = 1) => {
      index = (next + tabs.length) % tabs.length;
      const type = tabs[index].dataset.concept;
      const [bg, ink, accent, dark] = concepts[type].theme;
      tabs.forEach((tab, i) => {
        tab.setAttribute("aria-selected", String(i === index));
        tab.style.setProperty("--p", "0");
      });
      [...dots.children].forEach((dot, i) => { dot.classList.toggle("is-on", i === index); dot.style.setProperty("--p", "0"); });
      peeks.forEach(peek => {
        const near = tabs[(index + Number(peek.dataset.showStep) + tabs.length) % tabs.length].dataset.concept;
        peek.style.setProperty("--cover", `url("https://images.unsplash.com/photo-${covers[near]}?auto=format&fit=crop&w=400&q=70")`);
        peek.style.setProperty("--peek-bg", concepts[near].theme[0]);
      });
      show.style.setProperty("--show-bg", bg);
      show.style.setProperty("--show-ink", ink);
      show.style.setProperty("--show-accent", accent);
      show.classList.toggle("is-dark", dark);
      description.textContent = english() ? concepts[type].en[1] : concepts[type].desc;
      counter.textContent = `${String(index + 1).padStart(2, "0")} / ${String(tabs.length).padStart(2, "0")}`;
      domainLabel.textContent = window.OrionConcepts.domain(type);
      device.setAttribute("aria-label", english() ? `Try the demo: ${concepts[type].en[0]}` : `Probar la demo: ${concepts[type].name}`);
      // En celular, la pestaña activa se desliza a la vista
      tabs[index].parentElement.parentElement.scrollTo({ left: tabs[index].parentElement.offsetLeft - 20, behavior: "smooth" });
      elapsed = 0;
      screen.dataset.dir = String(dir);
      screen.classList.add("is-switching");
      clearTimeout(switching);
      switching = setTimeout(() => {
        mountPreview();
        screen.classList.remove("is-switching");
      }, 280);
    };

    const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const loop = now => {
      requestAnimationFrame(loop);
      const delta = Math.min(now - last, 100);
      last = now;
      if (!visible || hovering || document.hidden || conceptModal?.open || !site) return;
      elapsed += delta;
      const t = Math.min(elapsed / DURATION, 1);
      tabs[index].style.setProperty("--p", t.toFixed(3));
      dots.children[index]?.style.setProperty("--p", t.toFixed(3));
      // Espera un momento arriba, recorre la página y pasa al siguiente concepto
      const max = site.scrollHeight - site.clientHeight;
      site.scrollTop = max * ease(Math.min(Math.max((t - 0.1) / 0.82, 0), 1));
      if (t >= 1) select(index + 1);
    };

    const openConcept = () => {
      if (!conceptModal?.showModal) return;
      const type = tabs[index].dataset.concept;
      document.getElementById("concept-category").textContent = `· ${(english() ? concepts[type].en[0] : concepts[type].name).toUpperCase()}`;
      // El modal debe estar abierto antes de montar la demo para que midan bien sus elementos
      conceptModal.showModal();
      const domain = window.OrionConcepts.open(type, document.getElementById("concept-site"));
      conceptModal.querySelector(".concept-toolbar span").textContent = `www.${domain}`;
    };

    tabs.forEach((tab, i) => tab.addEventListener("click", () => select(i, i < index ? -1 : 1)));
    show.querySelectorAll("[data-show-step]").forEach(button => button.addEventListener("click", () => {
      const step = Number(button.dataset.showStep);
      select(index + step, step);
    }));

    // Deslizar la vitrina (con el dedo o arrastrando) cambia de concepto; un toque la abre
    let dragStart = null;
    let dragged = false;
    device.addEventListener("pointerdown", event => {
      dragStart = { x: event.clientX, y: event.clientY };
      dragged = false;
    });
    device.addEventListener("pointermove", event => {
      if (!dragStart) return;
      const dx = event.clientX - dragStart.x;
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(event.clientY - dragStart.y)) {
        dragged = true;
        device.classList.add("is-dragging");
        device.style.translate = `${dx * 0.35}px 0`;
      }
    });
    const endDrag = event => {
      if (!dragStart) return;
      const dx = event.clientX - dragStart.x;
      dragStart = null;
      device.classList.remove("is-dragging");
      device.style.translate = "";
      if (dragged && Math.abs(dx) > 50) {
        show.classList.add("has-swiped");
        select(index + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
      }
    };
    device.addEventListener("pointerup", endDrag);
    device.addEventListener("pointercancel", endDrag);
    device.addEventListener("dragstart", event => event.preventDefault());
    device.style.touchAction = "pan-y";
    show.querySelectorAll("[data-open-concept]").forEach(button => button.addEventListener("click", () => {
      if (dragged) { dragged = false; return; }
      openConcept();
    }));
    device.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openConcept(); }
    });
    device.addEventListener("pointerenter", event => { if (event.pointerType === "mouse") hovering = true; });
    device.addEventListener("pointerleave", () => { hovering = false; });
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; }, { threshold: 0.25 }).observe(device);
    if ("ResizeObserver" in window) new ResizeObserver(fit).observe(screen);
    // Al cruzar entre celular y escritorio la demo se vuelve a montar con su otro diseño
    phone.addEventListener?.("change", mountPreview);
    select(0);
    if (!reduce) requestAnimationFrame(loop);
    document.addEventListener("orion:lang", () => {
      const type = tabs[index].dataset.concept;
      description.textContent = english() ? concepts[type].en[1] : concepts[type].desc;
    });
  }
  conceptModal?.addEventListener("close", () => window.OrionConcepts?.close());
  conceptModal?.querySelector(".concept-close")?.addEventListener("click", () => conceptModal.close());
  conceptModal?.addEventListener("click", event => {
    if (event.target === conceptModal || event.target.closest("[data-concept-contact]")) conceptModal.close();
  });

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Aparición escalonada de secciones al entrar en pantalla
  if ("IntersectionObserver" in window && !reduceMotion) {
    const groups = [
      ".ox-show-head > *",
      ".ox-show-stage",
      ".ox-head > *",
      ".ox-manifesto-foot > *",
      ".ox-tile",
      ".ox-make-body",
      ".ox-ba-frame",
      ".ox-ba-points li",
      ".ox-sys-app",
      ".ox-sys-feats li",
      ".ox-plan",
      ".ox-faq details",
      ".ox-contact-copy > *",
      ".ox-chatbox"
    ];
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const element = entry.target;
        element.classList.add("visible");
        revealObserver.unobserve(element);
        // Al terminar, devuelve el control a las transiciones y hovers propios del elemento
        const finish = event => {
          if (event.target !== element) return;
          element.removeEventListener("transitionend", finish);
          element.classList.remove("reveal", "visible");
          element.style.removeProperty("--reveal-i");
        };
        element.addEventListener("transitionend", finish);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    groups.forEach(selector => {
      document.querySelectorAll(selector).forEach(element => {
        element.classList.add("reveal");
        // El retraso escalonado cuenta desde sus hermanos, no desde toda la página
        element.style.setProperty("--reveal-i", String([...element.parentElement.children].indexOf(element)));
        revealObserver.observe(element);
      });
    });
  }

  // Botones que siguen ligeramente al cursor
  if (!reduceMotion && window.matchMedia("(pointer: fine)").matches) {
    document.querySelectorAll("[data-magnetic]").forEach(button => {
      button.addEventListener("pointermove", event => {
        const rect = button.getBoundingClientRect();
        const x = (event.clientX - rect.left - rect.width / 2) * 0.25;
        const y = (event.clientY - rect.top - rect.height / 2) * 0.35;
        button.style.transform = `translate(${x}px, ${y}px)`;
      });
      button.addEventListener("pointerleave", () => { button.style.transform = ""; });
    });
  }

  // WhatsApp flotante: aparece después del hero y se oculta en la sección de contacto
  const whatsappFloat = document.getElementById("whatsapp-float");
  const contactSection = document.getElementById("contacto");
  if (whatsappFloat && hero) {
    const updateFloat = () => {
      const pastHero = window.scrollY > hero.offsetHeight * 0.6;
      const contactTop = contactSection ? contactSection.getBoundingClientRect().top : Infinity;
      whatsappFloat.classList.toggle("is-visible", pastHero && contactTop > window.innerHeight * 0.6);
    };
    window.addEventListener("scroll", updateFloat, { passive: true });
    updateFloat();
  }

  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  const WHATSAPP_NUMBER = "525522574365";
  window.ORION_WHATSAPP = WHATSAPP_NUMBER;
  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hola Orion Studio, quiero platicar sobre un proyecto digital.")}`;
  ["whatsapp-link", "whatsapp-float"].forEach(id => {
    const link = document.getElementById(id);
    if (link) link.href = whatsappHref;
  });
})();
