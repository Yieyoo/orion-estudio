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
    let cameraRestZ = camera.position.z;

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
      uniforms: { uTime: { value: 0 }, uFeed: { value: 0 }, uFeedSpread: { value: 0 }, uFeedDir: { value: new THREE.Vector3(0, 0, 1) }, ...shared },
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
        uniform float uFeed;
        uniform float uFeedSpread;
        uniform vec3 uFeedDir;
        varying vec3 vPos;
        varying vec3 vNormalW;
        varying vec3 vViewDir;
        varying vec3 vWorld;
        ${noise}
        ${ringDensity}
        void main() {
          vec3 p = normalize(vPos);
          // El clima del planeta se desplaza a una velocidad perceptible, como una toma espacial viva.
          float t = uTime * .045;
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

          // Luz que la luna le comparte: entra por un punto y se esparce por la superficie siguiendo las nubes
          if (uFeed > .001) {
            float reach = acos(clamp(dot(p, uFeedDir), -1., 1.));
            float inside = smoothstep(uFeedSpread, uFeedSpread - .5, reach);
            float front = exp(-pow((reach - uFeedSpread) * 5., 2.));
            float veins = smoothstep(.42, .9, fbm(vec3(p.x * 6. + t * 6., lat * 38., p.z * 6.)));
            vec3 energy = mix(vec3(1., .8, .5), vec3(.5, .8, 1.), smoothstep(.0, 1.4, reach));
            lit += energy * uFeed * (inside * (.14 + veins * 1.3) + front * (.35 + veins * 1.8)) * (.45 + .55 * day);
          }
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

    /* ------------------------------------------------------------ Explosión al tocar el planeta */
    // El planeta se rompe en partículas y fragmentos, el anillo se dispersa y luego todo se vuelve a armar en espiral
    const BURST = isSmall ? 5000 : 10000;
    const burstStart = new Float32Array(BURST * 3);
    const burstVel = new Float32Array(BURST * 3);
    const burstColor = new Float32Array(BURST * 3);
    const burstSize = new Float32Array(BURST);
    const burstSeed = new Float32Array(BURST);
    const planetTones = [[0.16, 0.26, 0.5], [0.58, 0.66, 0.82], [0.06, 0.1, 0.26], [0.29, 0.24, 0.48], [0.75, 0.8, 0.95]];
    const tmp = new THREE.Vector3();
    const dir = new THREE.Vector3();
    ring.updateMatrix();
    for (let i = 0; i < BURST; i++) {
      const fromRing = i < BURST * 0.38;
      if (fromRing) {
        const r = RING_INNER + Math.random() * (RING_OUTER - RING_INNER);
        const a = Math.random() * Math.PI * 2;
        tmp.set(Math.cos(a) * r, Math.sin(a) * r, (Math.random() - 0.5) * 0.03).applyMatrix4(ring.matrix);
        dir.copy(tmp).normalize().multiplyScalar(0.7 + Math.random() * 1.8);
        dir.y += (Math.random() - 0.5) * 0.6;
        burstColor.set([0.78 + Math.random() * 0.15, 0.8 + Math.random() * 0.12, 0.9 + Math.random() * 0.1], i * 3);
      } else {
        dir.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
        tmp.copy(dir).multiplyScalar(0.96 + Math.random() * 0.04);
        dir.multiplyScalar(1.1 + Math.pow(Math.random(), 2) * 3.6);
        const tone = planetTones[Math.floor(Math.random() * planetTones.length)];
        burstColor.set(tone, i * 3);
      }
      burstStart.set([tmp.x, tmp.y, tmp.z], i * 3);
      burstVel.set([dir.x, dir.y, dir.z], i * 3);
      burstSize[i] = 0.6 + Math.pow(Math.random(), 3) * 2.8;
      burstSeed[i] = Math.random();
    }
    const burstGeometry = new THREE.BufferGeometry();
    burstGeometry.setAttribute("position", new THREE.BufferAttribute(burstStart, 3));
    burstGeometry.setAttribute("aVel", new THREE.BufferAttribute(burstVel, 3));
    burstGeometry.setAttribute("aColor", new THREE.BufferAttribute(burstColor, 3));
    burstGeometry.setAttribute("aSize", new THREE.BufferAttribute(burstSize, 1));
    burstGeometry.setAttribute("aSeed", new THREE.BufferAttribute(burstSeed, 1));
    const burstMaterial = new THREE.ShaderMaterial({
      uniforms: { uSpread: { value: 0 }, uHeat: { value: 0 }, uTime: { value: 0 }, uPixelRatio: { value: renderer.getPixelRatio() } },
      vertexShader: `
        attribute vec3 aVel;
        attribute vec3 aColor;
        attribute float aSize;
        attribute float aSeed;
        uniform float uSpread;
        uniform float uHeat;
        uniform float uTime;
        uniform float uPixelRatio;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec3 p = position + aVel * uSpread;
          // Al volver, cada partícula gira un poco: el planeta se rearma en espiral
          float angle = uSpread * (aSeed - .5) * 1.6;
          p.xz = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * p.xz;
          vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = aSize * uPixelRatio * (20. / -mvPosition.z) * (1. + uHeat * 1.6);
          gl_Position = projectionMatrix * mvPosition;
          vec3 hot = mix(vec3(1., .9, .72), vec3(1., .46, .14), aSeed);
          vColor = mix(aColor * 1.35, hot * 1.4, uHeat * step(.25, aSeed)) + uHeat * .3;
          vAlpha = .6 + .4 * sin(uTime * 7. + aSeed * 40.) * uHeat + .3;
        }`,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          float glow = smoothstep(.5, .0, length(gl_PointCoord - .5));
          gl_FragColor = vec4(vColor, glow * glow * vAlpha);
        }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const burst = new THREE.Points(burstGeometry, burstMaterial);
    burst.frustumCulled = false;
    burst.visible = false;
    world.add(burst);

    // Fragmentos sólidos que giran mientras salen disparados
    const shardMaterial = new THREE.MeshStandardMaterial({ color: 0x24365f, roughness: 0.9, metalness: 0, flatShading: true, emissive: 0xff7a33, emissiveIntensity: 0 });
    // Cada fragmento es una roca irregular distinta: los vértices se empujan al azar (igual en las caras que los comparten)
    const rock = size => {
      const geometry = new THREE.IcosahedronGeometry(size, 1);
      const position = geometry.attributes.position;
      const bumps = new Map();
      for (let i = 0; i < position.count; i++) {
        const key = [position.getX(i), position.getY(i), position.getZ(i)].map(v => v.toFixed(4)).join();
        if (!bumps.has(key)) bumps.set(key, 0.62 + Math.random() * 0.6);
        const k = bumps.get(key);
        position.setXYZ(i, position.getX(i) * k, position.getY(i) * k, position.getZ(i) * k);
      }
      geometry.computeVertexNormals();
      return geometry;
    };
    const shards = Array.from({ length: isSmall ? 26 : 44 }, () => {
      const shard = new THREE.Mesh(rock(0.015 + Math.pow(Math.random(), 1.6) * 0.045), shardMaterial);
      // Un poco alargados y aplastados, como astillas de roca
      shard.scale.set(1 + Math.random() * 0.7, 0.55 + Math.random() * 0.4, 0.7 + Math.random() * 0.4);
      shard.userData.base = shard.scale.clone();
      const from = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
      shard.userData = { ...shard.userData, from: from.clone().multiplyScalar(0.9), vel: from.multiplyScalar(1.4 + Math.random() * 3), spin: new THREE.Vector3(Math.random() * 6, Math.random() * 6, Math.random() * 6) };
      shard.visible = false;
      world.add(shard);
      return shard;
    });

    const boomFlash = new THREE.Sprite(new THREE.SpriteMaterial({ map: flashTexture, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    const boomWave = new THREE.Sprite(new THREE.SpriteMaterial({ map: ringTexture, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    boomWave.material.color.setHex(0xbcd0ff);
    boomFlash.material.color.setHex(0xffd6ad);
    world.add(boomFlash, boomWave);

    /* ------------------------------------------------------------ Núcleo neuronal dentro del planeta */
    // Al estallar se descubre que el orbe era el caparazón de un cerebro digital: una sola red tipo telaraña,
    // cada punto unido a sus vecinos, con membranas translúcidas entre ellos, que palpita como un corazón
    const brain = new THREE.Group();
    brain.rotation.z = 0.24;
    brain.visible = false;
    world.add(brain);
    const folds = (x, y, z) => Math.sin(13 * x + 2.2 * Math.sin(9 * y)) * Math.sin(11 * y + 1.8 * Math.sin(8 * z)) * Math.sin(12 * z + 1.6 * Math.sin(10 * x));
    // Un punto sobre la forma del cerebro (dos hemisferios con pliegues y el cerebelo atrás), sin detalles anatómicos de más
    const brainPoint = () => {
      const u = Math.random() * Math.PI * 2;
      const v = Math.acos(Math.random() * 2 - 1);
      const dir = new THREE.Vector3(Math.sin(v) * Math.cos(u), Math.cos(v), Math.sin(v) * Math.sin(u));
      const depth = Math.random() < 0.88 ? 1 : 0.3 + Math.random() * 0.6;
      if (Math.random() < 0.88) {
        const side = dir.z >= 0 ? 1 : -1;
        const p = new THREE.Vector3(dir.x * (dir.x > 0 ? 0.74 : 0.68), dir.y * (dir.y > 0 ? 0.52 : 0.32), Math.abs(dir.z) * 0.36 * side);
        if (dir.y < 0) p.y -= 0.14 * Math.exp(-Math.pow(dir.x - 0.2, 2) / 0.09) * -dir.y;
        p.z += side * 0.03;
        p.multiplyScalar((1 + folds(p.x, p.y, p.z) * 0.08) * depth);
        p.y += 0.06;
        return p;
      }
      const p = new THREE.Vector3(dir.x * 0.26, dir.y * 0.16, dir.z * 0.32).multiplyScalar(depth);
      return p.add(new THREE.Vector3(-0.46, -0.26, 0));
    };
    const NODES = isSmall ? 1500 : 2800;
    const nodes = Array.from({ length: NODES }, () => brainPoint().multiplyScalar(1.1));
    // Vecinos cercanos con una cuadrícula, para unir cada punto con los suyos sin revisar todos contra todos
    const LINK = 0.12;
    const grid = new Map();
    const cellOf = p => [Math.floor(p.x / LINK), Math.floor(p.y / LINK), Math.floor(p.z / LINK)];
    nodes.forEach((p, i) => {
      const key = cellOf(p).join();
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key).push(i);
    });
    const nearest = i => {
      const [cx, cy, cz] = cellOf(nodes[i]);
      const found = [];
      for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
        (grid.get([cx + x, cy + y, cz + z].join()) || []).forEach(j => {
          if (j === i) return;
          const d = nodes[i].distanceTo(nodes[j]);
          if (d < LINK) found.push([d, j]);
        });
      }
      return found.sort((p, q) => p[0] - q[0]).slice(0, 4).map(([, j]) => j);
    };
    const edges = new Set();
    const tris = [];
    const neighbors = nodes.map((_, i) => nearest(i));
    neighbors.forEach((list, i) => {
      list.forEach(j => edges.add(i < j ? i + "-" + j : j + "-" + i));
      // Membrana: si dos vecinos también se tocan entre sí, se forma un triángulo
      if (list.length >= 2 && neighbors[list[0]].includes(list[1]) && Math.random() < 0.7) tris.push(i, list[0], list[1]);
    });
    const brainUniforms = { uTime: { value: 0 }, uReveal: { value: 0 }, uBeat: { value: 0 }, uWave: { value: 0 }, uPixelRatio: { value: renderer.getPixelRatio() } };
    // El latido: la red se infla un poco y respira con ondas que la deforman
    const breathe = `
      vec3 breathe(vec3 p) {
        float wobble = sin(uTime * 1.7 + p.y * 6.) * .012 + sin(uTime * 1.2 + p.x * 5.) * .01;
        return p * (1. + uBeat * .06 + wobble);
      }`;
    // Cada punto se enciende en su momento: la red se va tejiendo de un lado al otro
    const seedOf = p => 0.5 + 0.35 * p.x + 0.15 * Math.sin(p.y * 9 + p.z * 7);
    const glowCommon = `
      uniform float uTime;
      uniform float uReveal;
      uniform float uBeat;
      uniform float uWave;
      vec3 webColor(vec3 p, float seed) {
        // Mayormente cian, con zonas ámbar como en un holograma de dos temperaturas
        float warm = smoothstep(.68, .95, sin(p.x * 3.2 + p.z * 2.4 + 1.3) * .5 + .5) * .85;
        return mix(mix(vec3(.25, .62, 1.), vec3(.7, .95, 1.), seed), vec3(1., .62, .28), warm);
      }
      float waveAt(vec3 p) { return exp(-pow((length(p) - uWave) * 8., 2.)) * uBeat; }
      float on(float seed) { return smoothstep(seed - .15, seed + .05, uReveal * 1.25); }`;

    // Conexiones (la telaraña)
    const edgePos = [];
    const edgeT = [];
    const edgeSeed = [];
    edges.forEach(key => {
      const [i, j] = key.split("-").map(Number);
      const p = nodes[i];
      const q = nodes[j];
      const seed = seedOf(p);
      edgePos.push(p.x, p.y, p.z, q.x, q.y, q.z);
      edgeT.push(0, 1);
      edgeSeed.push(seed, seed);
    });
    const edgeGeometry = new THREE.BufferGeometry();
    edgeGeometry.setAttribute("position", new THREE.Float32BufferAttribute(edgePos, 3));
    edgeGeometry.setAttribute("aT", new THREE.Float32BufferAttribute(edgeT, 1));
    edgeGeometry.setAttribute("aSeed", new THREE.Float32BufferAttribute(edgeSeed, 1));
    brain.add(new THREE.LineSegments(edgeGeometry, new THREE.ShaderMaterial({
      uniforms: brainUniforms,
      vertexShader: `
        attribute float aT;
        attribute float aSeed;
        uniform float uTime;
        uniform float uBeat;
        varying float vT;
        varying float vSeed;
        varying vec3 vPos;
        ${breathe}
        void main() {
          vT = aT;
          vSeed = aSeed;
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(breathe(position), 1.0);
        }`,
      fragmentShader: `
        ${glowCommon}
        varying float vT;
        varying float vSeed;
        varying vec3 vPos;
        void main() {
          // Señales que corren por la red
          float head = fract(uTime * .9 + vSeed * 13.);
          float pulse = exp(-pow((vT - head) * 5., 2.)) * step(.72, fract(vSeed * 47.));
          float glow = .32 + pulse * 1.1 + waveAt(vPos) * 1.4 + uBeat * .25;
          gl_FragColor = vec4(webColor(vPos, vSeed) * (1. + pulse), glow * on(vSeed));
        }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })));

    // Membranas translúcidas entre las conexiones, como cristal
    const triPos = [];
    const triSeed = [];
    tris.forEach(i => {
      const p = nodes[i];
      triPos.push(p.x, p.y, p.z);
      triSeed.push(seedOf(p));
    });
    const triGeometry = new THREE.BufferGeometry();
    triGeometry.setAttribute("position", new THREE.Float32BufferAttribute(triPos, 3));
    triGeometry.setAttribute("aSeed", new THREE.Float32BufferAttribute(triSeed, 1));
    brain.add(new THREE.Mesh(triGeometry, new THREE.ShaderMaterial({
      uniforms: brainUniforms,
      vertexShader: `
        attribute float aSeed;
        uniform float uTime;
        uniform float uBeat;
        varying float vSeed;
        varying vec3 vPos;
        ${breathe}
        void main() {
          vSeed = aSeed;
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(breathe(position), 1.0);
        }`,
      fragmentShader: `
        ${glowCommon}
        varying float vSeed;
        varying vec3 vPos;
        void main() {
          float shimmer = .5 + .5 * sin(uTime * 2. + vPos.y * 14. + vPos.x * 9.);
          float glow = .05 + shimmer * .04 + waveAt(vPos) * .25 + uBeat * .05;
          gl_FragColor = vec4(webColor(vPos, vSeed), glow * on(vSeed));
        }`,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    })));

    // Los puntos donde se unen las conexiones
    const nodePos = new Float32Array(NODES * 3);
    const nodeSeed = new Float32Array(NODES);
    const nodeRand = new Float32Array(NODES);
    nodes.forEach((p, i) => {
      nodePos.set([p.x, p.y, p.z], i * 3);
      nodeSeed[i] = seedOf(p);
      nodeRand[i] = Math.random();
    });
    const nodeGeometry = new THREE.BufferGeometry();
    nodeGeometry.setAttribute("position", new THREE.BufferAttribute(nodePos, 3));
    nodeGeometry.setAttribute("aSeed", new THREE.BufferAttribute(nodeSeed, 1));
    nodeGeometry.setAttribute("aRand", new THREE.BufferAttribute(nodeRand, 1));
    brain.add(new THREE.Points(nodeGeometry, new THREE.ShaderMaterial({
      uniforms: brainUniforms,
      vertexShader: `
        attribute float aSeed;
        attribute float aRand;
        uniform float uPixelRatio;
        varying vec3 vColor;
        varying float vAlpha;
        ${glowCommon}
        ${breathe}
        void main() {
          vec4 mv = modelViewMatrix * vec4(breathe(position), 1.0);
          float fire = step(.97, fract(aRand * 23. + uTime * .5));
          float twinkle = .6 + .4 * sin(uTime * (2. + aRand * 4.) + aRand * 40.);
          gl_PointSize = (1.3 + aRand * 1.6 + fire * 2.5 + uBeat) * uPixelRatio * (16. / -mv.z);
          gl_Position = projectionMatrix * mv;
          vColor = mix(webColor(position, aRand), vec3(1.), .35 + fire * .5);
          vAlpha = on(aSeed) * (twinkle + fire + waveAt(position) * 1.5);
        }`,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          float glow = smoothstep(.5, .0, length(gl_PointCoord - .5));
          gl_FragColor = vec4(vColor, glow * glow * vAlpha);
        }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })));

    // Corazón de luz que late en el centro
    const brainGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: flashTexture, color: 0x6fc3ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    brainGlow.scale.setScalar(2.2);
    brain.add(brainGlow);
    // Dos golpes rápidos y una pausa, como un latido
    const heartbeat = time => {
      const ph = time % 1.3;
      return Math.exp(-Math.pow(ph / 0.07, 2)) + 0.65 * Math.exp(-Math.pow((ph - 0.24) / 0.07, 2));
    };

    /* ------------------------------------------------------------ La luna alimenta al planeta */
    // La luna (quien crea) le comparte su luz al planeta (su proyecto): se tiende un hilo suave entre los dos,
    // por él viajan esferas de luz y el planeta las absorbe con un resplandor cálido; si está abierto, alimentan al cerebro
    const energyTexture = makeGlowTexture([[0, "rgba(255,255,255,1)"], [0.18, "rgba(190,225,255,.85)"], [0.45, "rgba(100,160,255,.3)"], [1, "rgba(60,100,255,0)"]]);
    const moonGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: energyTexture, color: 0xcfe4ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false }));
    moon.add(moonGlow);

    // El hilo: muchos puntos muy juntos sobre una curva suave, con un núcleo de línea fina
    const THREAD = 220;
    const threadPos = new Float32Array(THREAD * 3);
    const threadT = new Float32Array(THREAD);
    for (let i = 0; i < THREAD; i++) threadT[i] = i / (THREAD - 1);
    const threadUniforms = { uDraw: { value: 0 }, uFade: { value: 0 }, uPulses: { value: new THREE.Vector3(-1, -1, -1) }, uTime: { value: 0 }, uPixelRatio: { value: renderer.getPixelRatio() } };
    const threadGeometry = new THREE.BufferGeometry();
    threadGeometry.setAttribute("position", new THREE.BufferAttribute(threadPos, 3));
    threadGeometry.setAttribute("aT", new THREE.BufferAttribute(threadT, 1));
    // Luz que fluye: base tenue, tres esferas que avanzan y un brillo que respira; dorado cerca de la luna, cian al llegar
    const threadLight = `
      uniform float uDraw;
      uniform float uFade;
      uniform vec3 uPulses;
      uniform float uTime;
      float pulseAt(float t) {
        // Pulsos con núcleo definido y halo amplio para que se lean como energía en movimiento.
        return exp(-pow((t - uPulses.x) * 30., 2.)) + exp(-pow((t - uPulses.y) * 30., 2.)) + exp(-pow((t - uPulses.z) * 30., 2.));
      }
      vec3 threadColor(float t) { return mix(vec3(1., .76, .38), vec3(.55, .84, 1.), t); }`;
    const threadGlow = new THREE.Points(threadGeometry, new THREE.ShaderMaterial({
      uniforms: threadUniforms,
      vertexShader: `
        attribute float aT;
        uniform float uPixelRatio;
        varying float vT;
        varying float vPulse;
        ${threadLight}
        void main() {
          vT = aT;
          vPulse = pulseAt(aT);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = (1.1 + vPulse * 8.5) * uPixelRatio * (18. / -mv.z);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        varying float vT;
        varying float vPulse;
        ${threadLight}
        void main() {
          if (vT > uDraw) discard;
          float glow = smoothstep(.5, .0, length(gl_PointCoord - .5));
          float breath = .13 + .05 * sin(uTime * 1.8 - vT * 7.);
          float tip = smoothstep(uDraw - .045, uDraw, vT) * step(uDraw, .999) * .8;
          vec3 color = mix(threadColor(vT), vec3(1.), min(vPulse, 1.) * .72);
          gl_FragColor = vec4(color, glow * glow * (breath + vPulse * .9 + tip) * uFade);
        }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    const threadCore = new THREE.Line(threadGeometry, new THREE.ShaderMaterial({
      uniforms: threadUniforms,
      vertexShader: `
        attribute float aT;
        varying float vT;
        void main() {
          vT = aT;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        varying float vT;
        ${threadLight}
        void main() {
          if (vT > uDraw) discard;
          gl_FragColor = vec4(threadColor(vT), (.35 + pulseAt(vT)) * uFade);
        }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    threadGlow.frustumCulled = threadCore.frustumCulled = false;
    threadGlow.visible = threadCore.visible = false;
    world.add(threadCore, threadGlow);


    const FEED_EVERY = 8;
    const GATHER = 1.2;
    const REACH = 0.9;
    const FLOW = 2.2;
    const RELEASE = 0.8;
    const moonAt = new THREE.Vector3();
    const feedTarget = new THREE.Vector3();
    const bend = new THREE.Vector3();
    const point = new THREE.Vector3();
    const feedLocal = new THREE.Vector3();
    const smooth = k => k * k * (3 - 2 * k);
    function updateFeed() {
      const since = elapsed - 1.2;
      const phase = since < 0 ? -1 : since % FEED_EVERY;
      const open = boomAt >= 0;
      // Dónde está la luna dentro del sistema del planeta y a qué punto llega la luz
      moon.getWorldPosition(moonAt);
      world.worldToLocal(moonAt);
      if (open) feedTarget.set(0, 0.06, 0);
      else feedTarget.copy(moonAt).add(new THREE.Vector3(0, 0, 2.2)).normalize().multiplyScalar(1.02);
      const hidden = moonAt.z < 0 && Math.hypot(moonAt.x, moonAt.y) < 1.15;
      // La luna junta luz con calma antes de compartirla
      const t = phase - GATHER;
      const gather = phase < 0 ? 0 : phase < GATHER ? smooth(phase / GATHER) : t < REACH + FLOW ? 1 : Math.max(0, 1 - (t - REACH - FLOW) / RELEASE);
      moonGlow.material.opacity = hidden ? 0 : 0.3 + gather * 0.55;
      moonGlow.scale.setScalar(0.6 + gather * 0.7 + Math.sin(elapsed * 2.4) * 0.04);
      // El hilo se tiende de la luna al planeta, la luz fluye por él y luego se disuelve
      const active = phase >= 0 && t >= 0 && t < REACH + FLOW + RELEASE && !hidden;
      threadGlow.visible = threadCore.visible = active;
      if (active) {
        // Curva con volumen y un leve movimiento para que el enlace no parezca un rayo rígido.
        bend.copy(moonAt).add(feedTarget).multiplyScalar(0.5)
          .add(new THREE.Vector3(0, 0.38 + Math.sin(elapsed * 1.1) * 0.045, 0.34));
        for (let i = 0; i < THREAD; i++) {
          const k = threadT[i];
          point.copy(moonAt).multiplyScalar((1 - k) * (1 - k)).addScaledVector(bend, 2 * (1 - k) * k).addScaledVector(feedTarget, k * k);
          threadPos.set([point.x, point.y, point.z], i * 3);
        }
        threadGeometry.attributes.position.needsUpdate = true;
        const flowT = t - REACH;
        const pulse = offset => {
          const k = (flowT - offset) / 1.35;
          return k >= 0 && k <= 1 ? smooth(k) : -1;
        };
        threadUniforms.uDraw.value = smooth(Math.min(t / REACH, 1));
        threadUniforms.uFade.value = t < REACH + FLOW ? 1 : 1 - (t - REACH - FLOW) / RELEASE;
        threadUniforms.uPulses.value.set(pulse(0), pulse(0.52), pulse(1.04));
        threadUniforms.uTime.value = elapsed;
      }
      // La energía entra por donde llega el hilo y se esparce por la superficie del planeta, siguiendo sus nubes
      // Empieza a esparcirse con la primera esfera y alcanza su máximo cuando llega la última
      const arrived = t - REACH - 1.35;
      const absorb = phase >= 0 && arrived >= 0 && arrived < 3.6 ? Math.sin(Math.min(arrived / 3.6, 1) * Math.PI) : 0;
      feedLocal.copy(feedTarget);
      planet.worldToLocal(world.localToWorld(feedLocal)).normalize();
      planetMaterial.uniforms.uFeedDir.value.copy(feedLocal);
      planetMaterial.uniforms.uFeed.value = open ? 0 : absorb;
      planetMaterial.uniforms.uFeedSpread.value = 0.12 + Math.max(arrived, 0) * 0.5;
      if (open && brain.visible) brainUniforms.uBeat.value += absorb * 0.6;
    }

    let boomAt = -1;
    const easeInOut = k => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
    const shake = new THREE.Vector2();
    function explode() {
      if (boomAt >= 0 || reducedMotion) return;
      boomAt = elapsed;
      canvas.closest("section")?.classList.add("has-boomed");
    }
    function updateBoom() {
      shake.set(0, 0);
      if (boomAt < 0) return;
      const t = elapsed - boomAt;
      const BLAST = 0.12;
      const HOLD = 4.6;
      const BACK = 1.9;
      let spread;
      if (t < BLAST) {
        // Se carga: el planeta se infla un instante antes de estallar
        planet.scale.setScalar(1 + Math.sin((t / BLAST) * Math.PI) * 0.06);
        spread = 0;
      } else if (t < HOLD) {
        spread = (1 - Math.exp(-(t - BLAST) * 2.6)) * (1 + (t - BLAST) * 0.04);
      } else {
        const peak = (1 - Math.exp(-(HOLD - BLAST) * 2.6)) * (1 + (HOLD - BLAST) * 0.04);
        spread = peak * (1 - easeInOut(Math.min((t - HOLD) / BACK, 1)));
      }
      const exploded = t >= BLAST && t < HOLD + BACK;
      planet.visible = atmosphere.visible = ring.visible = !exploded;
      burst.visible = exploded;
      burstMaterial.uniforms.uSpread.value = spread;
      burstMaterial.uniforms.uHeat.value = t < BLAST ? 0 : Math.exp(-(t - BLAST) * 2.4);
      burstMaterial.uniforms.uTime.value = elapsed;
      // El cerebro se enciende poco después del estallido y se apaga mientras el planeta se rearma
      const reveal = t < HOLD ? Math.min(Math.max((t - BLAST - 0.25) / 1.4, 0), 1) : 1 - Math.min((t - HOLD) / (BACK * 0.7), 1);
      brain.visible = exploded && reveal > 0;
      const beat = heartbeat(Math.max(t - BLAST - 0.6, 0));
      brainUniforms.uReveal.value = reveal;
      brainUniforms.uTime.value = elapsed;
      brainUniforms.uBeat.value = beat * reveal;
      brainUniforms.uWave.value = (Math.max(t - BLAST - 0.6, 0) % 1.3) * 1.1;
      brain.rotation.y = -0.25 + (t - BLAST) * 0.24;
      brain.scale.setScalar(0.75 + reveal * 0.25);
      brainGlow.material.opacity = reveal * (0.22 + beat * 0.3);
      brainGlow.scale.setScalar(2.2 + beat * 0.5);
      shardMaterial.emissiveIntensity = t < BLAST ? 0 : Math.exp(-(t - BLAST) * 1.8) * 1.5;
      shards.forEach(shard => {
        shard.visible = exploded;
        const { from, vel, spin, base } = shard.userData;
        shard.position.copy(from).addScaledVector(vel, spread);
        // Se hacen más pequeños conforme se alejan, como si se perdieran en el espacio
        shard.scale.copy(base).multiplyScalar(1 / (1 + spread * 0.7));
        shard.rotation.set(spin.x * spread, spin.y * spread, spin.z * spread);
      });
      // Destello, onda expansiva y temblor de cámara
      const b = Math.max(t - BLAST, 0);
      boomFlash.material.opacity = t < BLAST ? 0 : Math.max(0, 1 - b / 0.6);
      boomFlash.scale.setScalar(1 + Math.min(b / 0.35, 1) * 7);
      boomWave.material.opacity = t < BLAST ? 0 : Math.max(0, 0.9 * (1 - b / 1.4));
      boomWave.scale.setScalar(1 + b * 11);
      if (t >= BLAST && t < BLAST + 0.9) shake.set((Math.random() - 0.5), (Math.random() - 0.5)).multiplyScalar(0.18 * Math.exp(-b * 4));
      // Al rearmarse, un destello suave y el planeta aparece con un pequeño rebote
      const back = t - (HOLD + BACK);
      if (back >= 0) {
        boomFlash.material.opacity = Math.max(0, 0.55 * (1 - back / 0.5));
        boomFlash.scale.setScalar(3.2);
        const pop = Math.min(back / 0.6, 1);
        planet.scale.setScalar(1 + Math.sin(pop * Math.PI) * 0.05);
        if (pop >= 1) {
          planet.scale.setScalar(1);
          boomFlash.material.opacity = 0;
          boomAt = -1;
        }
      }
    }

    // Tocar o hacer clic sobre el planeta lo hace explotar
    const heroSection = canvas.closest("section");
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const hitsPlanet = event => {
      const r = canvas.getBoundingClientRect();
      ndc.set(((event.clientX - r.left) / r.width) * 2 - 1, -((event.clientY - r.top) / r.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      return planet.visible && raycaster.intersectObject(planet).length > 0;
    };
    if (heroSection && !reducedMotion) {
      heroSection.addEventListener("click", event => {
        if (event.target.closest("a, button")) return;
        if (hitsPlanet(event)) explode();
      });
      heroSection.addEventListener("pointermove", event => {
        if (event.pointerType !== "mouse") return;
        heroSection.style.cursor = !event.target.closest("a, button") && hitsPlanet(event) ? "pointer" : "";
      }, { passive: true });
      document.addEventListener("orion:boom", explode);
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
      cameraRestZ = mobile ? 13.2 : 10.3;
      camera.position.z = cameraRestZ;
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
        // Giro planetario y órbita lunar más visibles, con un ritmo lento y continuo.
        planet.rotation.y = elapsed * 0.075;
        // La luna arranca abajo y al frente del planeta; en celular, con una órbita más cerrada para que se vea desde el inicio
        const phoneView = window.innerWidth < 700;
        const moonAngle = phoneView ? 1.75 + elapsed * 0.055 : 1.75 - elapsed * 0.055;
        const moonOrbit = phoneView ? 2.55 : 3.4;
        moon.position.set(Math.cos(moonAngle) * moonOrbit, 0, Math.sin(moonAngle) * moonOrbit);
        // Al bajar, el planeta gira, se eleva y se aleja un poco
        world.rotation.x = 0.06 + pointer.y * 0.05 + scroll * 0.3 + Math.sin(elapsed * 0.16) * 0.012;
        world.rotation.y = pointer.x * 0.08 + scroll * 0.45 + Math.sin(elapsed * 0.12) * 0.018;
        world.position.y = (window.innerWidth < 700 ? mobileY : 0) + Math.sin(elapsed * 0.3) * 0.03 + scroll * 1.5;
        updateBoom();
        if (!reducedMotion) updateFeed();
        camera.position.x = pointer.x * 0.15 + shake.x;
        camera.position.y = -pointer.y * 0.1 + shake.y;
        camera.position.z = cameraRestZ + Math.sin(elapsed * 0.18) * 0.1;
        camera.lookAt(shake.x * 0.5, shake.y * 0.5, 0);
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
