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

  // La línea del proceso se llena tramo por tramo conforme bajas
  const steps = document.querySelector("[data-steps]");
  if (steps) {
    const items = [...steps.children];
    const update = () => {
      const r = steps.getBoundingClientRect();
      const progress = reduceMotion ? 1 : clamp((innerHeight * 0.78 - r.top) / (r.height * 0.75 + innerHeight * 0.2));
      const lit = items.map((item, i) => progress >= i / items.length + 0.02 || progress > 0.97);
      items.forEach((item, i) => {
        item.classList.toggle("is-lit", lit[i]);
        item.classList.toggle("is-seg", Boolean(lit[i + 1]));
      });
    };
    addEventListener("scroll", update, { passive: true });
    update();
  }

  // Identidad visual: escribe tu marca y prueba colores y tipografías
  const brandkit = document.querySelector("[data-brandkit]");
  if (brandkit) {
    const sample = brandkit.querySelector("[data-brand-sample]");
    const colors = [...brandkit.querySelectorAll("[data-color]")];
    const fonts = [...brandkit.querySelectorAll("[data-font]")];
    const pick = (group, button) => group.forEach(b => b.setAttribute("aria-pressed", String(b === button)));
    const setColor = button => { pick(colors, button); sample.style.color = button.dataset.color; };
    const setFont = button => {
      pick(fonts, button);
      sample.style.fontFamily = `"${button.dataset.font}", sans-serif`;
      sample.style.fontStyle = button.dataset.font === "Fraunces" ? "italic" : "";
      sample.style.fontWeight = button.dataset.font === "Fraunces" ? "400" : "";
    };
    // Mientras nadie la toca, la tarjeta se muestra sola
    let demo = reduceMotion ? 0 : setInterval(() => {
      setColor(colors[(colors.findIndex(b => b.getAttribute("aria-pressed") === "true") + 1) % colors.length]);
      setFont(fonts[(fonts.findIndex(b => b.getAttribute("aria-pressed") === "true") + 1) % fonts.length]);
    }, 2400);
    const stopDemo = () => { clearInterval(demo); demo = 0; };
    brandkit.addEventListener("click", event => {
      const color = event.target.closest("[data-color]");
      const font = event.target.closest("[data-font]");
      if (color) { stopDemo(); setColor(color); }
      if (font) { stopDemo(); setFont(font); }
    });
    sample.addEventListener("focus", () => {
      stopDemo();
      if (sample.textContent === "Tu marca") {
        const range = document.createRange();
        range.selectNodeContents(sample);
        getSelection().removeAllRanges();
        getSelection().addRange(range);
      }
    });
    sample.addEventListener("keydown", event => { if (event.key === "Enter") { event.preventDefault(); sample.blur(); } });
    sample.addEventListener("input", () => {
      if (sample.textContent.length > 18) sample.textContent = sample.textContent.slice(0, 18);
    });
    sample.addEventListener("paste", event => {
      event.preventDefault();
      document.execCommand("insertText", false, (event.clipboardData.getData("text") || "").slice(0, 18));
    });
    sample.addEventListener("blur", () => { if (!sample.textContent.trim()) sample.textContent = "Tu marca"; });
  }

  // Contacto como conversación: Orion pregunta, el cliente toca respuestas y lo envía por WhatsApp
  const chat = document.querySelector("[data-chatbox]");
  if (chat) {
    const body = chat.querySelector("[data-chat-body]");
    const input = chat.querySelector("[data-chat-input]");
    const status = chat.querySelector("[data-chat-status]");
    const flow = [
      { key: "tipo", ask: "¡Hola! Soy Orion. Vamos a armar tu idea en cuatro preguntas. ¿Qué tipo de negocio tienes?",
        options: [["Restaurante", "un restaurante"], ["Tienda", "una tienda"], ["Servicios", "un negocio de servicios profesionales"], ["Salud", "un consultorio o clínica"], ["Eventos", "un espacio para eventos"], ["Otro", "otro tipo de negocio"]] },
      { key: "meta", ask: "¡Me encanta! ¿Qué es lo más importante que quieres lograr con tu web?",
        options: [["Más clientes", "conseguir más clientes"], ["Vender en línea", "vender en línea"], ["Reservaciones", "recibir reservaciones"], ["Verme profesional", "verme más profesional"], ["Menú digital", "tener un menú digital"]] },
      { key: "cuando", ask: "Perfecto. ¿Para cuándo te gustaría tenerla?",
        options: [["Lo antes posible", "lo antes posible"], ["Este mes", "este mes"], ["Sin prisa", "sin prisa, estoy explorando opciones"]] },
      { key: "nombre", ask: "Última pregunta: ¿cómo te llamas?", text: true }
    ];
    const answers = {};
    let started = false;
    const timers = [];
    const wait = ms => new Promise(resolve => timers.push(setTimeout(resolve, reduceMotion ? 0 : ms)));
    const scrollDown = () => body.scrollTo({ top: body.scrollHeight, behavior: reduceMotion ? "auto" : "smooth" });
    const bubble = (text, who, extra = "") => {
      const p = document.createElement("p");
      p.className = `ox-msg ${who} ${extra}`.trim();
      p.textContent = text;
      body.append(p);
      scrollDown();
      return p;
    };
    const botSays = async text => {
      status.textContent = "escribiendo…";
      const typing = document.createElement("p");
      typing.className = "ox-msg bot typing";
      typing.innerHTML = "<i></i><i></i><i></i>";
      body.append(typing);
      scrollDown();
      await wait(650 + Math.min(text.length * 12, 900));
      typing.remove();
      status.textContent = "en línea";
      bubble(text, "bot");
    };
    const message = () => {
      let text = `Hola Orion Studio${answers.nombre ? `, soy ${answers.nombre}` : ""}. `;
      text += `Tengo ${answers.tipo} y quiero una página web para ${answers.meta}. `;
      text += `Me gustaría tenerla ${answers.cuando}.`;
      return text;
    };
    const ask = async step => {
      input.replaceChildren();
      if (step >= flow.length) return finish();
      const item = flow[step];
      await botSays(item.ask);
      if (item.text) {
        const form = document.createElement("form");
        form.className = "ox-name-form";
        form.innerHTML = '<input name="nombre" autocomplete="given-name" placeholder="Escribe tu nombre" aria-label="Tu nombre" maxlength="40"><button type="submit" aria-label="Enviar"><svg viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></button>';
        const skip = document.createElement("button");
        skip.type = "button";
        skip.className = "ox-reply ghost";
        skip.textContent = "Prefiero no decirlo";
        input.append(form, skip);
        const reply = value => {
          answers.nombre = value;
          bubble(value || "Prefiero no decirlo", "me");
          ask(step + 1);
        };
        form.addEventListener("submit", event => { event.preventDefault(); reply(form.elements.nombre.value.trim()); });
        skip.addEventListener("click", () => reply(""));
        if (finePointerChat) form.elements.nombre.focus({ preventScroll: true });
        return;
      }
      item.options.forEach(([label, value], i) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "ox-reply";
        button.style.animationDelay = `${i * 60}ms`;
        button.textContent = label;
        button.addEventListener("click", () => {
          answers[item.key] = value;
          bubble(label, "me");
          ask(step + 1);
        });
        input.append(button);
      });
    };
    const finish = async () => {
      await botSays(`¡Listo${answers.nombre ? `, ${answers.nombre}` : ""}! Esto es lo que nos vas a mandar:`);
      const summary = bubble(message(), "bot", "summary");
      const label = document.createElement("small");
      label.textContent = "Tu mensaje";
      summary.prepend(label);
      const number = window.ORION_WHATSAPP || "525522574365";
      const send = document.createElement("a");
      send.className = "ox-chat-send";
      send.href = `https://wa.me/${number}?text=${encodeURIComponent(message())}`;
      send.target = "_blank";
      send.rel = "noopener";
      send.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1.3-3.9A8 8 0 1 1 8 18.8L4 20z"/></svg>Enviar por WhatsApp';
      const again = document.createElement("button");
      again.type = "button";
      again.className = "ox-reply ghost";
      again.textContent = "Empezar de nuevo";
      again.addEventListener("click", restart);
      input.replaceChildren(send, again);
    };
    const restart = () => {
      timers.splice(0).forEach(clearTimeout);
      Object.keys(answers).forEach(key => delete answers[key]);
      body.replaceChildren();
      ask(0);
    };
    const finePointerChat = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    // La conversación empieza cuando el chat aparece en pantalla
    const check = () => {
      if (started) return;
      const r = chat.getBoundingClientRect();
      if (r.top < innerHeight * 0.75 && r.bottom > innerHeight * 0.2) {
        started = true;
        removeEventListener("scroll", check);
        ask(0);
      }
    };
    addEventListener("scroll", check, { passive: true });
    check();
    setTimeout(check, 600);
  }

  // El texto de la portada se eleva y se desvanece al bajar
  const heroCopy = document.querySelector(".hero-immersive .hero-copy");
  if (heroCopy && !reduceMotion) {
    const update = () => {
      const progress = clamp(scrollY / (heroCopy.closest("section").offsetHeight * 0.75));
      heroCopy.style.transform = progress ? `translateY(${progress * -70}px)` : "";
      heroCopy.style.opacity = progress ? String(1 - progress) : "";
    };
    addEventListener("scroll", update, { passive: true });
    update();
  }

  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  // La vitrina se inclina siguiendo al mouse
  const device = document.querySelector(".ox-show-device");
  if (device && finePointer && !reduceMotion) {
    device.addEventListener("pointermove", event => {
      const r = device.getBoundingClientRect();
      device.style.setProperty("--ty", `${((event.clientX - r.left) / r.width - 0.5) * 5}deg`);
      device.style.setProperty("--tx", `${((event.clientY - r.top) / r.height - 0.5) * -4}deg`);
    });
    device.addEventListener("pointerleave", () => {
      device.style.removeProperty("--tx");
      device.style.removeProperty("--ty");
    });
  }

  // Cursor personalizado: crece sobre enlaces y muestra una etiqueta sobre la vitrina
  if (finePointer && !reduceMotion) {
    const ring = document.createElement("div");
    ring.className = "ox-cursor-ring is-hidden";
    ring.setAttribute("aria-hidden", "true");
    ring.innerHTML = "<span></span>";
    document.body.append(ring);
    const label = ring.firstChild;
    const pos = { x: innerWidth / 2, y: innerHeight / 2 };
    const goal = { ...pos };
    addEventListener("pointermove", event => {
      goal.x = event.clientX;
      goal.y = event.clientY;
      ring.classList.remove("is-hidden");
    }, { passive: true });
    document.addEventListener("pointerleave", () => ring.classList.add("is-hidden"));
    document.addEventListener("pointerover", event => {
      const tagged = event.target.closest("[data-cursor]");
      const link = event.target.closest("a, button, summary, [role='button'], input, label");
      ring.classList.toggle("is-label", Boolean(tagged));
      ring.classList.toggle("is-link", Boolean(link) && !tagged);
      if (tagged) label.textContent = tagged.dataset.cursor;
    });
    const follow = () => {
      pos.x += (goal.x - pos.x) * 0.2;
      pos.y += (goal.y - pos.y) * 0.2;
      ring.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      // Dentro de la demo abierta, el cursor normal es suficiente
      ring.style.visibility = document.querySelector(".concept-modal[open]") ? "hidden" : "";
      requestAnimationFrame(follow);
    };
    follow();
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
