(() => {
  const canvas = document.getElementById("orbit-canvas");
  const stage = document.getElementById("hero-art");
  if (!canvas || !stage || !window.THREE) return;

  try {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    if (THREE.ACESFilmicToneMapping) renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 10);
    camera.position.set(0, 0, 4.4);

    const geometry = new THREE.SphereGeometry(1, 96, 96);
    const material = new THREE.MeshPhysicalMaterial({
      color: 0x9bcaff,
      metalness: 0.28,
      roughness: 0.13,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      reflectivity: 0.9
    });
    const gem = new THREE.Mesh(geometry, material);
    scene.add(gem);

    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(2.2, 2.6, 3.4);
    scene.add(key);

    const rim = new THREE.PointLight(0x7bc5ff, 2.1, 14);
    rim.position.set(-2.6, -1.4, 1.8);
    scene.add(rim);

    const fillLight = new THREE.PointLight(0xffffff, 0.7, 12);
    fillLight.position.set(0, 2.2, -2.4);
    scene.add(fillLight);

    const ambient = new THREE.AmbientLight(0x54708f, 0.8);
    scene.add(ambient);

    let target = { x: 0, y: 0 };
    let current = { x: 0, y: 0 };

    stage.addEventListener("pointermove", (e) => {
      const r = stage.getBoundingClientRect();
      target.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      target.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    });
    stage.addEventListener("pointerleave", () => {
      target.x = 0;
      target.y = 0;
    });

    function size() {
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      renderer.setSize(r.width, r.height, false);
      camera.aspect = r.width / r.height;
      camera.updateProjectionMatrix();
    }
    size();
    if ("ResizeObserver" in window) new ResizeObserver(size).observe(canvas);
    else window.addEventListener("resize", size);

    let raf;
    function animate() {
      current.x += (target.x - current.x) * 0.06;
      current.y += (target.y - current.y) * 0.06;

      if (!reduced) {
        gem.rotation.y += 0.0032;
        gem.rotation.x += 0.0012;
      }
      gem.rotation.z = current.x * 0.18;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    }
    animate();

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else animate();
    });
  } catch (err) {
    console.warn("Orion hero scene unavailable:", err);
  }
})();
