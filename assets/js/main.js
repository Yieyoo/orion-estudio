(() => {
  const menuButton = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav");
  const header = document.querySelector(".header");
  const hero = document.querySelector(".hero-immersive");

  if (header && hero) {
    const updateHeader = () => {
      header.classList.toggle("is-scrolled", window.scrollY > hero.offsetHeight - header.offsetHeight - 24);
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
    track.addEventListener("click", event => {
      if (suppressClick) { event.preventDefault(); event.stopPropagation(); }
      const card = event.target.closest(".work-card");
      if (card && card.dataset.position !== "0") {
        event.preventDefault();
        showCard(active + (Number(card.dataset.position) < 0 ? -1 : 1));
      }
    }, true);
    showCard(0);
  }

  document.querySelectorAll(".service-card").forEach(card => {
    const toggle = card.querySelector(".service-toggle");
    const detail = card.querySelector(".service-detail");
    if (!toggle || !detail) return;
    detail.hidden = false;
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(open));
      card.classList.toggle("is-open", open);
      toggle.firstChild.textContent = open ? "Ocultar detalle " : "Ver qué incluye ";
      toggle.querySelector("span").textContent = open ? "−" : "＋";
    });
  });

  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  const WHATSAPP_NUMBER = "525522574365";
  const whatsapp = document.getElementById("whatsapp-link");
  if (whatsapp) {
    whatsapp.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hola Orion Studio, quiero platicar sobre un proyecto digital.")}`;
  }
})();
