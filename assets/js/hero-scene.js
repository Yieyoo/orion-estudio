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

    const geometry = new THREE.IcosahedronGeometry(1, 2);
    const material = new THREE.MeshPhysicalMaterial({
      color: 0x7c4dff,
      metalness: 0.45,
      roughness: 0.22,
      clearcoat: 0.85,
      clearcoatRoughness: 0.18,
      flatShading: true,
      reflectivity: 0.6
    });
    const gem = new THREE.Mesh(geometry, material);
    scene.add(gem);

    const key = new THREE.DirectionalLight(0xffffff, 1.3);
    key.position.set(2.2, 2.6, 2.4);
    scene.add(key);

    const rim = new THREE.PointLight(0xb79bff, 1.7, 14);
    rim.position.set(-2.6, -1.4, 1.8);
    scene.add(rim);

    const fillLight = new THREE.PointLight(0xffffff, 0.7, 12);
    fillLight.position.set(0, 2.2, -2.4);
    scene.add(fillLight);

    const ambient = new THREE.AmbientLight(0x3a2d5e, 0.55);
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
