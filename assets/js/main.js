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
      header.classList.toggle("is-dark", [...document.querySelectorAll(".marquee, .ox-manifesto, .ox-show.is-dark, .ox-services, .ox-contact, .ox-footer")].some(section => {
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
      store: { name: "Tienda en línea", desc: "Filtros, colores, foto comprable y un carrito que calcula el envío gratis.", theme: ["#efe6d8", "#2a241e", "#b4532a", false] },
      professional: { name: "Servicios profesionales", desc: "Titular animado, comparador boceto–resultado y un cotizador al instante.", theme: ["#e4e2dc", "#0e0e0e", "#ff5a1f", false] },
      events: { name: "Eventos y espacios", desc: "Calendario de disponibilidad y una calculadora que arma el presupuesto.", theme: ["#2c3520", "#f5f0e6", "#d8c08e", true] },
      food: { name: "Restaurante", desc: "Carta interactiva y reservaciones con horarios disponibles en tiempo real.", theme: ["#14100c", "#efe6d6", "#d99a4e", true] },
      menu: { name: "Menú digital", desc: "Menú con QR: buscador, pedido con propina y seguimiento en vivo.", theme: ["#f7d77a", "#1d1a16", "#e2412b", false] }
    };
    const DURATION = 12000;
    const tabs = [...show.querySelectorAll("[data-concept]")];
    const device = show.querySelector(".ox-show-device");
    const screen = show.querySelector(".ox-show-screen");
    const domainLabel = show.querySelector("[data-show-domain]");
    const description = show.querySelector("[data-show-desc]");
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

    const select = next => {
      index = (next + tabs.length) % tabs.length;
      const type = tabs[index].dataset.concept;
      const [bg, ink, accent, dark] = concepts[type].theme;
      tabs.forEach((tab, i) => {
        tab.setAttribute("aria-selected", String(i === index));
        tab.style.setProperty("--p", "0");
      });
      show.style.setProperty("--show-bg", bg);
      show.style.setProperty("--show-ink", ink);
      show.style.setProperty("--show-accent", accent);
      show.classList.toggle("is-dark", dark);
      description.textContent = concepts[type].desc;
      domainLabel.textContent = window.OrionConcepts.domain(type);
      device.setAttribute("aria-label", `Probar la demo: ${concepts[type].name}`);
      // En celular, la pestaña activa se desliza a la vista
      tabs[index].parentElement.parentElement.scrollTo({ left: tabs[index].parentElement.offsetLeft - 20, behavior: "smooth" });
      elapsed = 0;
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
      // Espera un momento arriba, recorre la página y pasa al siguiente concepto
      const max = site.scrollHeight - site.clientHeight;
      site.scrollTop = max * ease(Math.min(Math.max((t - 0.1) / 0.82, 0), 1));
      if (t >= 1) select(index + 1);
    };

    const openConcept = () => {
      if (!conceptModal?.showModal) return;
      const type = tabs[index].dataset.concept;
      document.getElementById("concept-category").textContent = `· ${concepts[type].name.toUpperCase()}`;
      // El modal debe estar abierto antes de montar la demo para que midan bien sus elementos
      conceptModal.showModal();
      const domain = window.OrionConcepts.open(type, document.getElementById("concept-site"));
      conceptModal.querySelector(".concept-toolbar span").textContent = `www.${domain}`;
    };

    tabs.forEach((tab, i) => tab.addEventListener("click", () => select(i)));
    show.querySelectorAll("[data-open-concept]").forEach(button => button.addEventListener("click", openConcept));
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
      ".ox-plan",
      ".ox-faq details",
      ".ox-contact-copy > *",
      ".ox-brief"
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
