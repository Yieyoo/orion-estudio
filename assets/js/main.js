(() => {
  const menuButton = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav");
  const header = document.querySelector(".header");
  const hero = document.querySelector(".hero-immersive");

  if (header && hero) {
    const darkSections = [...document.querySelectorAll(".marquee, .ox-manifesto, .ox-services, .ox-contact, .ox-footer")];
    const updateHeader = () => {
      header.classList.toggle("is-scrolled", window.scrollY > hero.offsetHeight - header.offsetHeight - 24);
      // El menú se oscurece cuando debajo de él hay una sección oscura
      const line = header.offsetHeight / 2;
      header.classList.toggle("is-dark", darkSections.some(section => {
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

  const carousel = document.querySelector(".work-carousel");
  if (carousel) {
    const track = carousel.querySelector(".work-track");
    const stage = carousel.querySelector(".work-stage");
    const cards = [...carousel.querySelectorAll(".work-card")];
    const count = carousel.querySelector(".carousel-count");
    const conceptModal = document.querySelector(".concept-modal");
    let active = 0;
    let pointerStart = null;
    let suppressClick = false;

    const showCard = (index) => {
      active = (index + cards.length) % cards.length;
      count.innerHTML = `${String(active + 1).padStart(2, "0")} <i>/</i> ${String(cards.length).padStart(2, "0")}`;
      cards.forEach((card, i) => {
        const relative = (i - active + cards.length) % cards.length;
        const position = relative === cards.length - 1 ? -1 : relative;
        const hidden = Math.abs(position) > 1;
        card.dataset.position = String(position);
        card.setAttribute("aria-hidden", String(hidden));
        card.inert = hidden;
      });
    };

    stage.addEventListener("keydown", event => {
      if (event.key === "ArrowLeft") { event.preventDefault(); showCard(active - 1); }
      if (event.key === "ArrowRight") { event.preventDefault(); showCard(active + 1); }
    });

    stage.addEventListener("pointerdown", event => {
      pointerStart = { x: event.clientX, y: event.clientY };
    }, { passive: true });
    stage.addEventListener("pointerup", event => {
      if (!pointerStart) return;
      const dx = event.clientX - pointerStart.x;
      const dy = event.clientY - pointerStart.y;
      pointerStart = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
        suppressClick = true;
        showCard(active + (dx < 0 ? 1 : -1));
        window.setTimeout(() => { suppressClick = false; }, 0);
      }
    }, { passive: true });
    stage.addEventListener("pointercancel", () => { pointerStart = null; }, { passive: true });
    // Evita que el navegador arrastre la imagen y cancele el gesto con el mouse
    stage.addEventListener("dragstart", event => event.preventDefault());
    const openConcept = card => {
      if (!conceptModal?.showModal) return;
      const pageTypes = ["store", "professional", "events", "food", "menu"];
      const pageType = pageTypes.find(type => card.querySelector(`.image-${type}`)) || "store";
      if (!window.OrionConcepts) return;
      const category = card.querySelector(".work-caption h3")?.textContent || "Concepto";
      document.getElementById("concept-category").textContent = `· ${category.toUpperCase()}`;
      // El modal debe estar abierto antes de montar la demo para que midan bien sus elementos
      conceptModal.showModal();
      const domain = window.OrionConcepts.open(pageType, document.getElementById("concept-site"));
      conceptModal.querySelector(".concept-toolbar span").textContent = `www.${domain}`;
    };
    conceptModal?.addEventListener("close", () => window.OrionConcepts?.close());
    track.addEventListener("click", event => {
      if (suppressClick) { event.preventDefault(); event.stopPropagation(); return; }
      const card = event.target.closest(".work-card");
      if (!card) return;
      event.preventDefault();
      event.stopPropagation();
      openConcept(card);
    }, true);
    conceptModal?.querySelector(".concept-close")?.addEventListener("click", () => conceptModal.close());
    conceptModal?.addEventListener("click", event => {
      if (event.target === conceptModal || event.target.closest("[data-concept-contact]")) conceptModal.close();
    });
    showCard(0);
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Aparición escalonada de secciones al entrar en pantalla
  if ("IntersectionObserver" in window && !reduceMotion) {
    const groups = [
      ".section-head > *",
      ".work-carousel",
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
