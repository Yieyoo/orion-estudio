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
    renderer.toneMappingExposure = 1.2;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0, 10);

    // En celular el orbe se ve grande, a la derecha y detrás del texto, como en escritorio
    let mobileY = 0;
    const world = new THREE.Group();
    world.position.set(2.25, 0, 0);
    world.rotation.z = -0.22;
    scene.add(world);

    /* ------------------------------------------------------------ Planeta */
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

    const lightDir = new THREE.Vector3(-1, 0.65, 0.85).normalize();
    const planetMaterial = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uLight: { value: lightDir } },
      vertexShader: `
        varying vec3 vPos;
        varying vec3 vNormalW;
        varying vec3 vViewDir;
        void main() {
          vPos = position;
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vNormalW = normalize(mat3(modelMatrix) * normal);
          vViewDir = normalize(cameraPosition - worldPos.xyz);
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }`,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uLight;
        varying vec3 vPos;
        varying vec3 vNormalW;
        varying vec3 vViewDir;
        ${noise}
        void main() {
          vec3 p = normalize(vPos);
          float t = uTime * .035;
          // Bandas de gas que se arremolinan
          float warp = fbm(p * 1.6 + vec3(t, 0., t * .5));
          float streak = fbm(vec3(p.x * 2.2, p.y * 14., p.z * 2.2) + vec3(t * 2., 0., 0.) + warp * .8);
          float bands = sin(p.y * 8. + warp * 2.6 + streak * 1.6);
          float detail = streak;
          vec3 deep = vec3(.025, .05, .19);
          vec3 royal = vec3(.2, .34, .96);
          vec3 ice = vec3(.68, .76, 1.);
          vec3 violet = vec3(.42, .28, .92);
          vec3 color = mix(deep, royal, smoothstep(-1., 1., bands));
          color = mix(color, ice, smoothstep(.15, .8, streak) * .45);
          color = mix(color, violet, smoothstep(.3, .9, warp) * .35);
          float storm = smoothstep(.24, .0, length(p - normalize(vec3(.6, -.28, .75))) + detail * .05);
          color = mix(color, ice * 1.15, storm * .7);
          // Día y noche con un borde de luz en la frontera
          float diffuse = dot(normalize(vNormalW), uLight);
          float day = smoothstep(-.28, 1., diffuse);
          vec3 lit = color * (.05 + 1.0 * day);
          lit += vec3(.3, .42, 1.) * smoothstep(-.05, .25, diffuse) * smoothstep(.55, .05, diffuse) * .22;
          // Atmósfera en el contorno
          float fresnel = pow(1. - max(dot(normalize(vNormalW), vViewDir), 0.), 2.6);
          lit += vec3(.3, .4, 1.) * fresnel * (.22 + .5 * day);
          gl_FragColor = vec4(lit, 1.);
        }`
    });
    const planet = new THREE.Mesh(new THREE.SphereGeometry(1, isSmall ? 96 : 160, isSmall ? 96 : 160), planetMaterial);
    planet.rotation.z = 0.12;
    world.add(planet);

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 64, 64),
      new THREE.ShaderMaterial({
        uniforms: { uLight: { value: lightDir } },
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
            float intensity = pow(max(.68 - dot(vNormalV, vec3(0., 0., 1.)), 0.), 3.2);
            float lit = .45 + .75 * smoothstep(-.6, .8, dot(vNormalW, uLight));
            gl_FragColor = vec4(vec3(.3, .46, 1.) * intensity * lit * 1.15, 1.);
          }`,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false
      })
    );
    world.add(atmosphere);

    // Resplandor detrás del planeta
    function makeGlow(stops, size = 256) {
      const glowCanvas = document.createElement("canvas");
      glowCanvas.width = glowCanvas.height = size;
      const context = glowCanvas.getContext("2d");
      const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      stops.forEach(([offset, color]) => gradient.addColorStop(offset, color));
      context.fillStyle = gradient;
      context.fillRect(0, 0, size, size);
      return new THREE.CanvasTexture(glowCanvas);
    }
    const backGlow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeGlow([[0, "rgba(90,120,255,.55)"], [0.35, "rgba(60,90,240,.18)"], [1, "rgba(40,60,200,0)"]]),
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
    }));
    backGlow.scale.setScalar(7.5);
    backGlow.position.z = -1.5;
    world.add(backGlow);

    /* ------------------------------------------------------------ Anillo de partículas */
    const ringCount = isSmall ? 7000 : 14000;
    const ringData = { radius: new Float32Array(ringCount), angle: new Float32Array(ringCount), height: new Float32Array(ringCount), size: new Float32Array(ringCount), tone: new Float32Array(ringCount) };
    for (let i = 0; i < ringCount; i++) {
      let r;
      // Bandas de distinta densidad y una división vacía, como los anillos de Saturno
      do { r = 1.5 + Math.pow(Math.random(), 1.2) * 1.3; } while ((r > 2.06 && r < 2.16) || Math.random() > 0.5 + 0.5 * Math.sin(r * 24));
      ringData.radius[i] = r;
      ringData.angle[i] = Math.random() * Math.PI * 2;
      ringData.height[i] = (Math.random() - 0.5) * 0.02 * (1 + (r - 1.5));
      ringData.size[i] = 0.5 + Math.pow(Math.random(), 4) * 2.4;
      ringData.tone[i] = Math.random();
    }
    const ringGeometry = new THREE.BufferGeometry();
    ringGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(ringCount * 3), 3));
    ringGeometry.setAttribute("aRadius", new THREE.BufferAttribute(ringData.radius, 1));
    ringGeometry.setAttribute("aAngle", new THREE.BufferAttribute(ringData.angle, 1));
    ringGeometry.setAttribute("aHeight", new THREE.BufferAttribute(ringData.height, 1));
    ringGeometry.setAttribute("aSize", new THREE.BufferAttribute(ringData.size, 1));
    ringGeometry.setAttribute("aTone", new THREE.BufferAttribute(ringData.tone, 1));
    const ringMaterial = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uPixelRatio: { value: renderer.getPixelRatio() } },
      vertexShader: `
        attribute float aRadius;
        attribute float aAngle;
        attribute float aHeight;
        attribute float aSize;
        attribute float aTone;
        uniform float uTime;
        uniform float uPixelRatio;
        varying float vTone;
        varying float vAlpha;
        void main() {
          // Las partículas internas giran más rápido, como un anillo real
          float a = aAngle + uTime * .22 / pow(aRadius, 1.5);
          vec3 pos = vec3(cos(a) * aRadius, aHeight, sin(a) * aRadius);
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = aSize * uPixelRatio * (20. / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
          vTone = aTone;
          vAlpha = (.55 + .45 * sin(uTime * 1.4 + aAngle * 9.)) * smoothstep(1.48, 1.62, aRadius) * (1. - smoothstep(2.6, 2.8, aRadius) * .7);
        }`,
      fragmentShader: `
        varying float vTone;
        varying float vAlpha;
        void main() {
          float glow = smoothstep(.5, .0, length(gl_PointCoord - .5));
          vec3 color = mix(vec3(.55, .66, 1.), vec3(.95, .97, 1.), vTone);
          color = mix(color, vec3(.62, .45, 1.), step(.86, vTone) * .8);
          gl_FragColor = vec4(color, glow * glow * vAlpha);
        }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const ring = new THREE.Points(ringGeometry, ringMaterial);
    ring.frustumCulled = false;
    ring.rotation.set(0.42, 0, 0.05);
    world.add(ring);

    // Dos órbitas finas que mantienen el sello de Orion
    const orbitLineA = new THREE.Mesh(new THREE.TorusGeometry(2.55, 0.006, 8, 240), new THREE.MeshBasicMaterial({ color: 0x819fff, transparent: true, opacity: 0.32 }));
    orbitLineA.rotation.set(0.54, -0.48, 0.7);
    world.add(orbitLineA);
    const orbitLineB = new THREE.Mesh(new THREE.TorusGeometry(2.82, 0.008, 8, 240), new THREE.MeshBasicMaterial({ color: 0x9db6ff, transparent: true, opacity: 0.42 }));
    orbitLineB.rotation.set(-0.62, 0.28, 0.42);
    world.add(orbitLineB);

    /* ------------------------------------------------------------ Lunas con estela */
    const TRAIL = 70;
    const moons = [
      { radius: 2.05, speed: 0.42, size: 0.085, tilt: [1.05, 0, -0.5], color: 0xe5edff, phase: 0.6 },
      { radius: 2.6, speed: -0.28, size: 0.06, tilt: [-0.75, 0.3, 0.6], color: 0xc7b8ff, phase: 2.8 }
    ].map(config => {
      const pivot = new THREE.Group();
      pivot.rotation.set(...config.tilt);
      const body = new THREE.Mesh(
        new THREE.SphereGeometry(config.size, 32, 32),
        new THREE.MeshStandardMaterial({ color: config.color, roughness: 0.35, metalness: 0.2, emissive: 0x4a64ff, emissiveIntensity: 0.4 })
      );
      const trailGeometry = new THREE.BufferGeometry();
      trailGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(TRAIL * 3), 3));
      const colors = new Float32Array(TRAIL * 3);
      for (let i = 0; i < TRAIL; i++) {
        const fade = Math.pow(1 - i / TRAIL, 2);
        colors.set([0.62 * fade, 0.72 * fade, 1 * fade], i * 3);
      }
      trailGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      const trail = new THREE.Line(trailGeometry, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
      trail.frustumCulled = false;
      pivot.add(body, trail);
      world.add(pivot);
      return { ...config, body, trail };
    });
    function updateMoons(time) {
      moons.forEach(moon => {
        const angle = moon.phase + time * moon.speed;
        moon.body.position.set(Math.cos(angle) * moon.radius, 0, Math.sin(angle) * moon.radius);
        const points = moon.trail.geometry.attributes.position;
        const step = 0.012 * Math.sign(moon.speed);
        for (let i = 0; i < TRAIL; i++) {
          const a = angle - i * step;
          points.setXYZ(i, Math.cos(a) * moon.radius, 0, Math.sin(a) * moon.radius);
        }
        points.needsUpdate = true;
      });
    }

    const lights = [
      [new THREE.AmbientLight(0x8797c3, 0.7), 0, 0, 0],
      [new THREE.PointLight(0xffffff, 2.4, 18), -2.4, 2.6, 4],
      [new THREE.PointLight(0x437bff, 3.2, 17), 3.6, 0.4, 1]
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
      // Convierte píxeles de pantalla a unidades de la escena para colocar el orbe en celular
      const unitsPerPx = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z / bounds.height;
      const orbRadiusPx = bounds.width * 0.95;
      mobileY = bounds.height * 0.04 * unitsPerPx;
      world.scale.setScalar(mobile ? orbRadiusPx * unitsPerPx / 2.82 : 1.08);
      world.position.x = mobile ? bounds.width * 0.45 * unitsPerPx : 2.15;
      world.position.y = mobile ? mobileY : 0;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
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
        ringMaterial.uniforms.uTime.value = elapsed;
        if (!reducedMotion) updateSpace(delta);
        updateMoons(elapsed);
        pointer.x += (target.x - pointer.x) * 0.04;
        pointer.y += (target.y - pointer.y) * 0.04;
        planet.rotation.y = elapsed * 0.06;
        // Al bajar, el planeta gira, se eleva y se aleja un poco
        world.rotation.x = pointer.y * 0.08 + scroll * 0.35 + Math.sin(elapsed * 0.25) * 0.03;
        world.rotation.y = pointer.x * 0.12 + scroll * 0.6;
        world.position.y = (window.innerWidth < 700 ? mobileY : 0) + Math.sin(elapsed * 0.4) * 0.05 + scroll * 1.6;
        camera.position.x = pointer.x * 0.18;
        camera.position.y = -pointer.y * 0.12;
        camera.lookAt(0, 0, 0);
        stars.rotation.y = elapsed * 0.012;
        stars.rotation.z = elapsed * 0.004;
        stars.position.y = scroll * 0.8;
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
