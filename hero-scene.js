import * as THREE from "/vendor/three.module.min.js";

const canvas = document.querySelector("[data-hero-canvas]");

if (canvas) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const compact = window.matchMedia("(max-width: 719px)").matches;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: !compact,
    powerPreference: compact ? "low-power" : "high-performance",
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 0.85 : 1.3));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.setClearColor(0x050707, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0.25, 14);

  const root = new THREE.Group();
  scene.add(root);

  const cyan = new THREE.Color(0x00d8ff);
  const amber = new THREE.Color(0xff9f1c);
  const white = new THREE.Color(0xf4f7f5);

  const cyanMaterial = new THREE.MeshBasicMaterial({
    color: cyan,
    toneMapped: false,
  });

  const amberMaterial = new THREE.MeshBasicMaterial({
    color: amber,
    toneMapped: false,
  });

  const lineMaterial = new THREE.LineBasicMaterial({
    color: white,
    transparent: true,
    opacity: 0.13,
  });

  function makeRibbon(points, material, radius = 0.17) {
    const curve = new THREE.CatmullRomCurve3(points, false, "centripetal", 0.48);
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, compact ? 52 : 88, radius, compact ? 6 : 8, false),
      material,
    );
    const guide = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(curve.getPoints(compact ? 56 : 92)),
      lineMaterial.clone(),
    );
    guide.material.opacity = 0.18;
    tube.add(guide);
    return tube;
  }

  const gPoints = [];
  const gStart = Math.PI * 0.16;
  const gEnd = Math.PI * 1.88;
  for (let index = 0; index <= 24; index += 1) {
    const angle = gStart + ((gEnd - gStart) * index) / 24;
    gPoints.push(
      new THREE.Vector3(
        Math.cos(angle) * 2.65 - 0.35,
        Math.sin(angle) * 2.65 + 0.15,
        Math.sin(angle * 1.6) * 0.32,
      ),
    );
  }
  gPoints.push(new THREE.Vector3(1.4, -0.25, 0.05));
  gPoints.push(new THREE.Vector3(0.35, -0.25, 0.12));
  gPoints.push(new THREE.Vector3(0.35, -2.55, 0.12));

  const pPoints = [
    new THREE.Vector3(-0.95, 1.35, -0.2),
    new THREE.Vector3(0.15, 1.35, -0.1),
    new THREE.Vector3(1.55, 1.35, 0.12),
    new THREE.Vector3(2.25, 0.95, 0.24),
    new THREE.Vector3(2.55, 0.2, 0.18),
    new THREE.Vector3(2.28, -0.55, 0.02),
    new THREE.Vector3(1.55, -0.95, -0.14),
    new THREE.Vector3(0.4, -0.95, -0.2),
    new THREE.Vector3(0.4, -2.65, -0.2),
  ];

  const gRibbon = makeRibbon(gPoints, cyanMaterial, 0.2);
  const pRibbon = makeRibbon(pPoints, amberMaterial, 0.19);
  root.add(gRibbon, pRibbon);

  const orbitGroup = new THREE.Group();
  const ringGeometry = new THREE.TorusGeometry(3.75, 0.014, 4, compact ? 56 : 96);
  const ringOne = new THREE.Mesh(
    ringGeometry,
    new THREE.MeshBasicMaterial({ color: cyan, transparent: true, opacity: 0.23 }),
  );
  ringOne.rotation.set(1.15, 0.28, 0.1);
  const ringTwo = new THREE.Mesh(
    ringGeometry.clone(),
    new THREE.MeshBasicMaterial({ color: amber, transparent: true, opacity: 0.18 }),
  );
  ringTwo.rotation.set(0.55, -0.62, 1.02);
  orbitGroup.add(ringOne, ringTwo);
  root.add(orbitGroup);

  const beaconGeometry = new THREE.BufferGeometry();
  const beaconPositions = [];
  const beaconColors = [];
  for (let index = 0; index < (compact ? 64 : 112); index += 1) {
    const distance = 4.3 + Math.random() * 7.4;
    const angle = Math.random() * Math.PI * 2;
    const height = (Math.random() - 0.5) * 8;
    beaconPositions.push(Math.cos(angle) * distance, height, Math.sin(angle) * distance - 2.5);
    const mix = Math.random();
    const color = cyan.clone().lerp(amber, mix);
    beaconColors.push(color.r, color.g, color.b);
  }
  beaconGeometry.setAttribute("position", new THREE.Float32BufferAttribute(beaconPositions, 3));
  beaconGeometry.setAttribute("color", new THREE.Float32BufferAttribute(beaconColors, 3));
  const beacons = new THREE.Points(
    beaconGeometry,
    new THREE.PointsMaterial({
      size: 0.045,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.55,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  scene.add(beacons);

  const grid = new THREE.GridHelper(24, compact ? 22 : 34, 0x275258, 0x15282a);
  grid.position.y = -3.15;
  grid.position.z = -1.2;
  grid.material.transparent = true;
  grid.material.opacity = 0.2;
  scene.add(grid);

  const pointer = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };
  let frame = 0;
  let running = true;
  let raf = 0;
  let timer = 0;
  const frameInterval = 1000 / (compact ? 14 : 28);
  const motionWindow = compact ? 1800 : 8000;
  let activeUntil = performance.now() + motionWindow;

  function scheduleRender(immediate = false) {
    if (!running || reduceMotion || timer || raf) return;
    if (immediate) {
      raf = window.requestAnimationFrame((time) => {
        raf = 0;
        render(time);
      });
      return;
    }
    timer = window.setTimeout(() => {
      timer = 0;
      raf = window.requestAnimationFrame((time) => {
        raf = 0;
        render(time);
      });
    }, frameInterval);
  }

  function wakeScene() {
    activeUntil = performance.now() + motionWindow;
    scheduleRender(true);
  }

  function fitScene() {
    const width = Math.max(canvas.clientWidth, 1);
    const height = Math.max(canvas.clientHeight, 1);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    if (width < 720) {
      root.position.set(1.65, 3.4, -1.4);
      root.scale.setScalar(0.29);
      camera.position.z = 16.2;
      grid.position.y = -2.8;
    } else if (width < 1100) {
      root.position.set(2.7, 0.2, -0.8);
      root.scale.setScalar(0.86);
      camera.position.z = 15;
      grid.position.y = -3.15;
    } else {
      root.position.set(3.7, 0.15, -0.55);
      root.scale.setScalar(1.02);
      camera.position.z = 14;
      grid.position.y = -3.15;
    }
  }

  function render(time = 0) {
    if (!running && !reduceMotion) return;

    const seconds = time * 0.001;
    pointer.x += (target.x - pointer.x) * 0.055;
    pointer.y += (target.y - pointer.y) * 0.055;

    root.rotation.y = pointer.x * 0.16 + Math.sin(seconds * 0.23) * 0.035;
    root.rotation.x = pointer.y * 0.1 + Math.cos(seconds * 0.19) * 0.025;
    orbitGroup.rotation.y = seconds * 0.08;
    orbitGroup.rotation.z = seconds * -0.045;
    gRibbon.rotation.z = Math.sin(seconds * 0.42) * 0.018;
    pRibbon.position.z = Math.cos(seconds * 0.38) * 0.08;
    beacons.rotation.y = seconds * 0.016;
    grid.position.z = -1.2 + ((seconds * 0.12) % 0.5);
    camera.position.x = pointer.x * 0.32;
    camera.position.y = 0.25 - pointer.y * 0.2;
    camera.lookAt(0.45, 0, 0);

    renderer.render(scene, camera);
    frame += 1;
    canvas.dataset.sceneReady = "true";
    window.__graystonScene = { frame, ready: true };

    if (!reduceMotion && performance.now() < activeUntil) scheduleRender();
  }

  function handlePointer(event) {
    const rect = canvas.getBoundingClientRect();
    target.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    target.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    wakeScene();
  }

  window.addEventListener("pointermove", handlePointer, { passive: true });
  window.addEventListener("pointerdown", wakeScene, { passive: true });
  window.addEventListener("resize", fitScene, { passive: true });
  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    if (running && !reduceMotion) {
      window.clearTimeout(timer);
      window.cancelAnimationFrame(raf);
      timer = 0;
      raf = 0;
      wakeScene();
    } else {
      window.clearTimeout(timer);
      window.cancelAnimationFrame(raf);
      timer = 0;
      raf = 0;
    }
  });

  const observer = new IntersectionObserver(
    ([entry]) => {
      running = entry.isIntersecting && !document.hidden;
      if (running && !reduceMotion) {
        window.clearTimeout(timer);
        window.cancelAnimationFrame(raf);
        timer = 0;
        raf = 0;
        wakeScene();
      } else {
        window.clearTimeout(timer);
        window.cancelAnimationFrame(raf);
        timer = 0;
        raf = 0;
      }
    },
    { threshold: 0.01 },
  );
  observer.observe(canvas);

  fitScene();
  render(0);
}
