/**
 * COSMOS — Universe & Solar System Simulation
 * Three.js showcase: real-date Keplerian ephemeris (JPL elements),
 * adjustable time, procedural surfaces, modern HUD.
 *
 * Modules: bodies.js (data) · orbits.js (ephemeris math) · textures.js (surfaces)
 */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

import { BODIES, COMET } from "./bodies.js";
import {
  daysSinceJ2000,
  heliocentricPosition,
  orbitPath,
  periodDaysFromA,
  J2000_MS,
} from "./orbits.js";
import {
  makePlanetTexture,
  makeCloudTexture,
  makeSunTexture,
  makeRingTexture,
  makeMilkyWayTexture,
  makeGlowTexture,
} from "./textures.js";

const AU = 28; // scene units per AU (compressed for overview)
const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Ecliptic J2000 (x, y, z=north) → three.js (x, y-up, z)
function eclToScene(p, scale = AU) {
  return { x: p.x * scale, y: p.z * scale, z: -p.y * scale };
}

// ─── Simulation state ─────────────────────────────────────────
let simDays = daysSinceJ2000(new Date()); // opens on the real sky
let paused = false;
let daysPerSec = 0; // set from the slider once the DOM is queried below
let focusId = null;
let followFocus = false;
let showLabels = true;
let tourIndex = -1;

// ─── Time scale mapping (slider 0–100 → days per second) ──────
// 1 → ~0.03 d/s (~48 min/sec) · 30 → 1 d/s · 60 → ~30 d/s
// 85 → ~1.7 yr/s · 100 → ~10 yr/s
function sliderToDaysPerSec(v) {
  if (v <= 0) return 0;
  return Math.pow(10, v * 0.0509 - 1.527);
}

function formatSpeed(daysPerSec) {
  if (daysPerSec <= 0) return "Paused";
  if (daysPerSec < 1 / 3600) {
    const x = daysPerSec * 86400;
    return `${x < 10 ? x.toFixed(1) : Math.round(x)}× real time`;
  }
  if (daysPerSec < 1) {
    const hours = daysPerSec * 24;
    return hours < 1
      ? `${(hours * 60).toFixed(1)} min / sec`
      : `${hours.toFixed(1)} hr / sec`;
  }
  if (daysPerSec < 30) {
    return daysPerSec < 1.5
      ? `${daysPerSec.toFixed(1)} day / sec`
      : `${daysPerSec.toFixed(1)} days / sec`;
  }
  if (daysPerSec < 365) return `${(daysPerSec / 30).toFixed(1)} mo / sec`;
  return `${(daysPerSec / 365.25).toFixed(1)} yr / sec`;
}

// ─── WebGL guard ──────────────────────────────────────────────
function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (c.getContext("webgl2") || c.getContext("webgl"))
    );
  } catch {
    return false;
  }
}

function showFatal(title, detail) {
  const el = document.getElementById("fatal-overlay");
  if (!el) return;
  el.querySelector(".fatal-title").textContent = title;
  el.querySelector(".fatal-detail").textContent = detail;
  el.classList.add("visible");
  document.getElementById("loading")?.classList.add("done");
}

if (!webglAvailable()) {
  showFatal(
    "WebGL unavailable",
    "COSMOS needs WebGL to render. Try a current browser with hardware acceleration enabled."
  );
  throw new Error("WebGL unavailable");
}

// ─── Scene bootstrap ──────────────────────────────────────────
const container = document.getElementById("canvas-container");
const labelsLayer = document.getElementById("labels-layer");

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x05060a, 0.00018);

const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  15000
);
const OVERVIEW_POS = new THREE.Vector3(0, 70, 150);
camera.position.copy(OVERVIEW_POS);

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

renderer.domElement.addEventListener("webglcontextlost", (e) => {
  e.preventDefault();
  showFatal(
    "Graphics context lost",
    "The GPU dropped the rendering context. Reload the page to restart the simulation."
  );
});

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 3;
controls.maxDistance = 2000;
controls.target.set(0, 0, 0);

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
scene.add(new THREE.AmbientLight(0x252b3a, 0.55));

const sunLight = new THREE.PointLight(0xfff0d0, 2.8, 0, 0.35);
sunLight.position.set(0, 0, 0);
scene.add(sunLight);

