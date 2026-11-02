// Interacciones de la portada: manifiesto, servicios, proceso, armador de mensaje y footer
(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = n => Math.min(Math.max(n, 0), 1);

  // Las palabras del manifiesto se encienden conforme bajas
  const manifesto = document.querySelector("[data-words]");
  if (manifesto) {
    const walker = document.createTreeWalker(manifesto, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    textNodes.forEach(node => {
      const fragment = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) { fragment.append(part); return; }
        const word = document.createElement("span");
        word.className = "mw";
        word.textContent = part;
        fragment.append(word);
      });
      node.replaceWith(fragment);
    });
    const words = [...manifesto.querySelectorAll(".mw")];
    const update = () => {
      const r = manifesto.getBoundingClientRect();
      const progress = reduceMotion ? 1 : clamp((innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.3));
      const lit = Math.round(progress * words.length);
      words.forEach((word, i) => word.classList.toggle("on", i < lit));
    };
    addEventListener("scroll", update, { passive: true });
    update();
  }

  // Luz que sigue al cursor en las tarjetas de servicios
  document.querySelectorAll("[data-spot]").forEach(tile => {
    tile.addEventListener("pointermove", event => {
      const r = tile.getBoundingClientRect();
      tile.style.setProperty("--mx", `${event.clientX - r.left}px`);
      tile.style.setProperty("--my", `${event.clientY - r.top}px`);
    });
  });

  // Búsqueda de Google que se escribe sola
  const typed = document.querySelector("[data-type]");
  if (typed) {
    const phrases = typed.dataset.type.split("|");
    const result = document.querySelector(".ox-result");
    let index = 0;
    const typePhrase = () => {
      const phrase = phrases[index++ % phrases.length];
      let length = 0;
      result.style.opacity = ".2";
      result.classList.remove("is-pop");
      const tick = () => {
        typed.textContent = phrase.slice(0, ++length);
        if (length < phrase.length) { setTimeout(tick, 50 + Math.random() * 70); return; }
        setTimeout(() => {
          result.style.opacity = "1";
          result.classList.add("is-pop");
          setTimeout(typePhrase, 2800);
        }, 380);
      };
      tick();
    };
    if (reduceMotion) typed.textContent = phrases[0];
    else typePhrase();
  }

  // La línea del proceso se llena conforme bajas
  const steps = document.querySelector("[data-steps]");
  if (steps) {
    const items = [...steps.children];
    const update = () => {
      const r = steps.getBoundingClientRect();
      const progress = reduceMotion ? 1 : clamp((innerHeight * 0.8 - r.top) / (r.height * 0.8 + innerHeight * 0.3));
      steps.style.setProperty("--p", progress.toFixed(3));
      items.forEach((item, i) => item.classList.toggle("is-lit", progress >= i / items.length + 0.04 || progress > 0.97));
    };
    addEventListener("scroll", update, { passive: true });
    update();
  }

  // Armador de mensaje: el cliente elige opciones y se redacta su WhatsApp
  const brief = document.querySelector("[data-brief]");
  if (brief) {
    const preview = brief.querySelector("[data-brief-preview]");
    const groups = Object.fromEntries([...brief.querySelectorAll("[data-group]")].map(g => [g.dataset.group, g]));
    const picked = name => [...groups[name].querySelectorAll('[aria-pressed="true"]')].map(b => b.dataset.value);
    const joinList = list => list.length < 2 ? list.join("") : `${list.slice(0, -1).join(", ")} y ${list[list.length - 1]}`;
    const compose = () => {
      const name = brief.elements.nombre.value.trim();
      const [tipo] = picked("tipo");
      const metas = picked("meta");
      const [cuando] = picked("cuando");
      let message = `Hola Orion Studio${name ? `, soy ${name}` : ""}. `;
      message += `Tengo ${tipo || "un negocio"} y quiero una página web`;
      message += metas.length ? ` para ${joinList(metas)}.` : ".";
      if (cuando) message += ` Me gustaría tenerla ${cuando}.`;
      return message;
    };
    const render = () => { preview.textContent = compose(); };
    brief.addEventListener("click", event => {
      const chip = event.target.closest("[data-group] button");
      if (!chip) return;
      const group = chip.parentElement;
      const on = chip.getAttribute("aria-pressed") !== "true";
      if (group.hasAttribute("data-single")) group.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", "false"));
      chip.setAttribute("aria-pressed", String(on));
      render();
    });
    brief.addEventListener("input", render);
    brief.addEventListener("submit", event => {
      event.preventDefault();
      const number = window.ORION_WHATSAPP || "525522574365";
      window.open(`https://wa.me/${number}?text=${encodeURIComponent(compose())}`, "_blank", "noopener");
    });
    render();
  }

  // La marca gigante del footer se llena de color al aparecer
  const wordmark = document.querySelector(".ox-wordmark");
  if (wordmark && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return;
      wordmark.classList.add("is-lit");
      io.disconnect();
    }, { threshold: 0.4 });
    io.observe(wordmark);
  } else if (wordmark) {
    wordmark.classList.add("is-lit");
  }
})();
