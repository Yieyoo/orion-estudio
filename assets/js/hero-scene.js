(() => {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas || !window.THREE) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  try {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
    renderer.setClearColor(0x080d18, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0, 10);

    // En celular el orbe se ve grande, a la derecha y detrás del texto, como en escritorio
    let mobileY = 0;
    const world = new THREE.Group();
    world.position.set(2.25, 0, 0);
    scene.add(world);

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(1.03, 96, 96),
      new THREE.MeshPhysicalMaterial({
        color: 0x4568e8,
        metalness: 0.48,
        roughness: 0.23,
        clearcoat: 1,
        clearcoatRoughness: 0.06,
        emissive: 0x071b55,
        emissiveIntensity: 0.3
      })
    );
    world.add(core);

    const haloMaterial = new THREE.MeshBasicMaterial({
      color: 0x7ea5ff,
      transparent: true,
      opacity: 0.075,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const halo = new THREE.Mesh(new THREE.SphereGeometry(1.16, 64, 64), haloMaterial);
    world.add(halo);

    const ringMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xbac9ec,
      metalness: 0.76,
      roughness: 0.24,
      clearcoat: 1,
      clearcoatRoughness: 0.08
    });
    const ringA = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.012, 10, 240), ringMaterial);
    ringA.rotation.set(1.08, 0.3, -0.36);
    world.add(ringA);

    const ringB = new THREE.Mesh(
      new THREE.TorusGeometry(2.55, 0.007, 8, 240),
      new THREE.MeshBasicMaterial({ color: 0x819fff, transparent: true, opacity: 0.4 })
    );
    ringB.rotation.set(0.54, -0.48, 0.7);
    world.add(ringB);

    const arc = new THREE.Mesh(
      new THREE.TorusGeometry(2.82, 0.009, 8, 240),
      new THREE.MeshBasicMaterial({ color: 0x9db6ff, transparent: true, opacity: 0.58 })
    );
    arc.rotation.set(-0.62, 0.28, 0.42);
    world.add(arc);

    const orbitMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x365cf5,
      metalness: 0.68,
      roughness: 0.2,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      side: THREE.DoubleSide
    });
    const orbit = new THREE.Mesh(new THREE.TorusGeometry(2.08, 0.075, 18, 240), orbitMaterial);
    orbit.scale.set(1.05, 0.82, 0.62);
    orbit.rotation.set(0.22, 0.34, -0.18);
    world.add(orbit);

    const satellitePath = new THREE.Group();
    world.add(satellitePath);
    const satellite = new THREE.Mesh(
      new THREE.SphereGeometry(0.105, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0xe5edff, metalness: 0.38, roughness: 0.2, emissive: 0x617fff, emissiveIntensity: 0.35 })
    );
    satellite.position.set(0, 1.75, 0.55);
    satellitePath.add(satellite);
    const satelliteRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.17, 0.008, 6, 48),
      new THREE.MeshBasicMaterial({ color: 0xc5d4ff, transparent: true, opacity: 0.62 })
    );
    satelliteRing.position.copy(satellite.position);
    satelliteRing.rotation.x = 0.7;
    satellitePath.add(satelliteRing);

    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0x9bb5ff });
    const markers = [[-1.78, 0.9, 0.42], [1.7, -1.08, -0.28], [-0.4, -2.05, 0.2]].map(([x, y, z], index) => {
      const marker = new THREE.Mesh(new THREE.SphereGeometry(index === 1 ? 0.035 : 0.025, 12, 12), markerMaterial);
      marker.position.set(x, y, z);
      world.add(marker);
      return marker;
    });

    const lights = [
      [new THREE.AmbientLight(0x8797c3, 1.05), 0, 0, 0],
      [new THREE.PointLight(0xffffff, 2.2, 18), -2.4, 2.6, 4],
      [new THREE.PointLight(0x437bff, 4.4, 17), 3.6, 0.4, 1],
      [new THREE.PointLight(0x99d4ff, 2.8, 16), -3, -2.4, -1]
    ];
    lights.forEach(([light, x, y, z]) => {
      light.position.set(x, y, z);
      scene.add(light);
    });

    // Fondo de espacio: estrellas que titilan, estrellas fugaces y pequeñas explosiones
    const starCount = 1600;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);
    const starPhases = new Float32Array(starCount);
    const starPalette = [0xb7caff, 0xb7caff, 0xffffff, 0x8fb0ff, 0xffdcb8].map(hex => new THREE.Color(hex));
    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 30;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 18;
      starPositions[i * 3 + 2] = -Math.random() * 12 + 2;
      const color = starPalette[Math.floor(Math.random() * starPalette.length)];
      starColors.set([color.r, color.g, color.b], i * 3);
      starSizes[i] = 0.9 + Math.pow(Math.random(), 4) * 3.8;
      starPhases[i] = Math.random() * Math.PI * 2;
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute("aColor", new THREE.BufferAttribute(starColors, 3));
    starGeometry.setAttribute("aSize", new THREE.BufferAttribute(starSizes, 1));
    starGeometry.setAttribute("aPhase", new THREE.BufferAttribute(starPhases, 1));
    const starMaterial = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uPixelRatio: { value: renderer.getPixelRatio() } },
      vertexShader: `
        attribute vec3 aColor;
        attribute float aSize;
        attribute float aPhase;
        uniform float uTime;
        uniform float uPixelRatio;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vAlpha = 0.45 + 0.55 * sin(uTime * (0.5 + fract(aPhase) * 1.8) + aPhase);
          vColor = aColor;
          gl_PointSize = aSize * uPixelRatio * (21.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }`,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          float glow = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5));
          gl_FragColor = vec4(vColor, glow * glow * vAlpha);
        }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Ancho y alto visibles a cierta profundidad, para que los efectos aparezcan en pantalla
    function viewSizeAt(z) {
      const halfHeight = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * (camera.position.z - z);
      return { halfWidth: halfHeight * camera.aspect, halfHeight };
    }
    const random = (min, max) => min + Math.random() * (max - min);

    const shootingStars = Array.from({ length: 3 }, () => {
      const geometry = new THREE.PlaneGeometry(2.2, 0.022);
      geometry.translate(1.1, 0, 0);
      // Cabeza brillante, cola que se desvanece
      geometry.setAttribute("color", new THREE.Float32BufferAttribute([1, 1, 1, 0, 0, 0, 0.85, 0.9, 1, 0, 0, 0], 3));
      const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
        vertexColors: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
      }));
      mesh.visible = false;
      mesh.userData = { life: 0, duration: 1, velocity: new THREE.Vector3() };
      scene.add(mesh);
      return mesh;
    });

    function makeGlowTexture(stops) {
      const size = 128;
      const glowCanvas = document.createElement("canvas");
      glowCanvas.width = glowCanvas.height = size;
      const context = glowCanvas.getContext("2d");
      const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      stops.forEach(([offset, color]) => gradient.addColorStop(offset, color));
      context.fillStyle = gradient;
      context.fillRect(0, 0, size, size);
      return new THREE.CanvasTexture(glowCanvas);
    }
    const flashTexture = makeGlowTexture([[0, "rgba(255,255,255,1)"], [0.12, "rgba(220,230,255,.9)"], [0.35, "rgba(120,150,255,.28)"], [1, "rgba(60,90,255,0)"]]);
    const ringTexture = makeGlowTexture([[0, "rgba(255,255,255,0)"], [0.62, "rgba(160,185,255,0)"], [0.78, "rgba(200,215,255,.55)"], [0.86, "rgba(120,150,255,.18)"], [1, "rgba(80,110,255,0)"]]);
    const novaTints = [0xffffff, 0xa9bcff, 0x8fd0ff, 0xffd6b0];
    const novas = Array.from({ length: 3 }, () => {
      const flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: flashTexture, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
      const ring = new THREE.Sprite(new THREE.SpriteMaterial({ map: ringTexture, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
      const group = new THREE.Group();
      group.add(flash, ring);
      group.visible = false;
      group.userData = { life: 0, duration: 1.8, size: 1, flash, ring };
      scene.add(group);
      return group;
    });

    function launchShootingStar() {
      const star = shootingStars.find(item => !item.visible);
      if (!star) return;
      const z = random(-4, 0);
      const { halfWidth, halfHeight } = viewSizeAt(z);
      const angle = random(0.32, 0.62);
      const speed = random(7, 11);
      star.position.set(random(-halfWidth * 0.4, halfWidth * 1.2), halfHeight * random(0.45, 0.95), z);
      star.rotation.set(0, 0, angle);
      star.userData.velocity.set(-Math.cos(angle) * speed, -Math.sin(angle) * speed, 0);
      star.userData.life = 0;
      star.userData.duration = random(0.8, 1.3);
      star.visible = true;
    }

    function launchNova() {
      const nova = novas.find(item => !item.visible);
      if (!nova) return;
      const z = random(-7, -3);
      const { halfWidth, halfHeight } = viewSizeAt(z);
      // Sobre todo a la derecha, lejos del texto
      nova.position.set(random(-halfWidth * 0.1, halfWidth * 0.95), random(-halfHeight * 0.8, halfHeight * 0.85), z);
      const tint = novaTints[Math.floor(Math.random() * novaTints.length)];
      nova.userData.flash.material.color.setHex(tint);
      nova.userData.ring.material.color.setHex(tint);
      nova.userData.size = random(0.7, 1.4);
      nova.userData.life = 0;
      nova.userData.duration = random(1.5, 2.3);
      nova.visible = true;
    }

    let nextShootingStar = random(1.2, 3);
    let nextNova = random(0.8, 2);
    function updateSpace(delta) {
      nextShootingStar -= delta;
      nextNova -= delta;
      if (nextShootingStar <= 0) { launchShootingStar(); nextShootingStar = random(2.5, 6); }
      if (nextNova <= 0) { launchNova(); nextNova = random(1.8, 4.2); }

      shootingStars.forEach(star => {
        if (!star.visible) return;
        const data = star.userData;
        data.life += delta;
        const t = data.life / data.duration;
        if (t >= 1) { star.visible = false; return; }
        star.position.addScaledVector(data.velocity, delta);
        star.material.opacity = Math.sin(Math.PI * t) * 0.95;
      });

      novas.forEach(nova => {
        if (!nova.visible) return;
        const data = nova.userData;
        data.life += delta;
        const t = data.life / data.duration;
        if (t >= 1) { nova.visible = false; return; }
        const flashIn = Math.min(t / 0.08, 1);
        const flashOut = Math.pow(1 - t, 3);
        data.flash.scale.setScalar(data.size * (0.25 + 0.75 * flashIn) * (0.6 + 0.4 * flashOut));
        data.flash.material.opacity = flashIn * flashOut;
        const ringProgress = 1 - Math.pow(1 - t, 3);
        data.ring.scale.setScalar(data.size * 2.4 * ringProgress);
        data.ring.material.opacity = Math.pow(1 - t, 1.6) * 0.9;
      });
    }

    const pointer = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    canvas.addEventListener("pointermove", event => {
      const bounds = canvas.getBoundingClientRect();
      target.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
      target.y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    }, { passive: true });
    canvas.addEventListener("pointerleave", () => { target.x = 0; target.y = 0; });

    function resize() {
      const bounds = canvas.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      renderer.setSize(bounds.width, bounds.height, false);
      camera.aspect = bounds.width / bounds.height;
      const mobile = bounds.width < 700;
      camera.position.z = mobile ? 13.2 : 10.3;
      // Convierte píxeles de pantalla a unidades de la escena para colocar el orbe en celular
      const unitsPerPx = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z / bounds.height;
      const orbRadiusPx = bounds.width * 0.95;
      mobileY = bounds.height * 0.04 * unitsPerPx;
      world.scale.setScalar(mobile ? orbRadiusPx * unitsPerPx / 2.82 : 1.04);
      world.position.x = mobile ? bounds.width * 0.45 * unitsPerPx : 2.1;
      world.position.y = mobile ? mobileY : 0;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    }

    let frame = 0;
    let raf = 0;
    const clock = new THREE.Clock();
    function animate() {
      const delta = Math.min(clock.getDelta(), 0.05);
      starMaterial.uniforms.uTime.value += delta;
      if (!reducedMotion) updateSpace(delta);
      pointer.x += (target.x - pointer.x) * 0.035;
      pointer.y += (target.y - pointer.y) * 0.035;
      world.rotation.y += reducedMotion ? 0 : 0.0018;
      world.position.y = (window.innerWidth < 700 ? mobileY : 0) + (reducedMotion ? 0 : Math.sin(frame * 0.006) * 0.045);
      world.rotation.x = pointer.y * 0.055 + (reducedMotion ? 0 : Math.sin(frame * 0.003) * 0.035);
      world.rotation.z = pointer.x * 0.035;
      ringA.rotation.z += reducedMotion ? 0 : 0.0013;
      ringB.rotation.y -= reducedMotion ? 0 : 0.001;
      orbit.rotation.y -= reducedMotion ? 0 : 0.0012;
      satellitePath.rotation.y += reducedMotion ? 0 : 0.003;
      arc.rotation.y += reducedMotion ? 0 : 0.00065;
      if (!reducedMotion) markers.forEach((marker, index) => {
        marker.scale.setScalar(1 + Math.sin(frame * 0.035 + index * 1.8) * 0.16);
      });
      stars.rotation.y += reducedMotion ? 0 : 0.00022;
      stars.rotation.z += reducedMotion ? 0 : 0.00006;
      renderer.render(scene, camera);
      frame++;
      if (!reducedMotion) raf = requestAnimationFrame(animate);
    }

    resize();
    if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas);
    else window.addEventListener("resize", resize);
    animate();

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else if (!reducedMotion) { clock.getDelta(); animate(); }
    });
  } catch (error) {
    console.warn("Orion 3D cover could not start:", error);
  }
})();
