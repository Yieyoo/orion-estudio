(() => {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas || !window.THREE) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isSmall = window.innerWidth < 700;

  try {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
    renderer.setClearColor(0x080d18, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0, 10);

    // En celular el planeta se ve grande, a la derecha y detrás del texto, como en escritorio
    let mobileY = 0;
    const world = new THREE.Group();
    world.rotation.z = -0.24;
    scene.add(world);

    // Ruido simplex 3D (Ashima Arts / Stefan Gustavson, licencia MIT)
    const noise = `
      vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
      vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
      vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
      vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
      float snoise(vec3 v){
        const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
        vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
        vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
        vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
        i=mod289(i);
        vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
        float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;
        vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
        vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);
        vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
        vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));
        vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
        vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
        vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
        p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
        vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
        return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
      }
      float fbm(vec3 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*snoise(p);p*=2.03;a*=.5;}return s;}`;

    // Densidad del anillo según el radio (0 = borde interior, 1 = exterior), con la división de Cassini
    const ringDensity = `
      float ringDensity(float r){
        float d = .55 + .28 * snoise(vec3(r * 26., 1.7, 0.)) + .16 * snoise(vec3(r * 85., 3.1, 0.)) + .07 * sin(r * 431. + 4.1);
        d *= smoothstep(0., .06, r) * (1. - smoothstep(.93, 1., r));
        d *= 1. - (smoothstep(.57, .59, r) - smoothstep(.63, .65, r)) * .94;
        d *= 1. - (smoothstep(.86, .865, r) - smoothstep(.875, .88, r)) * .7;
        return clamp(d, 0., 1.);
      }`;

    const RING_INNER = 1.28;
    const RING_OUTER = 2.38;
    const lightDir = new THREE.Vector3(-1, 0.42, 0.55).normalize();
    const shared = {
      uLight: { value: lightDir },
      uRingNormal: { value: new THREE.Vector3(0, 1, 0) },
      uCenter: { value: new THREE.Vector3() },
      uRingInner: { value: RING_INNER },
      uRingOuter: { value: RING_OUTER },
      uPlanetRadius: { value: 1 }
    };

    /* ------------------------------------------------------------ Planeta */
    const planetMaterial = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, ...shared },
      vertexShader: `
        varying vec3 vPos;
        varying vec3 vNormalW;
        varying vec3 vViewDir;
        varying vec3 vWorld;
        void main() {
          vPos = position;
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorld = worldPos.xyz;
          vNormalW = normalize(mat3(modelMatrix) * normal);
          vViewDir = normalize(cameraPosition - worldPos.xyz);
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }`,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uLight;
        uniform vec3 uRingNormal;
        uniform vec3 uCenter;
        uniform float uRingInner;
        uniform float uRingOuter;
        varying vec3 vPos;
        varying vec3 vNormalW;
        varying vec3 vViewDir;
        varying vec3 vWorld;
        ${noise}
        ${ringDensity}
        void main() {
          vec3 p = normalize(vPos);
          float t = uTime * .012;
          // Bandas por latitud, deformadas por turbulencia como en un gigante gaseoso
          float lat = p.y + .03 * fbm(p * 3.2 + vec3(t, 0., 0.)) + .008 * fbm(p * 14. - t);
          float b1 = sin(lat * 18. + sin(lat * 5.) * 1.6);
          float b2 = sin(lat * 47. + 1.7);
          float streak = fbm(vec3(p.x * 2.5 + t * 3., lat * 70., p.z * 2.5));
          vec3 navy = vec3(.03, .055, .14);
          vec3 steel = vec3(.16, .26, .5);
          vec3 ice = vec3(.58, .66, .82);
          vec3 dusk = vec3(.29, .24, .48);
          vec3 color = mix(navy, steel, .52 + .3 * b1);
          color = mix(color, ice, smoothstep(.5, 1., b2 * .5 + .5) * .16 + smoothstep(.3, .9, streak) * .1);
          color *= 1. + sin(lat * 140.) * .035;
          color = mix(color, dusk, smoothstep(.3, .9, sin(lat * 9. + 2.) * .5 + .5) * .18);
          color *= .72 + .28 * (1. - abs(p.y));
          float storm = smoothstep(.16, .0, length(vec2(atan(p.z, p.x) * .5 - .9 - t * 2., (lat + .32) * 2.6)));
          color = mix(color, vec3(.74, .79, .94), storm * .5);

          vec3 n = normalize(vNormalW);
          float ndl = dot(n, uLight);
          float ndv = max(dot(n, vViewDir), 0.);
          float day = smoothstep(-.1, .55, ndl);
          vec3 lit = color * day * (.35 + .65 * pow(ndv, .35)) * 1.3;
          lit += vec3(.45, .32, .55) * smoothstep(-.12, .06, ndl) * smoothstep(.28, .0, ndl) * .05;

          // Sombra del anillo sobre el planeta
          float denom = dot(uLight, uRingNormal);
          if (abs(denom) > .001) {
            float travel = dot(uCenter - vWorld, uRingNormal) / denom;
            if (travel > 0.) {
              float r = (length(vWorld + uLight * travel - uCenter) - uRingInner) / (uRingOuter - uRingInner);
              if (r > 0. && r < 1.) lit *= 1. - ringDensity(r) * .72;
            }
          }

          // Atmósfera delgada, solo en el borde iluminado
          lit += vec3(.32, .48, 1.) * pow(1. - ndv, 4.) * smoothstep(-.2, .6, ndl) * .85;
          lit += color * .01;
          gl_FragColor = vec4(lit, 1.);
        }`
    });
    const planet = new THREE.Mesh(new THREE.SphereGeometry(1, isSmall ? 112 : 180, isSmall ? 112 : 180), planetMaterial);
    world.add(planet);

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.045, 64, 64),
      new THREE.ShaderMaterial({
        uniforms: { uLight: shared.uLight },
        vertexShader: `
          varying vec3 vNormalV;
          varying vec3 vNormalW;
          void main() {
            vNormalV = normalize(normalMatrix * normal);
            vNormalW = normalize(mat3(modelMatrix) * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: `
          uniform vec3 uLight;
          varying vec3 vNormalV;
          varying vec3 vNormalW;
          void main() {
            float rim = pow(max(.78 - dot(vNormalV, vec3(0., 0., 1.)), 0.), 4.);
            float lit = smoothstep(-.35, .7, dot(vNormalW, uLight));
            gl_FragColor = vec4(vec3(.28, .46, 1.) * rim * lit * 1.5, 1.);
          }`,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false
      })
    );
    world.add(atmosphere);

    /* ------------------------------------------------------------ Anillo continuo con sombra del planeta */
    const ringMaterial = new THREE.ShaderMaterial({
      uniforms: { ...shared },
      vertexShader: `
        varying float vR;
        varying vec3 vWorld;
        void main() {
          vR = length(position.xy);
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorld = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }`,
      fragmentShader: `
        uniform vec3 uLight;
        uniform vec3 uRingNormal;
        uniform vec3 uCenter;
        uniform float uRingInner;
        uniform float uRingOuter;
        uniform float uPlanetRadius;
        varying float vR;
        varying vec3 vWorld;
        ${noise}
        ${ringDensity}
        void main() {
          float r = (vR - ${RING_INNER.toFixed(3)}) / ${(RING_OUTER - RING_INNER).toFixed(3)};
          float grain = fract(sin(floor(vR * 900.) * 12.9898) * 43758.5453);
          float d = ringDensity(r) * (.8 + .2 * grain);
          vec3 color = mix(vec3(.7, .72, .8), vec3(.93, .93, .96), snoise(vec3(r * 14., 7., 0.)) * .5 + .5);
          color = mix(color, vec3(.5, .58, .9), (1. - r) * .28) * mix(.9, 1.08, grain);
          // Sombra del planeta sobre el anillo
          vec3 oc = vWorld - uCenter;
          float b = dot(oc, uLight);
          float h = b * b - (dot(oc, oc) - uPlanetRadius * uPlanetRadius);
          float shadow = smoothstep(0., .04, h) * step(b, 0.);
          float light = .55 + .9 * abs(dot(uRingNormal, uLight));
          gl_FragColor = vec4(color * light * (1. - shadow * .88), d * .88);
        }`,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(RING_INNER, RING_OUTER, 256, 1), ringMaterial);
    ring.rotation.set(-Math.PI / 2 + 0.36, 0, 0);
    world.add(ring);

    /* ------------------------------------------------------------ Luna lejana */
    const moonPivot = new THREE.Group();
    moonPivot.rotation.set(0.32, 0, 0.18);
    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(0.075, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0xaab3c6, roughness: 1, metalness: 0 })
    );
    moonPivot.add(moon);
    world.add(moonPivot);

    const sun = new THREE.DirectionalLight(0xffffff, 2.4);
    sun.position.copy(lightDir).multiplyScalar(10);
    scene.add(sun, new THREE.AmbientLight(0x6f7fa8, 0.08));

    /* ------------------------------------------------------------ Nebulosa y Vía Láctea de fondo */
    const nebulaMaterial = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform float uTime;
        varying vec2 vUv;
        ${noise}
        void main() {
          vec3 p = vec3(vUv * vec2(3.2, 1.9), uTime * .006);
          float n = fbm(p + fbm(p * 1.6 + 4.) * .9);
          float band = exp(-pow((vUv.y - (vUv.x * .62 + .12)) * 3.4, 2.));
          vec3 color = mix(vec3(.04, .06, .2), vec3(.24, .1, .4), smoothstep(-.2, .6, n));
          color = mix(color, vec3(.06, .28, .46), smoothstep(.2, .85, fbm(p * 2.2 + 9.)) * .5);
          float dust = smoothstep(.1, .7, fbm(p * 5. + 2.)) * band;
          float alpha = smoothstep(-.15, .8, n) * (.22 + .78 * band) * .72 - dust * .3;
          gl_FragColor = vec4(color * max(alpha, 0.) + vec3(.55, .6, .8) * band * .035, 1.);
        }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const nebula = new THREE.Mesh(new THREE.PlaneGeometry(46, 26), nebulaMaterial);
    nebula.position.z = -14;
    scene.add(nebula);

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
      nova.userData.size = random(0.35, 0.7);
      nova.userData.life = 0;
      nova.userData.duration = random(1.5, 2.3);
      nova.visible = true;
    }

    let nextShootingStar = random(1.2, 3);
    let nextNova = random(4, 8);
    function updateSpace(delta) {
      nextShootingStar -= delta;
      nextNova -= delta;
      if (nextShootingStar <= 0) { launchShootingStar(); nextShootingStar = random(2.5, 6); }
      if (nextNova <= 0) { launchNova(); nextNova = random(5, 11); }

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
        data.ring.material.opacity = Math.pow(1 - t, 1.6) * 0.45;
      });
    }

    const pointer = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    window.addEventListener("pointermove", event => {
      target.x = (event.clientX / window.innerWidth - 0.5) * 2;
      target.y = (event.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    function resize() {
      const bounds = canvas.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      renderer.setSize(bounds.width, bounds.height, false);
      camera.aspect = bounds.width / bounds.height;
      const mobile = bounds.width < 700;
      camera.position.z = mobile ? 13.2 : 10.3;
      // Convierte píxeles de pantalla a unidades de la escena para colocar el planeta en celular
      const unitsPerPx = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z / bounds.height;
      const orbRadiusPx = bounds.width * 0.9;
      mobileY = bounds.height * 0.05 * unitsPerPx;
      world.scale.setScalar(mobile ? orbRadiusPx * unitsPerPx / RING_OUTER : 1.22);
      world.position.x = mobile ? bounds.width * 0.42 * unitsPerPx : 2.2;
      world.position.y = mobile ? mobileY : 0;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    }

    const ringNormal = new THREE.Vector3();
    function syncShadows() {
      // El anillo y el planeta se proyectan sombra entre sí, así que comparten posición y orientación reales
      world.updateMatrixWorld(true);
      world.getWorldPosition(shared.uCenter.value);
      ringNormal.set(0, 0, 1).transformDirection(ring.matrixWorld);
      shared.uRingNormal.value.copy(ringNormal);
      const scale = world.scale.x;
      shared.uRingInner.value = RING_INNER * scale;
      shared.uRingOuter.value = RING_OUTER * scale;
      shared.uPlanetRadius.value = scale;
    }

    let raf = 0;
    let elapsed = 0;
    const clock = new THREE.Clock();
    function animate() {
      const delta = Math.min(clock.getDelta(), 0.05);
      // Solo se dibuja mientras la portada está a la vista
      const heroHeight = canvas.clientHeight || window.innerHeight;
      const scroll = Math.min(window.scrollY / heroHeight, 1.2);
      if (scroll < 1.05) {
        elapsed += reducedMotion ? 0 : delta;
        starMaterial.uniforms.uTime.value = elapsed;
        planetMaterial.uniforms.uTime.value = elapsed;
        nebulaMaterial.uniforms.uTime.value = elapsed;
        if (!reducedMotion) updateSpace(delta);
        pointer.x += (target.x - pointer.x) * 0.035;
        pointer.y += (target.y - pointer.y) * 0.035;
        planet.rotation.y = elapsed * 0.035;
        const moonAngle = -0.7 + elapsed * 0.025;
        moon.position.set(Math.cos(moonAngle) * 3.4, 0, Math.sin(moonAngle) * 3.4);
        // Al bajar, el planeta gira, se eleva y se aleja un poco
        world.rotation.x = 0.06 + pointer.y * 0.05 + scroll * 0.3;
        world.rotation.y = pointer.x * 0.08 + scroll * 0.45;
        world.position.y = (window.innerWidth < 700 ? mobileY : 0) + Math.sin(elapsed * 0.3) * 0.03 + scroll * 1.5;
        camera.position.x = pointer.x * 0.15;
        camera.position.y = -pointer.y * 0.1;
        camera.lookAt(0, 0, 0);
        stars.rotation.y = elapsed * 0.008;
        stars.rotation.z = elapsed * 0.003;
        stars.position.y = scroll * 0.8;
        nebula.position.y = scroll * 0.5;
        syncShadows();
        renderer.render(scene, camera);
      }
      if (!reducedMotion) raf = requestAnimationFrame(animate);
    }

    resize();
    if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas);
    else window.addEventListener("resize", resize);
    if (reducedMotion) window.addEventListener("scroll", () => { clock.getDelta(); animate(); }, { passive: true });
    animate();

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else if (!reducedMotion) { clock.getDelta(); animate(); }
    });
  } catch (error) {
    console.warn("Orion 3D cover could not start:", error);
  }
})();