const fillLight = new THREE.DirectionalLight(0x334466, 0.3);
fillLight.position.set(-50, 30, -20);
scene.add(fillLight);

// ─── Sky: milky way + starfield ───────────────────────────────
const milkyWay = new THREE.Mesh(
  new THREE.SphereGeometry(2400, 48, 48),
  new THREE.MeshBasicMaterial({
    map: makeMilkyWayTexture(),
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
  })
);
scene.add(milkyWay);

function makeStarfield(count = 14000) {
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const col = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    let phi = Math.acos(2 * Math.random() - 1);
    const r = 900 + Math.random() * 1200;

    // Band bias toward the galactic plane
    if (Math.random() < 0.35) {
      phi = Math.PI / 2 + (Math.random() - 0.5) * 0.35;
    }

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi);
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

    const temp = Math.random();
    if (temp < 0.15) col.set(0xaaccff);
    else if (temp < 0.4) col.set(0xffffff);
    else if (temp < 0.7) col.set(0xfff4e0);
    else col.set(0xffd0a0);

    colors[i * 3] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
  }

  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  return new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
    })
  );
}

const stars = makeStarfield();
scene.add(stars);

function makeAsteroidBelt(count = 4000) {
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

const asteroidBelt = makeAsteroidBelt();
scene.add(asteroidBelt);

// ─── Sun ──────────────────────────────────────────────────────
const sunData = BODIES[0];
const sunGroup = new THREE.Group();
sunGroup.userData = { id: "sun", data: sunData };

const sunMesh = new THREE.Mesh(
  new THREE.SphereGeometry(sunData.radius, 64, 64),
  new THREE.MeshBasicMaterial({ map: makeSunTexture(), color: 0xffe9c4 })
);
sunGroup.add(sunMesh);

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

const sunGlow = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: makeGlowTexture(),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity: 0.9,
  })
);
sunGlow.scale.setScalar(sunData.radius * 6);
sunGroup.add(sunGlow);

scene.add(sunGroup);

// ─── Build planets from the ephemeris ─────────────────────────
const systemGroup = new THREE.Group();
scene.add(systemGroup);

const bodyMeshes = { sun: sunGroup };
const orbitLines = [];
const labelEls = {};
const moonEntries = [];

function makeOrbitLine(elements) {
  const pts = orbitPath(elements, simDays, 256).map((p) => {
    const s = eclToScene(p);
    return new THREE.Vector3(s.x, s.y, s.z);
  });
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  return new THREE.Line(
    geo,
    new THREE.LineBasicMaterial({
      color: 0x5a6a80,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      fog: false,
    })
  );
}

const ATMOSPHERE_VERTEX = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const ATMOSPHERE_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uStrength;
  varying vec3 vNormal;
  void main() {
    float rim = pow(clamp(0.72 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0, 1.5), 3.5);
    gl_FragColor = vec4(uColor, 1.0) * rim * uStrength;
  }
