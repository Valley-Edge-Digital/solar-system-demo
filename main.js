/**
 * COSMOS — Universe & Solar System Simulation
 * Three.js showcase: realistic relative orbits, adjustable time, modern HUD
 */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

// ─── Physical / aesthetic data ────────────────────────────────
// Distances in AU (visually scaled), radii aesthetic for readability.
// Orbital periods & rotation in Earth days; inclination in degrees.

const AU = 28; // scene units per AU (compressed for overview)

const BODIES = [
  {
    id: "sun",
    name: "Sun",
    type: "G-type star",
    color: 0xffc266,
    emissive: 0xffaa33,
    radius: 4.2,
    orbitAU: 0,
    periodDays: 0,
    rotationDays: 25.4,
    tilt: 7.25,
    info: { mass: "1 M☉", diameter: "1.39M km", temp: "5,772 K" },
  },
  {
    id: "mercury",
    name: "Mercury",
    type: "Terrestrial planet",
    color: 0xb5b5b5,
    radius: 0.38,
    orbitAU: 0.39,
    periodDays: 87.97,
    rotationDays: 58.6,
    tilt: 0.03,
    eccentricity: 0.206,
    info: { mass: "0.055 M⊕", diameter: "4,879 km", day: "176 Earth days" },
  },
  {
    id: "venus",
    name: "Venus",
    type: "Terrestrial planet",
    color: 0xe8cda0,
    radius: 0.95,
    orbitAU: 0.72,
    periodDays: 224.7,
    rotationDays: -243, // retrograde
    tilt: 177.4,
    eccentricity: 0.007,
    info: { mass: "0.815 M⊕", diameter: "12,104 km", day: "243 Earth days" },
  },
  {
    id: "earth",
    name: "Earth",
    type: "Terrestrial planet",
    color: 0x4a90d9,
    secondary: 0x3d8b4a,
    radius: 1.0,
    orbitAU: 1.0,
    periodDays: 365.25,
    rotationDays: 0.997,
    tilt: 23.44,
    eccentricity: 0.017,
    moons: [
      {
        id: "moon",
        name: "Moon",
        color: 0xc8c8c8,
        radius: 0.27,
        orbitDist: 2.4,
        periodDays: 27.3,
        rotationDays: 27.3,
      },
    ],
    info: { mass: "1 M⊕", diameter: "12,742 km", day: "24 hours" },
  },
  {
    id: "mars",
    name: "Mars",
    type: "Terrestrial planet",
    color: 0xc1440e,
    radius: 0.53,
    orbitAU: 1.52,
    periodDays: 686.98,
    rotationDays: 1.026,
    tilt: 25.19,
    eccentricity: 0.094,
    info: { mass: "0.107 M⊕", diameter: "6,779 km", day: "24.6 hours" },
  },
  {
    id: "jupiter",
    name: "Jupiter",
    type: "Gas giant",
    color: 0xd4a574,
    bands: true,
    radius: 2.8,
    orbitAU: 5.2,
    periodDays: 4332.59,
    rotationDays: 0.414,
    tilt: 3.13,
    eccentricity: 0.049,
    moons: [
      { id: "io", name: "Io", color: 0xf0e68c, radius: 0.22, orbitDist: 4.2, periodDays: 1.77 },
      { id: "europa", name: "Europa", color: 0xb0c4de, radius: 0.19, orbitDist: 5.4, periodDays: 3.55 },
      { id: "ganymede", name: "Ganymede", color: 0xa09080, radius: 0.28, orbitDist: 6.8, periodDays: 7.15 },
      { id: "callisto", name: "Callisto", color: 0x6b6b6b, radius: 0.25, orbitDist: 8.5, periodDays: 16.7 },
    ],
    info: { mass: "318 M⊕", diameter: "139,820 km", day: "9.9 hours" },
  },
  {
    id: "saturn",
    name: "Saturn",
    type: "Gas giant",
    color: 0xe8d5a3,
    radius: 2.35,
    orbitAU: 9.58,
    periodDays: 10759.22,
    rotationDays: 0.444,
    tilt: 26.73,
    eccentricity: 0.057,
    rings: { inner: 1.4, outer: 2.35, color: 0xc9b896 },
    info: { mass: "95 M⊕", diameter: "116,460 km", day: "10.7 hours" },
  },
  {
    id: "uranus",
    name: "Uranus",
    type: "Ice giant",
    color: 0x7de3e0,
    radius: 1.55,
    orbitAU: 19.22,
    periodDays: 30688.5,
    rotationDays: -0.718,
    tilt: 97.77,
    eccentricity: 0.046,
    rings: { inner: 1.25, outer: 1.7, color: 0x9ad4d2, opacity: 0.35 },
    info: { mass: "14.5 M⊕", diameter: "50,724 km", day: "17.2 hours" },
  },
  {
    id: "neptune",
    name: "Neptune",
    type: "Ice giant",
    color: 0x4166f5,
    radius: 1.5,
    orbitAU: 30.05,
    periodDays: 60182,
    rotationDays: 0.671,
    tilt: 28.32,
    eccentricity: 0.01,
    info: { mass: "17 M⊕", diameter: "49,244 km", day: "16.1 hours" },
  },
];

