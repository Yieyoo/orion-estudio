// Interacciones de la portada: manifiesto, servicios, proceso, armador de mensaje y footer
(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = n => Math.min(Math.max(n, 0), 1);

  // Las palabras del manifiesto se encienden conforme bajas
  const manifesto = document.querySelector("[data-words]");
  if (manifesto) {
    let words = [];
    const split = () => {
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
      words = [...manifesto.querySelectorAll(".mw")];
    };
    split();
    document.addEventListener("orion:lang", () => { split(); update(); });
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

  // Servicios: una sola tarjeta se anima a la vez, como un reflector que pasa de una a otra
  const bento = document.querySelector(".ox-bento");
  const isOn = tile => !bento || !bento.classList.contains("is-calm") || tile?.classList.contains("is-on");
  if (bento && !reduceMotion) {
    const tiles = [...bento.querySelectorAll(".ox-tile")];
    let current = -1;
    let held = false;
    let inView = false;
    let timer = 0;
    let touchedAt = 0;
    let sliding = false;
    let parkedAt = 0;
    const swipe = window.matchMedia("(max-width: 700px)");
    const dots = document.querySelector(".ox-bento-dots");
    if (dots) dots.innerHTML = tiles.map(() => "<i></i>").join("");
    const turn = i => {
      if (i === current) return;
      current = i;
      tiles.forEach((tile, k) => tile.classList.toggle("is-on", k === i));
      [...(dots?.children || [])].forEach((dot, k) => dot.classList.toggle("is-on", k === i));
    };
    // En celular el carrusel avanza solo; si la persona lo toca, espera un rato antes de seguir
    // Deslizamiento suave con su propia curva; el imán del carrusel se apaga mientras dura
    const slideTo = i => {
      const tile = tiles[i];
      const from = bento.scrollLeft;
      const to = tile.offsetLeft - (bento.clientWidth - tile.offsetWidth) / 2;
      const duration = i === 0 ? 1100 : 750;
      turn(i);
      const start = performance.now();
      sliding = true;
      bento.style.scrollSnapType = "none";
      const step = now => {
        const t = Math.min((now - start) / duration, 1);
        const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        if (Date.now() - touchedAt < 300) { bento.style.scrollSnapType = ""; sliding = false; return; }
        bento.scrollLeft = from + (to - from) * eased;
        if (t < 1) requestAnimationFrame(step);
        else { parkedAt = to; bento.style.scrollSnapType = ""; sliding = false; }
      };
      requestAnimationFrame(step);
    };
    const schedule = () => {
      clearTimeout(timer);
      if (held || !inView) return;
      timer = setTimeout(() => {
        const next = (current + 1) % tiles.length;
        if (!swipe.matches) turn(next);
        else if (Date.now() - touchedAt > 4000) slideTo(next);
        schedule();
      }, swipe.matches ? 3800 : 6500);
    };
    // Solo cuenta como "tocado" si la persona lo desliza de lado, no si solo baja por la página
    bento.addEventListener("scroll", () => { if (!sliding && Math.abs(bento.scrollLeft - parkedAt) > 6) touchedAt = Date.now(); }, { passive: true });
    bento.addEventListener("touchstart", () => { if (sliding) touchedAt = Date.now(); }, { passive: true });
    bento.classList.add("is-calm");
    tiles.forEach((tile, i) => {
      const hold = () => { held = true; clearTimeout(timer); turn(i); };
      tile.addEventListener("pointerenter", event => { if (event.pointerType === "mouse") hold(); });
      tile.addEventListener("pointerleave", event => { if (event.pointerType === "mouse") { held = false; schedule(); } });
      tile.addEventListener("pointerdown", () => { turn(i); schedule(); });
      tile.addEventListener("focusin", hold);
      tile.addEventListener("focusout", () => { held = false; schedule(); });
    });
    const check = () => {
      const r = bento.getBoundingClientRect();
      const visible = r.top < innerHeight * 0.75 && r.bottom > innerHeight * 0.25;
      if (visible === inView) return;
      inView = visible;
      if (inView && current < 0) turn(0);
      schedule();
    };
    addEventListener("scroll", check, { passive: true });
    check();
    // Carrusel en celular: se anima la tarjeta que queda al centro
    const middle = tile => tile.offsetLeft + tile.offsetWidth / 2;
    bento.addEventListener("scroll", () => {
      if (!swipe.matches) return;
      const center = bento.scrollLeft + bento.clientWidth / 2;
      turn(tiles.reduce((best, tile, k) => Math.abs(middle(tile) - center) < Math.abs(middle(tiles[best]) - center) ? k : best, 0));
    }, { passive: true });
    swipe.addEventListener?.("change", schedule);
  }

  // Búsqueda de Google que se escribe sola
  const typed = document.querySelector("[data-type]");
  if (typed) {
    const phrases = () => typed.dataset.type.split("|");
    const result = document.querySelector(".ox-result");
    const tile = typed.closest(".ox-tile");
    let index = 0;
    const typePhrase = () => {
      if (!isOn(tile)) { setTimeout(typePhrase, 400); return; }
      const phrase = phrases()[index++ % phrases().length];
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
    typed.textContent = phrases()[0];
    if (!reduceMotion) typePhrase();
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
      if (!isOn(brandkit.closest(".ox-tile"))) return;
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
      if (["Tu marca", "Your brand"].includes(sample.textContent)) {
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
    sample.addEventListener("blur", () => { if (!sample.textContent.trim()) sample.textContent = document.documentElement.lang === "en" ? "Your brand" : "Tu marca"; });
  }

  // Contacto como conversación: Orion pregunta, el cliente toca respuestas y lo envía por WhatsApp
  const chat = document.querySelector("[data-chatbox]");
  if (chat) {
    const body = chat.querySelector("[data-chat-body]");
    const input = chat.querySelector("[data-chat-input]");
    const status = chat.querySelector("[data-chat-status]");
    const copy = {
      es: {
        flow: [
          { key: "tipo", ask: "¡Hola! Soy Orion. Vamos a armar tu idea en cuatro preguntas. ¿Qué tipo de negocio tienes?",
            options: [["Restaurante", "un restaurante"], ["Tienda", "una tienda"], ["Servicios", "un negocio de servicios profesionales"], ["Salud", "un consultorio o clínica"], ["Eventos", "un espacio para eventos"], ["Otro", "otro tipo de negocio"]] },
          { key: "meta", ask: "¡Me encanta! ¿Qué es lo más importante que quieres lograr con tu web?",
            options: [["Más clientes", "conseguir más clientes"], ["Vender en línea", "vender en línea"], ["Reservaciones", "recibir reservaciones"], ["Verme profesional", "verme más profesional"], ["Menú digital", "tener un menú digital"]] },
          { key: "cuando", ask: "Perfecto. ¿Para cuándo te gustaría tenerla?",
            options: [["Lo antes posible", "lo antes posible"], ["Este mes", "este mes"], ["Sin prisa", "sin prisa, estoy explorando opciones"]] },
          { key: "nombre", ask: "Última pregunta: ¿cómo te llamas?", text: true }
        ],
        online: "en línea", typing: "escribiendo…", placeholder: "Escribe tu nombre", nameLabel: "Tu nombre", sendLabel: "Enviar",
        skip: "Prefiero no decirlo", done: name => `¡Listo${name ? `, ${name}` : ""}! Esto es lo que nos vas a mandar:`,
        yours: "Tu mensaje", send: "Enviar por WhatsApp", again: "Empezar de nuevo",
        message: a => `Hola Orion Studio${a.nombre ? `, soy ${a.nombre}` : ""}. Tengo ${a.tipo} y quiero una página web para ${a.meta}. Me gustaría tenerla ${a.cuando}.`
      },
      en: {
        flow: [
          { key: "tipo", ask: "Hi! I'm Orion. Let's shape your idea in four questions. What kind of business do you have?",
            options: [["Restaurant", "a restaurant"], ["Store", "a store"], ["Services", "a professional services business"], ["Health", "a clinic or practice"], ["Events", "an event venue"], ["Other", "another kind of business"]] },
          { key: "meta", ask: "Love it! What's the most important thing you want your website to do?",
            options: [["More customers", "get more customers"], ["Sell online", "sell online"], ["Bookings", "take bookings"], ["Look professional", "look more professional"], ["Digital menu", "have a digital menu"]] },
          { key: "cuando", ask: "Perfect. When would you like to have it?",
            options: [["As soon as possible", "as soon as possible"], ["This month", "this month"], ["No rush", "with no rush, I'm exploring options"]] },
          { key: "nombre", ask: "Last question: what's your name?", text: true }
        ],
        online: "online", typing: "typing…", placeholder: "Type your name", nameLabel: "Your name", sendLabel: "Send",
        skip: "I'd rather not say", done: name => `Done${name ? `, ${name}` : ""}! Here's what you'll send us:`,
        yours: "Your message", send: "Send on WhatsApp", again: "Start over",
        message: a => `Hi Orion Studio${a.nombre ? `, I'm ${a.nombre}` : ""}. I have ${a.tipo} and I want a website to ${a.meta}. I'd like to have it ${a.cuando}.`
      }
    };
    const t = () => copy[document.documentElement.lang === "en" ? "en" : "es"];
    const answers = {};
    let started = false;
    const timers = [];
    const wait = ms => new Promise(resolve => timers.push(setTimeout(resolve, reduceMotion ? 0 : ms)));
    const scrollDown = () => body.scrollTo({ top: body.scrollHeight, behavior: reduceMotion ? "auto" : "smooth" });
    // El robot de Orion es quien contesta: aparece en el encabezado y junto a sus mensajes
    const robot = chat.querySelector(".ox-chatbox-avatar .ox-bot").outerHTML;
    const mood = value => { chat.dataset.mood = value; };
    const bubble = (text, who, extra = "") => {
      const p = document.createElement("p");
      p.className = `ox-msg ${who} ${extra}`.trim();
      p.textContent = text;
      if (who === "bot") {
        const row = document.createElement("div");
        row.className = "ox-row bot";
        row.innerHTML = `<span class="ox-face">${robot}</span>`;
        row.append(p);
        body.append(row);
      } else body.append(p);
      scrollDown();
      return p;
    };
    const botSays = async text => {
      status.textContent = t().typing;
      mood("typing");
      const typing = document.createElement("div");
      typing.className = "ox-row bot is-typing";
      typing.innerHTML = `<span class="ox-face">${robot}</span><p class="ox-msg bot typing"><i></i><i></i><i></i></p>`;
      body.append(typing);
      scrollDown();
      await wait(650 + Math.min(text.length * 12, 900));
      typing.remove();
      status.textContent = t().online;
      mood("idle");
      bubble(text, "bot");
    };
    const message = () => t().message(answers);
    const ask = async step => {
      input.replaceChildren();
      const flow = t().flow;
      if (step >= flow.length) return finish();
      const item = flow[step];
      await botSays(item.ask);
      if (item.text) {
        const form = document.createElement("form");
        form.className = "ox-name-form";
        form.innerHTML = `<input name="nombre" autocomplete="given-name" placeholder="${t().placeholder}" aria-label="${t().nameLabel}" maxlength="40"><button type="submit" aria-label="${t().sendLabel}"><svg viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></button>`;
        const skip = document.createElement("button");
        skip.type = "button";
        skip.className = "ox-reply ghost";
        skip.textContent = t().skip;
        input.append(form, skip);
        const reply = value => {
          answers.nombre = value;
          bubble(value || t().skip, "me");
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
      await botSays(t().done(answers.nombre));
      const summary = bubble(message(), "bot", "summary");
      mood("happy");
      const label = document.createElement("small");
      label.textContent = t().yours;
      summary.prepend(label);
      const number = window.ORION_WHATSAPP || "525522574365";
      const send = document.createElement("a");
      send.className = "ox-chat-send";
      send.href = `https://wa.me/${number}?text=${encodeURIComponent(message())}`;
      send.target = "_blank";
      send.rel = "noopener";
      send.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1.3-3.9A8 8 0 1 1 8 18.8L4 20z"/></svg>${t().send}`;
      const again = document.createElement("button");
      again.type = "button";
      again.className = "ox-reply ghost";
      again.textContent = t().again;
      again.addEventListener("click", restart);
      input.replaceChildren(send, again);
    };
    const restart = () => {
      timers.splice(0).forEach(clearTimeout);
      Object.keys(answers).forEach(key => delete answers[key]);
      body.replaceChildren();
      mood("idle");
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
    // Al cambiar de idioma la conversación vuelve a empezar en el nuevo idioma
    document.addEventListener("orion:lang", () => {
      status.textContent = t().online;
      if (started) restart();
    });
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

  // El botón junto al planeta también lo hace explotar
  document.querySelector("[data-boom]")?.addEventListener("click", () => document.dispatchEvent(new Event("orion:boom")));

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
