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

    const starCount = 420;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 21;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      starPositions[i * 3 + 2] = (Math.random() - 0.5) * 9 - 1;
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({
      color: 0xb7caff,
      size: 0.014,
      transparent: true,
      opacity: 0.46,
      sizeAttenuation: true
    }));
    scene.add(stars);

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
      world.scale.setScalar(mobile ? 0.76 : 1.04);
      world.position.x = mobile ? 2 : 2.1;
      world.position.y = mobile ? -2 : 0;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    }

    let frame = 0;
    let raf = 0;
    function animate() {
      pointer.x += (target.x - pointer.x) * 0.035;
      pointer.y += (target.y - pointer.y) * 0.035;
      world.rotation.y += reducedMotion ? 0 : 0.0018;
      world.position.y = (window.innerWidth < 700 ? -2 : 0) + (reducedMotion ? 0 : Math.sin(frame * 0.006) * 0.045);
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
      stars.rotation.y += reducedMotion ? 0 : 0.00012;
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
      else if (!reducedMotion) animate();
    });
  } catch (error) {
    console.warn("Orion 3D cover could not start:", error);
  }
})();