// ─── Time scale mapping (slider 0–100 → days per second) ──────
function sliderToDaysPerSec(v) {
  if (v <= 0) return 0;
  // Log-ish curve: gentle near real-time, aggressive at high end
  // 1  → ~1/86400 (real-ish)
  // 30 → ~1 day/sec
  // 60 → ~30 days/sec
  // 85 → ~1 year/sec
  // 100 → ~10 years/sec
  const t = v / 100;
  return Math.pow(10, t * 5.5 - 2.5); // ~0.003 … ~3162 days/sec
}

function formatSpeed(daysPerSec) {
  if (daysPerSec <= 0) return "Paused";
  if (daysPerSec < 1 / 86400) return "Near real-time";
  if (daysPerSec < 1 / 3600) {
    const s = daysPerSec * 86400;
    return `${s.toFixed(1)}× real time`;
  }
  if (daysPerSec < 1) {
    const hours = daysPerSec * 24;
    return hours < 1
      ? `${(hours * 60).toFixed(1)} min / sec`
      : `${hours.toFixed(1)} hr / sec`;
  }
  if (daysPerSec < 30) return `${daysPerSec.toFixed(1)} day / sec`;
  if (daysPerSec < 365) return `${(daysPerSec / 30).toFixed(1)} mo / sec`;
  return `${(daysPerSec / 365.25).toFixed(1)} yr / sec`;
}

