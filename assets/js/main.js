(() => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const menuButton = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav");
  if (menuButton && nav) {
    menuButton.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      menuButton.setAttribute("aria-expanded", String(open));
      menuButton.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    });
    nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
      nav.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
    }));
  }
  document.getElementById("year").textContent = new Date().getFullYear();

  const revealItems = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduced) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    }), { threshold: 0.13 });
    revealItems.forEach(item => observer.observe(item));
  } else revealItems.forEach(item => item.classList.add("visible"));

  const pointer = document.querySelector(".pointer");
  if (pointer && matchMedia("(pointer: fine)").matches) {
    window.addEventListener("pointermove", e => {
      pointer.style.left = `${e.clientX}px`;
      pointer.style.top = `${e.clientY}px`;
    }, { passive: true });
    document.querySelectorAll("a,button").forEach(el => {
      el.addEventListener("pointerenter", () => pointer.classList.add("active"));
      el.addEventListener("pointerleave", () => pointer.classList.remove("active"));
    });
  }

  if (window.gsap && window.ScrollTrigger && !reduced) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.fromTo(".hero-copy", { y: 0 }, {
      y: -35, opacity: 0.72, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.6 }
    });
    gsap.fromTo(".hero-art", { y: 0, scale: 1 }, {
      y: 48, scale: 0.96, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.7 }
    });
    gsap.utils.toArray(".project-image img").forEach(img => {
      gsap.fromTo(img, { scale: 1.08 }, {
        scale: 1, ease: "none",
        scrollTrigger: { trigger: img.closest(".project-image"), start: "top bottom", end: "bottom top", scrub: 0.6 }
      });
    });
    gsap.fromTo(".statement h2", { y: 25 }, {
      y: -10, ease: "none",
      scrollTrigger: { trigger: ".statement", start: "top bottom", end: "bottom top", scrub: 0.6 }
    });
  }

  const WHATSAPP_NUMBER = "5210000000000"; // Reemplaza por tu número real, sin + ni espacios.
  const whatsapp = document.getElementById("whatsapp-link");
  if (whatsapp && WHATSAPP_NUMBER !== "5210000000000") {
    whatsapp.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hola Orion Studio, quiero platicar sobre un proyecto digital.")}`;
  }
})();