`;

function makeAtmosphere(radius, color, strength = 1) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.18, 32, 32),
    new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(color) },
        uStrength: { value: strength },
      },
      vertexShader: ATMOSPHERE_VERTEX,
      fragmentShader: ATMOSPHERE_FRAGMENT,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
}

function addLabel(id, name, isSun) {
  const el = document.createElement("div");
  el.className = `world-label${isSun ? " sun-label" : ""}`;
  el.textContent = name;
  el.dataset.id = id;
  labelsLayer.appendChild(el);
  labelEls[id] = el;
}

addLabel("sun", "Sun", true);

for (const body of BODIES.slice(1)) {
  const planetGroup = new THREE.Group();
  planetGroup.rotation.z = THREE.MathUtils.degToRad(body.tilt || 0);

  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(body.radius, 48, 48),
    new THREE.MeshStandardMaterial({
      map: makePlanetTexture(body),
      roughness: body.texture === "bands" || body.texture === "ice" ? 0.85 : 0.7,
      metalness: 0.05,
      emissive: body.color,
      emissiveIntensity: 0.04,
    })
  );
  planetGroup.add(mesh);

  if (body.atmosphere) {
    planetGroup.add(makeAtmosphere(body.radius, body.atmosphere));
  }

  if (body.clouds) {
    const cloudMesh = new THREE.Mesh(
      new THREE.SphereGeometry(body.radius * 1.03, 48, 48),
      new THREE.MeshStandardMaterial({
        map: makeCloudTexture(),
        transparent: true,
        depthWrite: false,
        roughness: 1,
        metalness: 0,
      })
    );
    planetGroup.add(cloudMesh);
    bodyMeshes[`${body.id}Clouds`] = cloudMesh;
  }

  if (body.rings) {
    const ringGeo = new THREE.RingGeometry(
      body.radius * body.rings.inner,
      body.radius * body.rings.outer,
      128
    );
    // Remap UVs so u runs radially across the ring
    const pos = ringGeo.attributes.position;
    const uv = ringGeo.attributes.uv;
    const innerR = body.radius * body.rings.inner;
    const width = body.radius * (body.rings.outer - body.rings.inner);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      uv.setXY(i, (Math.sqrt(x * x + y * y) - innerR) / width, 0.5);
    }
    const ring = new THREE.Mesh(
      ringGeo,
      new THREE.MeshBasicMaterial({
        map: makeRingTexture(body.rings.color, body.rings.opacity ?? 0.75),
        side: THREE.DoubleSide,
        transparent: true,
        depthWrite: false,
      })
    );
    ring.rotation.x = -Math.PI / 2;
    planetGroup.add(ring);
  }

  if (body.moons) {
    for (const moon of body.moons) {
      const moonMesh = new THREE.Mesh(
        new THREE.SphereGeometry(moon.radius, 24, 24),
        new THREE.MeshStandardMaterial({
          map: moon.texture
            ? makePlanetTexture({ texture: moon.texture, color: moon.color })
            : null,
          color: moon.texture ? 0xffffff : moon.color,
          roughness: 0.9,
          metalness: 0.05,
        })
      );
      planetGroup.add(moonMesh);

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
      moonEntries.push({
        mesh: moonMesh,
        data: moon,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  systemGroup.add(planetGroup);
  bodyMeshes[body.id] = { planetGroup, mesh, data: body };

  const orbit = makeOrbitLine(body.elements);
  systemGroup.add(orbit);
  orbitLines.push(orbit);

  addLabel(body.id, body.name, false);
}

// ─── Comet: one pooled trail buffer, vertex-color fade ────────
const TRAIL_POINTS = 72;
const cometTrailPositions = new Float32Array(TRAIL_POINTS * 3);
const cometTrailColors = new Float32Array(TRAIL_POINTS * 3);
{
  const head = new THREE.Color(COMET.trailColor);
  for (let i = 0; i < TRAIL_POINTS; i++) {
    const fade = Math.pow(1 - i / (TRAIL_POINTS - 1), 2.2);
    cometTrailColors[i * 3] = head.r * fade;
    cometTrailColors[i * 3 + 1] = head.g * fade;
    cometTrailColors[i * 3 + 2] = head.b * fade;
  }
}
const cometTrailGeometry = new THREE.BufferGeometry();
cometTrailGeometry.setAttribute("position", new THREE.BufferAttribute(cometTrailPositions, 3));
cometTrailGeometry.setAttribute("color", new THREE.BufferAttribute(cometTrailColors, 3));
const cometTrail = new THREE.Line(
  cometTrailGeometry,
  new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: false,
  })
);
const comet = new THREE.Mesh(
  new THREE.SphereGeometry(0.32, 16, 16),
  new THREE.MeshBasicMaterial({ color: COMET.color })
);
const cometGlow = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: makeGlowTexture("rgba(210,240,255,1)", "rgba(120,190,255,0)"),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity: 0.85,
  })
);
cometGlow.scale.setScalar(3.2);
comet.add(cometGlow);
scene.add(cometTrail, comet);

// ─── Simulation state ─────────────────────────────────────────
// (declared at the top of the file — orbit-line construction reads simDays)

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

daysPerSec = sliderToDaysPerSec(Number(speedSlider.value));

document.getElementById("body-count").textContent = String(BODIES.length);

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

  let periodLabel = "Primary";
  if (body.elements) {
    const pDays = periodDaysFromA(body.elements.a0);
    periodLabel =
      pDays >= 365 ? `${(pDays / 365.25).toFixed(1)} yr orbit` : `${Math.round(pDays)} d orbit`;
  }

  meta.innerHTML = `
    <span class="body-name">${body.name}</span>
    <span class="body-period">${periodLabel}</span>
  `;
  li.appendChild(swatch);
  li.appendChild(meta);
  li.addEventListener("click", () => setFocus(body.id));
  bodyList.appendChild(li);
}

function getBodyWorldPosition(id) {
  if (id === "sun") {
    const v = new THREE.Vector3();
    sunGroup.getWorldPosition(v);
    return v;
  }
  const entry = bodyMeshes[id];
  if (!entry || !entry.planetGroup) return null;
  const v = new THREE.Vector3();
  entry.planetGroup.getWorldPosition(v);
  return v;
}

let camAnim = null;
function animateCamera(toPos, toTarget, duration = 1) {
  if (REDUCED_MOTION) duration = 0.01;
  controls.enabled = false;
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
  if (body.elements) {
    const pDays = periodDaysFromA(body.elements.a0);
    stats.push(
      `<div class="stat"><span class="stat-label">Orbit</span><span class="stat-value">${body.elements.a0.toFixed(2)} AU</span></div>`
    );
    stats.push(
      `<div class="stat"><span class="stat-label">Year</span><span class="stat-value">${
        pDays >= 365
          ? `${(pDays / 365.25).toFixed(2)} Earth yr`
          : `${pDays.toFixed(1)} days`
      }</span></div>`
    );
    stats.push(
      `<div class="stat"><span class="stat-label">Sun distance</span><span class="stat-value" id="focus-dist">—</span></div>`
    );
  }
  if (body.tilt != null) {
    stats.push(
      `<div class="stat"><span class="stat-label">Axial tilt</span><span class="stat-value">${body.tilt.toFixed(1)}°</span></div>`
    );
  }
  focusStats.innerHTML = stats.join("");

  const targetPos = getBodyWorldPosition(id);
  if (targetPos) {
    const dist =
      id === "sun"
        ? 28
        : Math.max(body.radius * 8, body.elements ? body.elements.a0 * AU * 0.15 : 12);
    // Approach from the sunlit side so the focus view shows the day face:
    // sun sits at the origin, so step back toward it, then off-axis and up.
    const fromSun = targetPos.clone().normalize();
    const lateral = new THREE.Vector3(-fromSun.z, 0, fromSun.x);
    const offset =
      id === "sun"
        ? new THREE.Vector3(dist * 0.6, dist * 0.35, dist)
        : fromSun
            .multiplyScalar(-dist * 0.55)
            .add(lateral.multiplyScalar(dist * 0.8))
            .add(new THREE.Vector3(0, dist * 0.4, 0));
    animateCamera(targetPos.clone().add(offset), targetPos, 1.1);
  }
}

function clearFocus() {
  focusId = null;
  document.querySelectorAll(".body-item").forEach((el) => el.classList.remove("active"));
  focusName.textContent = "Solar System";
  focusType.textContent = "Overview";
  focusStats.innerHTML = `
    <div class="stat"><span class="stat-label">Bodies</span><span class="stat-value">Sun + 8 planets + Pluto</span></div>
    <div class="stat"><span class="stat-label">Positions</span><span class="stat-value">Real ephemeris (JPL)</span></div>
    <div class="stat"><span class="stat-label">Motion</span><span class="stat-value">Keplerian orbits</span></div>
  `;
  animateCamera(OVERVIEW_POS, new THREE.Vector3(0, 0, 0), 1);
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function updateSpeedUI() {
  speedReadout.textContent = formatSpeed(daysPerSec);
  const running = !paused && daysPerSec > 0;
  statusText.textContent = running ? "Running" : "Paused";
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

// Reset epoch = jump back to the real sky (today)
function resetToToday() {
  simDays = daysSinceJ2000(new Date());
  updateDateDisplay();
}

document.getElementById("btn-reset-time").addEventListener("click", resetToToday);

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

// Help overlay
const helpOverlay = document.getElementById("help-overlay");
function toggleHelp(force) {
  const show = force ?? !helpOverlay.classList.contains("visible");
  helpOverlay.classList.toggle("visible", show);
}
document.getElementById("btn-help").addEventListener("click", () => toggleHelp());
helpOverlay.addEventListener("click", (e) => {
  if (e.target === helpOverlay) toggleHelp(false);
});

// Keyboard
window.addEventListener("keydown", (e) => {
  if (e.target.matches("input, textarea")) return;
  if (e.code === "Space") {
    e.preventDefault();
    btnPlay.click();
  } else if (e.key === "Escape") {
    toggleHelp(false);
  } else if (e.key === "?" || e.key === "h" || e.key === "H") {
    toggleHelp();
  } else if (e.key === "r" || e.key === "R") {
    clearFocus();
  } else if (e.key === "n" || e.key === "N") {
    resetToToday();
  } else if (e.key === "t" || e.key === "T") {
    visitNextWorld();
  } else if (e.key >= "0" && e.key <= "9") {
    const n = Number(e.key);
    if (n === 0) {
      clearFocus();
    } else if (BODIES[n - 1]) {
      setFocus(BODIES[n - 1].id);
    }
  }
});

function updateDateDisplay() {
  const d = new Date(J2000_MS + simDays * 86400000);
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
const focusDistEl = () => document.getElementById("focus-dist");

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1);

  // Camera animation (controls disabled until it finishes)
  if (camAnim) {
    camAnim.t += dt / camAnim.duration;
    const k = easeInOut(Math.min(1, camAnim.t));
    camera.position.lerpVectors(camAnim.fromPos, camAnim.toPos, k);
    controls.target.lerpVectors(camAnim.fromTarget, camAnim.toTarget, k);
    if (camAnim.t >= 1) {
      camAnim = null;
      controls.enabled = true;
    }
  }

  // Simulation step — positions come straight from the ephemeris
  const advance = paused ? 0 : daysPerSec * dt;
  if (advance > 0) {
    simDays += advance;
  }

  for (const body of BODIES.slice(1)) {
    const entry = bodyMeshes[body.id];
    const pos = eclToScene(heliocentricPosition(body.elements, simDays));
    entry.planetGroup.position.set(pos.x, pos.y, pos.z);

    if (advance > 0 && body.rotationDays) {
      const spin = (Math.PI * 2 * advance) / Math.abs(body.rotationDays);
      entry.mesh.rotation.y += body.rotationDays < 0 ? -spin : spin;
    }
  }

  // Moons (aesthetic circular orbits around their parent)
  for (const m of moonEntries) {
    const ang = m.phase + (Math.PI * 2 * simDays) / m.data.periodDays;
    m.mesh.position.set(
      Math.cos(ang) * m.data.orbitDist,
      0,
      Math.sin(ang) * m.data.orbitDist
    );
  }

  if (advance > 0) {
    // Earth cloud layer drifts a little faster than the surface
    const clouds = bodyMeshes.earthClouds;
    if (clouds) clouds.rotation.y += advance * 0.35;

    sunMesh.rotation.y += advance * 0.02;
    corona.rotation.y -= advance * 0.01;
    asteroidBelt.rotation.y += advance * 0.00015;

    // Halley-like comet: pooled trail buffer, no per-frame allocations
    const cometEcl = heliocentricPosition(COMET.elements, simDays);
    const cometPos = eclToScene(cometEcl);
    comet.position.set(cometPos.x, cometPos.y, cometPos.z);
    cometTrailPositions.copyWithin(3, 0, cometTrailPositions.length - 3);
    cometTrailPositions[0] = cometPos.x;
    cometTrailPositions[1] = cometPos.y;
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

      const dist = camera.position.distanceTo(pos);
      const body = BODIES.find((b) => b.id === id);
      const tooFar = dist > 1500 && id !== "sun" && id !== focusId;
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

  // Ambient life (skipped entirely under prefers-reduced-motion)
  if (!REDUCED_MOTION) {
    stars.rotation.y += dt * 0.002;
    const flare = 1 + Math.sin(clock.elapsedTime * 1.7) * 0.025;
    corona.scale.setScalar(flare);
    corona2.scale.setScalar(2 - flare);
  }

  controls.update();
  composer.render();

  // FPS + slow-tick UI updates
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

    const distEl = focusDistEl();
    if (distEl && focusId) {
      const body = BODIES.find((b) => b.id === focusId);
      if (body?.elements) {
        const p = heliocentricPosition(body.elements, simDays);
        distEl.textContent = `${Math.hypot(p.x, p.y, p.z).toFixed(2)} AU`;
      }
    }
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