// ─── Procedural textures ──────────────────────────────────────
function makePlanetTexture(body) {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  const base = new THREE.Color(body.color);
  ctx.fillStyle = `#${base.getHexString()}`;
  ctx.fillRect(0, 0, size, size);

  const img = ctx.createImageData(size, size);
  const data = img.data;
  const sec = body.secondary ? new THREE.Color(body.secondary) : null;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const nx = x / size;
      const ny = y / size;
      const noise =
        Math.sin(nx * 40 + Math.cos(ny * 20) * 2) * 0.08 +
        Math.sin(nx * 90 + ny * 50) * 0.04 +
        (hash(x, y) - 0.5) * 0.08;

      let r = base.r, g = base.g, b = base.b;

      if (body.bands) {
        const band = Math.sin(ny * Math.PI * 8 + Math.sin(nx * 12) * 0.5) * 0.5 + 0.5;
        r = THREE.MathUtils.lerp(0.52, 0.92, band) + noise;
        g = THREE.MathUtils.lerp(0.38, 0.72, band) + noise * 0.8;
        b = THREE.MathUtils.lerp(0.22, 0.48, band) + noise * 0.5;
      } else if (body.id === "earth" && sec) {
        const lat = ny * Math.PI;
        const continent =
          Math.sin(nx * Math.PI * 4 + Math.cos(ny * Math.PI * 3) * 1.5) *
            Math.sin(ny * Math.PI * 2.5) +
          noise * 3;
        if (continent > 0.2) {
          r = sec.r * (0.85 + noise);
          g = sec.g * (0.9 + noise);
          b = sec.b * (0.8 + noise);
        } else {
          r = base.r * (0.7 + noise + Math.sin(nx * 20) * 0.05);
          g = base.g * (0.75 + noise);
          b = base.b * (0.9 + noise * 0.5);
        }
        if (lat < 0.22 || lat > Math.PI - 0.22) {
          r = g = b = 0.93 + noise * 0.05;
        }
      } else if (body.id === "mars") {
        const dark = Math.sin(nx * 15 + ny * 10) * 0.5 + 0.5;
        r = base.r * (0.7 + dark * 0.35) + noise;
        g = base.g * (0.65 + dark * 0.3) + noise;
        b = base.b * (0.6 + dark * 0.25) + noise;
      } else if (body.id === "jupiter" || body.bands) {
        // already handled
      } else if (body.id === "neptune" || body.id === "uranus") {
        const band = Math.sin(ny * 20) * 0.08;
        r = base.r * (0.85 + noise) + band;
        g = base.g * (0.9 + noise);
        b = base.b * (0.95 + noise * 0.5);
      } else {
        r = base.r * (0.88 + noise + Math.sin(nx * 30) * 0.05);
        g = base.g * (0.88 + noise);
        b = base.b * (0.88 + noise);
      }

      data[idx] = Math.min(255, Math.max(0, r * 255));
      data[idx + 1] = Math.min(255, Math.max(0, g * 255));
      data[idx + 2] = Math.min(255, Math.max(0, b * 255));
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function hash(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function makeSunTexture() {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(size, size);
  const data = img.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const n =
        Math.sin(x * 0.08) * Math.cos(y * 0.06) * 0.15 +
        Math.sin(x * 0.2 + y * 0.15) * 0.1 +
        hash(x, y) * 0.2;
      data[idx] = Math.min(255, 255 * (0.9 + n));
      data[idx + 1] = Math.min(255, 180 * (0.85 + n));
      data[idx + 2] = Math.min(255, 60 * (0.7 + n * 0.5));
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeRingTexture(color, opacity = 0.75) {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = 4;
  const ctx = canvas.getContext("2d");
  const c = new THREE.Color(color);

  for (let x = 0; x < size; x++) {
    const t = x / size;
    // Cassini-like gaps
    let a = opacity;
    if (t > 0.55 && t < 0.6) a *= 0.15;
    if (t > 0.72 && t < 0.76) a *= 0.35;
    if (t < 0.08 || t > 0.96) a *= 0.2;
    const noise = hash(x, 1) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(${(c.r * 255 * noise) | 0},${(c.g * 255 * noise) | 0},${(c.b * 255 * noise) | 0},${a * noise})`;
    ctx.fillRect(x, 0, 1, 4);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  return tex;
}

function makeStarfield(count = 12000) {
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    // Spherical distribution with milky-way bias
    const theta = Math.random() * Math.PI * 2;
    let phi = Math.acos(2 * Math.random() - 1);
    const r = 800 + Math.random() * 1200;

    // Band bias
    if (Math.random() < 0.35) {
      phi = Math.PI / 2 + (Math.random() - 0.5) * 0.35;
    }

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi);
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

    const temp = Math.random();
    let col;
    if (temp < 0.15) col = new THREE.Color(0xaaccff); // blue
    else if (temp < 0.4) col = new THREE.Color(0xffffff);
    else if (temp < 0.7) col = new THREE.Color(0xfff4e0);
    else col = new THREE.Color(0xffd0a0);

    colors[i * 3] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
  }

  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 1.4,
    vertexColors: true,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  return new THREE.Points(geo, mat);
}

function makeAsteroidBelt(count = 3500) {
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const inner = 2.2 * AU;
  const outer = 3.2 * AU;

  for (let i = 0; i < count; i++) {
    const a = inner + Math.random() * (outer - inner);
    const theta = Math.random() * Math.PI * 2;
    const y = (Math.random() - 0.5) * 3;
    positions[i * 3] = Math.cos(theta) * a;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = Math.sin(theta) * a;

    const shade = 0.35 + Math.random() * 0.4;
    colors[i * 3] = shade;
    colors[i * 3 + 1] = shade * 0.95;
    colors[i * 3 + 2] = shade * 0.85;
  }

  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  return new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      size: 0.45,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true,
      depthWrite: false,
    })
  );
}

// ─── Orbit helpers ────────────────────────────────────────────
function createOrbitLine(orbitAU, eccentricity = 0, color = 0x445566) {
  const a = orbitAU * AU;
  const e = eccentricity || 0;
  const b = a * Math.sqrt(1 - e * e);
  const c = a * e; // focus offset
  const pts = [];
  const segments = 256;
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(t) * a - c, 0, Math.sin(t) * b));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
  });
  return new THREE.Line(geo, mat);
}

function keplerPosition(orbitAU, eccentricity, meanAnomaly) {
  const a = orbitAU * AU;
  const e = eccentricity || 0;
  // Solve Kepler's equation (simple iteration)
  let E = meanAnomaly;
  for (let i = 0; i < 8; i++) {
    E = meanAnomaly + e * Math.sin(E);
  }
  const x = a * (Math.cos(E) - e);
  const z = a * Math.sqrt(1 - e * e) * Math.sin(E);
  return { x, y: 0, z };
}

// ─── Scene bootstrap ──────────────────────────────────────────
const container = document.getElementById("canvas-container");
const labelsLayer = document.getElementById("labels-layer");

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x05060a, 0.00035);

const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  5000
);
camera.position.set(0, 45, 95);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 3;
controls.maxDistance = 900;
controls.target.set(0, 0, 0);
controls.autoRotate = false;

// Post-processing bloom for sun / stars glow
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.55,
  0.6,
  0.85
);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

// Lights
const ambient = new THREE.AmbientLight(0x1a1e2a, 0.35);
scene.add(ambient);

const sunLight = new THREE.PointLight(0xfff0d0, 2.8, 0, 0.35);
sunLight.position.set(0, 0, 0);
scene.add(sunLight);

const fillLight = new THREE.DirectionalLight(0x334466, 0.15);
fillLight.position.set(-50, 30, -20);
scene.add(fillLight);

// Stars + belt
const stars = makeStarfield(14000);
scene.add(stars);

const asteroidBelt = makeAsteroidBelt(4000);
scene.add(asteroidBelt);

// A stylized visitor gives the quiet system one dramatic moving landmark.
const cometTrailPositions = new Float32Array(72 * 3);
const cometTrailGeometry = new THREE.BufferGeometry();
cometTrailGeometry.setAttribute("position", new THREE.BufferAttribute(cometTrailPositions, 3));
const cometTrail = new THREE.Line(
  cometTrailGeometry,
  new THREE.LineBasicMaterial({
    color: 0x9bdcff,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
);
const comet = new THREE.Mesh(
  new THREE.SphereGeometry(0.32, 16, 16),
  new THREE.MeshBasicMaterial({ color: 0xe8fbff })
);
scene.add(cometTrail, comet);
let cometAnomaly = 2.35;

// Subtle galactic haze
const hazeGeo = new THREE.SphereGeometry(700, 32, 32);
const hazeMat = new THREE.MeshBasicMaterial({
  color: 0x0a1020,
  side: THREE.BackSide,
  transparent: true,
  opacity: 0.4,
});
scene.add(new THREE.Mesh(hazeGeo, hazeMat));

// ─── Build solar system ───────────────────────────────────────
const systemGroup = new THREE.Group();
scene.add(systemGroup);

const bodyMeshes = {};
const orbitLines = [];
const labelEls = {};
const moonEntries = [];

const sunData = BODIES[0];
const sunGroup = new THREE.Group();
sunGroup.userData = { id: "sun", data: sunData };

const sunMesh = new THREE.Mesh(
  new THREE.SphereGeometry(sunData.radius, 64, 64),
  new THREE.MeshBasicMaterial({
    map: makeSunTexture(),
    color: 0xffe0a0,
  })
);
sunGroup.add(sunMesh);

// Corona
const corona = new THREE.Mesh(
  new THREE.SphereGeometry(sunData.radius * 1.35, 32, 32),
  new THREE.MeshBasicMaterial({
    color: 0xffaa40,
    transparent: true,
    opacity: 0.18,
    side: THREE.BackSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
);
sunGroup.add(corona);

const corona2 = new THREE.Mesh(
  new THREE.SphereGeometry(sunData.radius * 1.9, 32, 32),
  new THREE.MeshBasicMaterial({
    color: 0xff7720,
    transparent: true,
    opacity: 0.08,
    side: THREE.BackSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
);
sunGroup.add(corona2);

systemGroup.add(sunGroup);
bodyMeshes.sun = sunGroup;
addLabel("sun", "Sun", true);

// Planets
for (const body of BODIES.slice(1)) {
  const pivot = new THREE.Group();
  pivot.userData = { id: body.id, data: body, meanAnomaly: Math.random() * Math.PI * 2 };

  const planetGroup = new THREE.Group();
  // Axial tilt
  planetGroup.rotation.z = THREE.MathUtils.degToRad(body.tilt || 0);

  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(body.radius, 48, 48),
    new THREE.MeshStandardMaterial({
      map: makePlanetTexture(body),
      roughness: body.bands ? 0.85 : 0.7,
      metalness: 0.05,
      emissive: body.color,
      emissiveIntensity: 0.04,
    })
  );
  planetGroup.add(mesh);

  // Atmosphere rim for earth / ice giants
  if (["earth", "uranus", "neptune", "venus"].includes(body.id)) {
    const atmColor =
      body.id === "venus" ? 0xffe0b0 :
      body.id === "earth" ? 0x6eb6ff :
      body.color;
    const atm = new THREE.Mesh(
      new THREE.SphereGeometry(body.radius * 1.06, 32, 32),
      new THREE.MeshBasicMaterial({
        color: atmColor,
        transparent: true,
        opacity: 0.12,
        side: THREE.BackSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    planetGroup.add(atm);
  }

  // Rings
  if (body.rings) {
    const ringGeo = new THREE.RingGeometry(
      body.radius * body.rings.inner,
      body.radius * body.rings.outer,
      96
    );
    // UV fix for ring texture
    const pos = ringGeo.attributes.position;
    const uv = ringGeo.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const dist = Math.sqrt(x * x + y * y);
      const u =
        (dist - body.radius * body.rings.inner) /
        (body.radius * (body.rings.outer - body.rings.inner));
      uv.setXY(i, u, 0.5);
    }
    const ringMat = new THREE.MeshBasicMaterial({
      map: makeRingTexture(body.rings.color, body.rings.opacity ?? 0.75),
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    planetGroup.add(ring);
  }

  // Moons
  if (body.moons) {
    for (const moon of body.moons) {
      const moonPivot = new THREE.Group();
      moonPivot.userData = {
        meanAnomaly: Math.random() * Math.PI * 2,
        periodDays: moon.periodDays,
        orbitDist: moon.orbitDist,
      };
      const moonMesh = new THREE.Mesh(
        new THREE.SphereGeometry(moon.radius, 24, 24),
        new THREE.MeshStandardMaterial({
          color: moon.color,
          roughness: 0.9,
          metalness: 0.05,
        })
      );
      moonMesh.position.x = moon.orbitDist;
      moonPivot.add(moonMesh);

      const mPts = [];
      for (let i = 0; i <= 64; i++) {
        const t = (i / 64) * Math.PI * 2;
        mPts.push(
          new THREE.Vector3(
            Math.cos(t) * moon.orbitDist,
            0,
            Math.sin(t) * moon.orbitDist
          )
        );
      }
      const mLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(mPts),
        new THREE.LineBasicMaterial({
          color: 0x667788,
          transparent: true,
          opacity: 0.2,
          depthWrite: false,
        })
      );
      planetGroup.add(mLine);
      planetGroup.add(moonPivot);
      moonEntries.push({ pivot: moonPivot, mesh: moonMesh, data: moon });
    }
  }

  pivot.add(planetGroup);
  systemGroup.add(pivot);

  // Initial position
  const pos = keplerPosition(body.orbitAU, body.eccentricity, pivot.userData.meanAnomaly);
  planetGroup.position.set(pos.x, pos.y, pos.z);

  bodyMeshes[body.id] = { pivot, planetGroup, mesh, data: body };

  const orbit = createOrbitLine(body.orbitAU, body.eccentricity, 0x5a6a80);
  systemGroup.add(orbit);
  orbitLines.push(orbit);

  addLabel(body.id, body.name, false);
}

function addLabel(id, name, isSun) {
  const el = document.createElement("div");
  el.className = `world-label${isSun ? " sun-label" : ""}`;
  el.textContent = name;
  el.dataset.id = id;
  labelsLayer.appendChild(el);
  labelEls[id] = el;
}

// ─── HUD wiring ───────────────────────────────────────────────
const bodyList = document.getElementById("body-list");
const focusName = document.getElementById("focus-name");
const focusType = document.getElementById("focus-type");
const focusStats = document.getElementById("focus-stats");
const simDateEl = document.getElementById("sim-date");
const speedSlider = document.getElementById("speed-slider");
const speedReadout = document.getElementById("speed-readout");
const statusText = document.getElementById("status-text");
const statusDot = document.querySelector(".status-dot");
const fpsCounter = document.getElementById("fps-counter");
const btnPlay = document.getElementById("btn-play");
const btnTour = document.getElementById("btn-tour");
const iconPlay = document.getElementById("icon-play");
const iconPause = document.getElementById("icon-pause");

let focusId = null;
let followFocus = false;
let showLabels = true;
let paused = false;
let daysPerSec = sliderToDaysPerSec(Number(speedSlider.value));
let simDays = 0; // days since J2000-ish epoch display
let tourIndex = -1;
const epoch = new Date(Date.UTC(2000, 0, 1));

// Populate body list
for (const body of BODIES) {
  const li = document.createElement("li");
  li.className = "body-item";
  li.dataset.id = body.id;
  const swatch = document.createElement("span");
  swatch.className = "body-swatch";
  const col = new THREE.Color(body.emissive || body.color);
  swatch.style.background = `#${col.getHexString()}`;
  swatch.style.setProperty("--swatch-glow", `#${col.getHexString()}66`);
  const meta = document.createElement("div");
  meta.className = "body-meta";
  meta.innerHTML = `
    <span class="body-name">${body.name}</span>
    <span class="body-period">${
      body.periodDays
        ? body.periodDays >= 365
          ? `${(body.periodDays / 365.25).toFixed(1)} yr orbit`
          : `${Math.round(body.periodDays)} d orbit`
        : "Primary"
    }</span>
  `;
  li.appendChild(swatch);
  li.appendChild(meta);
  li.addEventListener("click", () => setFocus(body.id));
  bodyList.appendChild(li);
}

function setFocus(id) {
  focusId = id;
  document.querySelectorAll(".body-item").forEach((el) => {
    el.classList.toggle("active", el.dataset.id === id);
  });

  const body = BODIES.find((b) => b.id === id);
  if (!body) return;

  focusName.textContent = body.name;
  focusType.textContent = body.type;

  const stats = [];
  if (body.info) {
    for (const [k, v] of Object.entries(body.info)) {
      stats.push(
        `<div class="stat"><span class="stat-label">${capitalize(k)}</span><span class="stat-value">${v}</span></div>`
      );
    }
  }
  if (body.orbitAU) {
    stats.push(
      `<div class="stat"><span class="stat-label">Orbit</span><span class="stat-value">${body.orbitAU} AU</span></div>`
    );
  }
  if (body.periodDays) {
    stats.push(
      `<div class="stat"><span class="stat-label">Year</span><span class="stat-value">${
        body.periodDays >= 365
          ? `${(body.periodDays / 365.25).toFixed(2)} Earth yr`
          : `${body.periodDays.toFixed(1)} days`
      }</span></div>`
    );
  }
  if (body.tilt != null) {
    stats.push(
      `<div class="stat"><span class="stat-label">Axial tilt</span><span class="stat-value">${body.tilt.toFixed(1)}°</span></div>`
    );
  }
  focusStats.innerHTML = stats.join("");

  // Fly camera toward body
  const targetPos = getBodyWorldPosition(id);
  if (targetPos) {
    const dist =
      id === "sun"
        ? 28
        : Math.max(body.radius * 8, body.orbitAU ? body.orbitAU * AU * 0.15 : 12);
    const offset = new THREE.Vector3(dist * 0.6, dist * 0.35, dist);
    const endCam = targetPos.clone().add(offset);

    animateCamera(endCam, targetPos, 1.1);
  }
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function getBodyWorldPosition(id) {
  if (id === "sun") {
    const v = new THREE.Vector3();
    sunGroup.getWorldPosition(v);
    return v;
  }
  const entry = bodyMeshes[id];
  if (!entry) return null;
  const v = new THREE.Vector3();
  entry.planetGroup.getWorldPosition(v);
  return v;
}

let camAnim = null;
function animateCamera(toPos, toTarget, duration = 1) {
  camAnim = {
    fromPos: camera.position.clone(),
    toPos: toPos.clone(),
    fromTarget: controls.target.clone(),
    toTarget: toTarget.clone(),
    t: 0,
    duration,
  };
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// Controls
function updateSpeedUI() {
  speedReadout.textContent = formatSpeed(daysPerSec);
  const running = !paused && daysPerSec > 0;
  statusText.textContent = paused ? "Paused" : daysPerSec <= 0 ? "Paused" : "Running";
  statusDot.classList.toggle("paused", !running);
  iconPlay.classList.toggle("hidden", running);
  iconPause.classList.toggle("hidden", !running);
}

speedSlider.addEventListener("input", () => {
  daysPerSec = sliderToDaysPerSec(Number(speedSlider.value));
  if (daysPerSec > 0) paused = false;
  updateSpeedUI();
});

btnPlay.addEventListener("click", () => {
  if (daysPerSec <= 0) {
    speedSlider.value = 30;
    daysPerSec = sliderToDaysPerSec(30);
    paused = false;
  } else {
    paused = !paused;
  }
  updateSpeedUI();
});

document.getElementById("btn-slower").addEventListener("click", () => {
  speedSlider.value = Math.max(0, Number(speedSlider.value) - 8);
  daysPerSec = sliderToDaysPerSec(Number(speedSlider.value));
  if (daysPerSec > 0) paused = false;
  updateSpeedUI();
});

document.getElementById("btn-faster").addEventListener("click", () => {
  speedSlider.value = Math.min(100, Number(speedSlider.value) + 8);
  daysPerSec = sliderToDaysPerSec(Number(speedSlider.value));
  paused = false;
  updateSpeedUI();
});

document.getElementById("btn-reset-time").addEventListener("click", () => {
  simDays = 0;
  // Reset mean anomalies to a coherent state
  for (const body of BODIES.slice(1)) {
    const entry = bodyMeshes[body.id];
    if (entry) entry.pivot.userData.meanAnomaly = 0;
  }
  updateDateDisplay();
});

document.getElementById("toggle-orbits").addEventListener("change", (e) => {
  orbitLines.forEach((l) => (l.visible = e.target.checked));
});

document.getElementById("toggle-labels").addEventListener("change", (e) => {
  showLabels = e.target.checked;
  if (!showLabels) {
    Object.values(labelEls).forEach((el) => el.classList.remove("visible"));
  }
});

document.getElementById("toggle-asteroids").addEventListener("change", (e) => {
  asteroidBelt.visible = e.target.checked;
});

document.getElementById("toggle-follow").addEventListener("change", (e) => {
  followFocus = e.target.checked;
});

document.getElementById("btn-fullscreen").addEventListener("click", () => {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
  else document.exitFullscreen?.();
});

function visitNextWorld() {
  tourIndex = (tourIndex + 1) % BODIES.length;
  setFocus(BODIES[tourIndex].id);
}

btnTour.addEventListener("click", visitNextWorld);

// Keyboard
window.addEventListener("keydown", (e) => {
  if (e.target.matches("input, textarea")) return;
  if (e.code === "Space") {
    e.preventDefault();
    btnPlay.click();
  } else if (e.key === "r" || e.key === "R") {
    animateCamera(new THREE.Vector3(0, 45, 95), new THREE.Vector3(0, 0, 0), 1);
    focusId = null;
    document.querySelectorAll(".body-item").forEach((el) => el.classList.remove("active"));
    focusName.textContent = "Solar System";
    focusType.textContent = "Overview";
    focusStats.innerHTML = `
      <div class="stat"><span class="stat-label">Bodies</span><span class="stat-value">Sun + 8 planets</span></div>
      <div class="stat"><span class="stat-label">Scale</span><span class="stat-value">Aesthetic / relative</span></div>
      <div class="stat"><span class="stat-label">Motion</span><span class="stat-value">Keplerian orbits</span></div>
    `;
  } else if (e.key === "t" || e.key === "T") {
    visitNextWorld();
  } else if (e.key >= "0" && e.key <= "9") {
    const n = Number(e.key);
    if (n === 0) {
      animateCamera(new THREE.Vector3(0, 45, 95), new THREE.Vector3(0, 0, 0), 1);
      focusId = null;
    } else if (BODIES[n - 1]) {
      setFocus(BODIES[n - 1].id);
    }
  }
});

function updateDateDisplay() {
  const d = new Date(epoch.getTime() + simDays * 86400000);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  simDateEl.textContent = `${y}-${m}-${day}`;
}

// ─── Resize ───────────────────────────────────────────────────
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  bloomPass.setSize(window.innerWidth, window.innerHeight);
});

// ─── Animation loop ───────────────────────────────────────────
const clock = new THREE.Clock();
let fpsAccum = 0;
let fpsFrames = 0;
let lastFpsUpdate = 0;

const _proj = new THREE.Vector3();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1);

  // Camera animation
  if (camAnim) {
    camAnim.t += dt / camAnim.duration;
    const k = easeInOut(Math.min(1, camAnim.t));
    camera.position.lerpVectors(camAnim.fromPos, camAnim.toPos, k);
    controls.target.lerpVectors(camAnim.fromTarget, camAnim.toTarget, k);
    if (camAnim.t >= 1) camAnim = null;
  }

  // Simulation step
  const advance = paused ? 0 : daysPerSec * dt;
  if (advance > 0) {
    simDays += advance;

    for (const body of BODIES.slice(1)) {
      const entry = bodyMeshes[body.id];
      if (!entry) continue;
      const n = (Math.PI * 2) / body.periodDays; // rad per day
      entry.pivot.userData.meanAnomaly += n * advance;
      const pos = keplerPosition(
        body.orbitAU,
        body.eccentricity,
        entry.pivot.userData.meanAnomaly
      );
      entry.planetGroup.position.set(pos.x, pos.y, pos.z);

      // Spin
      if (body.rotationDays) {
        const spin = (Math.PI * 2 * advance) / Math.abs(body.rotationDays);
        entry.mesh.rotation.y += body.rotationDays < 0 ? -spin : spin;
      }
    }

    // Moons
    for (const m of moonEntries) {
      const n = (Math.PI * 2) / m.data.periodDays;
      m.pivot.userData.meanAnomaly += n * advance;
      const ang = m.pivot.userData.meanAnomaly;
      m.mesh.position.set(
        Math.cos(ang) * m.data.orbitDist,
        0,
        Math.sin(ang) * m.data.orbitDist
      );
      m.mesh.rotation.y += advance * 0.5;
    }

    // Sun slow spin
    sunMesh.rotation.y += advance * 0.02;
    corona.rotation.y -= advance * 0.01;

    // Asteroid drift
    asteroidBelt.rotation.y += advance * 0.00015;

    // Halley-like comet: one pooled trail buffer, no per-frame objects.
    cometAnomaly += advance * 0.0018;
    const cometPos = keplerPosition(5.8, 0.84, cometAnomaly);
    comet.position.set(cometPos.x, 0.8, cometPos.z);
    cometTrailPositions.copyWithin(3, 0, cometTrailPositions.length - 3);
    cometTrailPositions[0] = cometPos.x;
    cometTrailPositions[1] = 0.8;
    cometTrailPositions[2] = cometPos.z;
    cometTrailGeometry.attributes.position.needsUpdate = true;
  }

  // Follow focus
  if (followFocus && focusId && !camAnim) {
    const p = getBodyWorldPosition(focusId);
    if (p) {
      const offset = camera.position.clone().sub(controls.target);
      controls.target.lerp(p, 0.08);
      camera.position.copy(controls.target).add(offset);
    }
  }

  // Labels
  if (showLabels) {
    for (const [id, el] of Object.entries(labelEls)) {
      const pos = getBodyWorldPosition(id);
      if (!pos) {
        el.classList.remove("visible");
        continue;
      }
      _proj.copy(pos).project(camera);
      const behind = _proj.z > 1;
      const x = (_proj.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-_proj.y * 0.5 + 0.5) * window.innerHeight;
      const onScreen =
        !behind && x > -40 && x < window.innerWidth + 40 && y > -20 && y < window.innerHeight + 20;

      // Distance cull for clutter
      const dist = camera.position.distanceTo(pos);
      const body = BODIES.find((b) => b.id === id);
      const minShow = body?.orbitAU ? body.orbitAU * AU * 0.02 : 0;
      const tooFar = dist > 500 && id !== "sun" && id !== focusId;
      const tooClose = dist < (body?.radius ?? 1) * 2.5 && id !== focusId;

      if (onScreen && !tooFar && !tooClose) {
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.classList.add("visible");
      } else {
        el.classList.remove("visible");
      }
    }
  }

  // Stars slow drift
  stars.rotation.y += dt * 0.002;
  const flare = 1 + Math.sin(clock.elapsedTime * 1.7) * 0.025;
  corona.scale.setScalar(flare);
  corona2.scale.setScalar(2 - flare);

  controls.update();
  composer.render();

  // FPS
  fpsFrames++;
  fpsAccum += dt;
  lastFpsUpdate += dt;
  if (lastFpsUpdate >= 0.5) {
    const fps = Math.round(fpsFrames / fpsAccum);
    fpsCounter.textContent = `${fps} FPS`;
    fpsFrames = 0;
    fpsAccum = 0;
    lastFpsUpdate = 0;
    updateDateDisplay();
  }
}

updateSpeedUI();
updateDateDisplay();

// Hide loading after first frame
requestAnimationFrame(() => {
  animate();
  setTimeout(() => {
    document.getElementById("loading").classList.add("done");
  }, 400);
});
