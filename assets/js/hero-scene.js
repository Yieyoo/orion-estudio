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
    world.position.set(1.9, 0, 0);
    scene.add(world);

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(1.03, 96, 96),
      new THREE.MeshPhysicalMaterial({
        color: 0x547dff,
        metalness: 0.62,
        roughness: 0.16,
        clearcoat: 1,
        clearcoatRoughness: 0.06,
        emissive: 0x071b55,
        emissiveIntensity: 0.55
      })
    );
    world.add(core);

    const haloMaterial = new THREE.MeshBasicMaterial({
      color: 0x7ea5ff,
      transparent: true,
      opacity: 0.11,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const halo = new THREE.Mesh(new THREE.SphereGeometry(1.16, 64, 64), haloMaterial);
    world.add(halo);

    const ringMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xc7d8ff,
      metalness: 0.82,
      roughness: 0.19,
      clearcoat: 1,
      clearcoatRoughness: 0.08
    });
    const ringA = new THREE.Mesh(new THREE.TorusGeometry(2.05, 0.018, 12, 240), ringMaterial);
    ringA.rotation.set(1.08, 0.3, -0.36);
    world.add(ringA);

    const ringB = new THREE.Mesh(
      new THREE.TorusGeometry(2.65, 0.009, 8, 240),
      new THREE.MeshBasicMaterial({ color: 0x819fff, transparent: true, opacity: 0.62 })
    );
    ringB.rotation.set(0.54, -0.48, 0.7);
    world.add(ringB);

    const ribbonMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x244be5,
      metalness: 0.54,
      roughness: 0.23,
      clearcoat: 1,
      clearcoatRoughness: 0.12,
      side: THREE.DoubleSide
    });
    const ribbon = new THREE.Mesh(new THREE.TorusKnotGeometry(2.2, 0.105, 300, 16, 2, 3), ribbonMaterial);
    ribbon.scale.set(1.08, 0.9, 0.52);
    ribbon.rotation.set(0.22, 0.34, -0.18);
    world.add(ribbon);

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

    const starCount = 850;
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
      size: 0.018,
      transparent: true,
      opacity: 0.68,
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
      camera.position.z = bounds.width < 700 ? 11.6 : 10;
      world.position.x = bounds.width < 700 ? 1.35 : 1.9;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    }

    let frame = 0;
    let raf = 0;
    function animate() {
      pointer.x += (target.x - pointer.x) * 0.035;
      pointer.y += (target.y - pointer.y) * 0.035;
      world.rotation.y += reducedMotion ? 0 : 0.0018;
      world.rotation.x = pointer.y * 0.055 + (reducedMotion ? 0 : Math.sin(frame * 0.003) * 0.035);
      world.rotation.z = pointer.x * 0.035;
      ringA.rotation.z += reducedMotion ? 0 : 0.0013;
      ringB.rotation.y -= reducedMotion ? 0 : 0.001;
      ribbon.rotation.y -= reducedMotion ? 0 : 0.0016;
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
