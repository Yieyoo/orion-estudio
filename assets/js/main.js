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

  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  const WHATSAPP_NUMBER = "525522574365";
  const whatsapp = document.getElementById("whatsapp-link");
  if (whatsapp) {
    whatsapp.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hola Orion Studio, quiero platicar sobre un proyecto digital.")}`;
  }
})();
