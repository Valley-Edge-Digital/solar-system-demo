# solar-system-demo — skill bundle for Claude Desktop

WebGL/Three.js showcase demo.

23 skills from MengTo/Skills, concatenated 2026-07-27. Source of truth: `skills/` in this project.
Borrowed material — unvetted, no accessibility guarantee; project doctrine outranks it.


---

## threejs

---
name: threejs
description: Use when building or debugging interactive 3D scenes on the web with Three.js (scene/camera/renderer, lights/materials, GLTF loading, controls, performance). Helpful for designers shipping 3D UI moments.
---

# Three.js — WebGL 3D Scenes Skill

## When to use
- Real 3D: product spins, interactive hero scenes, shaders/material effects, 3D data viz
- You need full control beyond “background effects”
- You can budget time for asset pipeline + performance tuning

## Core mental model
- Create:
  - `Scene` (root graph)
  - `Camera` (Perspective/Orthographic)
  - `Renderer` (`WebGLRenderer`)
  - `Mesh` = `Geometry` + `Material`
  - Lights (if using non-unlit materials)
- Render loop:
  - `requestAnimationFrame(animate)`
  - Update time-based animations, controls, mixers, then `renderer.render(scene, camera)`

## Key APIs/patterns
- Setup:
  - `const renderer = new THREE.WebGLRenderer({ canvas, antialias, alpha })`
  - `renderer.setSize(width, height, false)`
  - `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))`
- Camera:
  - `camera.aspect = width / height; camera.updateProjectionMatrix()`
- Scene graph:
  - `scene.add(object)` / `object.position/rotation/scale`
- Loading assets:
  - `GLTFLoader` (models), `TextureLoader` (images), `DRACOLoader` (compressed glTF)
- Controls (common):
  - `OrbitControls` (debug/product), `PointerLockControls` (FPS), custom pointer handlers
- Cleanup (important in SPAs):
  - `geometry.dispose()`, `material.dispose()`, `texture.dispose()`, `renderer.dispose()`
  - Remove event listeners; cancel RAF.

## Common pitfalls
- Not handling resize → stretched/cropped rendering
- Too high devicePixelRatio → mobile GPU meltdown
- Leaking WebGL resources (not disposing) → crashes after route changes
- Loading huge textures/models → slow start; use compressed textures, Draco/KTX2, smaller maps
- Using too many lights/shadows → expensive; fake lighting with baked textures when possible

## Quick recipes

### 1) Minimal spinning cube
```js
import * as THREE from "three";

const canvas = document.querySelector("#c");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.set(0, 0, 4);

const geom = new THREE.BoxGeometry(1, 1, 1);
const mat = new THREE.MeshStandardMaterial({ color: 0x7c3aed });
const mesh = new THREE.Mesh(geom, mat);
scene.add(mesh);

scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const dir = new THREE.DirectionalLight(0xffffff, 0.8);
dir.position.set(2, 2, 2);
scene.add(dir);

function resize() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  renderer.setSize(w, h, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
resize();

function animate(t) {
  mesh.rotation.y = t * 0.0006;
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
```

### 2) Respect reduced motion
- If `prefers-reduced-motion: reduce`, render a still frame (no RAF) or slow updates.

## What to ask the user
- Is this decorative (hero) or functional 3D (product viewer)?
- Target devices: mobile? older iPhones?
- Asset format availability (glTF, HDRI, textures) and file size constraints
- Accessibility/reduced motion requirements


---

## webgl-3d-object

---
name: webgl-3d-object
description: Create a real 3D WebGL object with geometric mesh depth, physically based material, directional and ambient lighting, perspective camera, subtle rotation, and floating motion. Use when a page needs a faceted 3D hero object or product-like visual with real lighting instead of CSS transform tricks.
---

# WebGL 3D Object

## Use When
- A hero, feature block, or product moment needs one strong 3D object.
- The visual should show real geometry, lighting, highlights, and edges.
- A faceted mesh should float or rotate subtly inside a web layout.
- CSS transforms, SVG illusions, or flat gradients are not enough.

## Rules
1. Use real 3D geometry: `IcosahedronGeometry`, `DodecahedronGeometry`, `BoxGeometry`, custom `BufferGeometry`, or a glTF mesh.
2. Use a perspective camera so the object has depth and scale.
3. Use PBR material: `MeshStandardMaterial` or `MeshPhysicalMaterial`.
4. Tune `metalness`, `roughness`, and `emissive` to match the brand mood.
5. Light the object with at least one directional light plus ambient or hemisphere fill.
6. Animate transforms only: subtle rotation, bobbing, or parallax.
7. Handle resize and dispose geometry/material/renderer on teardown.

## HTML And CSS

```html
<div class="webgl-object-shell">
  <canvas class="webgl-object-canvas" data-webgl-3d-object></canvas>
</div>
```

```css
.webgl-object-shell {
  position: relative;
  width: min(100%, 720px);
  aspect-ratio: 1 / 1;
}

.webgl-object-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}
```

## Three.js Object Recipe

```js
import * as THREE from "three";

function initWebGL3DObject(canvas, options = {}) {
  if (!canvas) return () => {};

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, options.maxDpr || 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = options.exposure || 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0.15, 5.2);

  const geometry = new THREE.IcosahedronGeometry(options.radius || 1.35, options.detail || 1);
  const material = new THREE.MeshStandardMaterial({
    color: options.color || 0x8aa4ff,
    metalness: options.metalness ?? 0.48,
    roughness: options.roughness ?? 0.34,
    emissive: options.emissive || 0x101833,
    emissiveIntensity: options.emissiveIntensity ?? 0.22,
    flatShading: true,
  });

  const object = new THREE.Mesh(geometry, material);
  object.castShadow = true;
  object.receiveShadow = true;
  scene.add(object);

  const ambient = new THREE.AmbientLight(0xffffff, 0.38);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0xffffff, 2.15);
  key.position.set(3.4, 4.2, 4.8);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key);

  const rim = new THREE.DirectionalLight(options.rimColor || 0x7dd3fc, 0.82);
  rim.position.set(-4.2, 1.2, -2.8);
  scene.add(rim);

  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(5.2, 5.2),
    new THREE.ShadowMaterial({ opacity: 0.18 })
  );
  shadowPlane.position.set(0, -1.65, 0);
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.receiveShadow = true;
  scene.add(shadowPlane);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let rafId = 0;

  function resize() {
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, options.maxDpr || 1.75));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function render(time = 0) {
    const t = time * 0.001;
    object.rotation.x = -0.16 + Math.sin(t * 0.45) * 0.06;
    object.rotation.y = t * 0.28;
    object.rotation.z = Math.sin(t * 0.32) * 0.08;
    object.position.y = reduceMotion ? 0 : Math.sin(t * 0.8) * 0.08;

    renderer.render(scene, camera);
    if (!reduceMotion) rafId = requestAnimationFrame(render);
  }

  function handleResize() {
    cancelAnimationFrame(rafId);
    resize();
    render();
  }

  resize();
  render();
  window.addEventListener("resize", handleResize);

  return () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener("resize", handleResize);
    geometry.dispose();
    material.dispose();
    shadowPlane.geometry.dispose();
    shadowPlane.material.dispose();
    renderer.dispose();
  };
}

const cleanupObject = initWebGL3DObject(
  document.querySelector("[data-webgl-3d-object]"),
  {
    color: 0x8aa4ff,
    rimColor: 0x7dd3fc,
    metalness: 0.48,
    roughness: 0.34,
    emissive: 0x101833,
  }
);
```

## Material Defaults
- Premium metal: `metalness: 0.45-0.7`, `roughness: 0.25-0.45`.
- Soft ceramic: `metalness: 0.0-0.15`, `roughness: 0.38-0.62`.
- Glow-tinted tech object: low `emissive` with `emissiveIntensity: 0.12-0.35`.
- Faceted object: set `flatShading: true`; smooth product object: set it to `false`.

## Lighting Defaults
- Key light: directional, high front-side angle, strongest source.
- Ambient fill: low intensity so shadows stay visible.
- Rim light: brand-tinted or cool light from behind to reveal edges.
- Shadows: enable only when the object needs grounded depth; keep map size moderate.

## Motion Defaults
- Rotation: slow, continuous, and secondary to the page content.
- Floating: `0.04` to `0.12` units on Y.
- Reduced motion: render a still frame or only allow direct interaction.
- Avoid camera movement unless the object is the main interaction.

## Avoid
- CSS 3D transforms pretending to be WebGL.
- Unlit materials when the ask is real lighting and depth.
- Flat planes with gradients instead of actual geometry.
- Strong bloom or particles that hide the form.
- High DPR, huge shadow maps, or too many lights on mobile.
- Letting the object compete with foreground copy or CTAs.

## Quick Checks
- The object has visible form, edges, highlights, and shadows.
- The material uses `metalness`, `roughness`, and optional `emissive`.
- Directional and ambient lights are both present.
- The camera is perspective, not orthographic by accident.
- Resize does not stretch the object.
- Geometry, material, event listeners, RAF, and renderer are cleaned up.


---

## webgl-landing-steering

---
name: webgl-landing-steering
description: Use when creating or refining WebGL-heavy landing pages and you need to steer toward a specific visual outcome (premium, technical, playful, cinematic) while balancing conversion clarity, performance, and implementation complexity.
---

# WebGL Landing Steering Skill

## Use this skill to steer outcomes
Map landing-page goal to WebGL direction before writing code.

### 1) Define the page intent
Identify the primary conversion and brand signal:
- Premium / luxury / minimal confidence
- Technical / infrastructure / data authority
- Playful / consumer / social energy
- Cinematic / launch / storytelling impact

Also capture:
- Device mix (desktop-heavy vs mobile-heavy)
- Motion tolerance (`prefers-reduced-motion` policy)
- Production constraints (deadline, team skill, maintenance budget)

### 2) Choose the WebGL lane
Pick one dominant lane; avoid mixing 3-4 heavy effects in the hero.

#### Lane A: Subtle depth field (high conversion safety)
Use for: SaaS, productivity, B2B tools where readability wins.
- Visuals: soft gradient meshes, slow parallax planes, light bloom
- Motion: low amplitude, always secondary to copy
- Stack: Three.js plane shaders or lightweight shader canvas
- Rule: hero text contrast and CTA prominence first

#### Lane B: Data/particle intelligence (technical credibility)
Use for: AI, infra, analytics, developer products.
- Visuals: particle flows, node networks, vector fields, wireframes
- Motion: purposeful directional flow toward CTA area
- Stack: Three.js + custom shader/points, optionally GPGPU for dense fields
- Rule: communicate "system behavior," not random sparkles

#### Lane C: Object-centric 3D product moment (feature clarity)
Use for: hardware, apps with strong product visuals, launches.
- Visuals: central GLTF model, controlled camera orbit, material highlights
- Motion: interaction-driven or timeline-based reveal
- Stack: Three.js + GLTF/DRACO/KTX2 pipeline
- Rule: one hero object, short loop, fast first meaningful paint fallback

#### Lane D: Immersive cinematic scene (brand campaign)
Use for: campaign pages where wow factor is the main KPI.
- Visuals: volumetrics, heavy postprocessing, dense scene composition
- Motion: choreographed sequence with scroll chapters
- Stack: Three.js + postprocessing + optional GSAP ScrollTrigger
- Rule: provide a static/mobile fallback and strict performance gates

### 3) Steering matrix by landing page type
- Waitlist / pre-launch: Lane A or B. Keep copy legible and quick to load.
- Product feature page: Lane A or C. Demonstrate product truth, not abstract noise.
- Pricing / high-intent page: Mostly Lane A. Keep WebGL decorative only.
- Enterprise trust page: Lane B with restrained palette and low noise.
- Consumer app growth page: Lane B with playful palette, but cap CPU/GPU load.
- Campaign microsite: Lane C or D with explicit fallback for lower-end devices.

### 4) Quality gates before shipping
Pass these gates before adding more visual complexity:

1. Message gate:
- Hero headline + CTA readable in under 3 seconds.
- WebGL never blocks understanding of offer.

2. Performance gate:
- Cap pixel ratio: `Math.min(devicePixelRatio, 1.5-2)`.
- Target stable frame time on common mobile devices.
- Lazy-load heavy assets; show immediate non-WebGL poster/fallback.

3. Accessibility gate:
- Respect `prefers-reduced-motion` (still frame or low-motion mode).
- Maintain color contrast over animated backgrounds.

4. Reliability gate:
- Handle context loss and resize.
- Dispose geometries/materials/textures in SPA route changes.

### 5) Implementation strategy by risk
- Low risk (fastest): CSS + canvas illusion, minimal shaders
- Medium risk: Three.js scene with 1-2 meshes, lightweight post FX
- High risk: multi-pass shaders, dense particles, advanced postprocessing

Default to low/medium risk for conversion pages unless user explicitly asks for campaign-grade immersion.

### 6) Prompting template for Codex-style execution
Use this prompt pattern when asked to build a WebGL landing hero:

"Build a [lane] WebGL hero for a [page type] with [brand adjectives].
Primary goal: [conversion].
Constraints: [device mix], [performance budget], [reduced motion policy].
Implement fallback first, then enhance with WebGL.
Keep hero copy clarity as priority over visual complexity."

### 7) Common failure patterns and corrections
- Failure: "Looks cool but conversion dropped."
  - Fix: reduce motion amplitude, darken/soften background, raise CTA contrast.
- Failure: "Mobile stutters."
  - Fix: reduce particle count, lower DPR cap, remove expensive postprocessing.
- Failure: "Visual style feels generic."
  - Fix: pick one signature motif aligned to brand (grid, wave, orbit, shards).
- Failure: "Team cannot maintain shader complexity."
  - Fix: simplify to modular Three.js scene with documented parameters.

## Output format when applying this skill
Return:
1. Recommended lane and why
2. Visual spec (palette, motion behavior, composition)
3. Technical stack and complexity tier
4. Fallback behavior
5. Performance + accessibility checklist
6. Build order (MVP first, enhancement second)


---

## webgl-laser

---
name: webgl-laser
description: Create a fixed full-screen WebGL laser background effect with a thin white-hot vertical core, restrained brand-colored halo, and soft smoky fog around the beam. Use only for laser background effects, not full page layout, copy, generic hero scenes, particles, or unrelated motion systems.
---

# WebGL Laser

## Scope
- Apply only to the laser background effect.
- Use a fixed full-screen canvas behind the DOM.
- Set `pointer-events: none` on the canvas.
- Keep page content in a higher stacking context.
- Match the halo and smoke to the page's primary or strongest accent color.

## Visual Target
- Thin vertical beam: crisp white-hot inner core, narrow colored halo.
- Atmospheric smoke: soft cloudy breakup concentrated around the beam.
- Dark cinematic field: restrained, brand-colored, and readable behind content.
- Slow pulse: glow breathes gently; no aggressive flicker or color cycling.
- Light blade feel: narrow and precise, never a thick neon pillar.

## Layering

```html
<canvas class="laser-canvas" data-webgl-laser></canvas>
<main class="page-content">
  ...
</main>
```

```css
.laser-canvas {
  position: fixed;
  inset: 0;
  z-index: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
}

.page-content {
  position: relative;
  z-index: 1;
}
```

## Brand Color
Use the product accent as the source color. The shader keeps the core near white and derives the halo/smoke from this color.

```js
function hexToRgb01(hex) {
  const clean = hex.replace("#", "").trim();
  const value = clean.length === 3
    ? clean.split("").map((char) => char + char).join("")
    : clean;

  return [
    parseInt(value.slice(0, 2), 16) / 255,
    parseInt(value.slice(2, 4), 16) / 255,
    parseInt(value.slice(4, 6), 16) / 255,
  ];
}

const accent = getComputedStyle(document.documentElement)
  .getPropertyValue("--brand-accent")
  .trim() || "#ff4d8d";
```

## Raw WebGL Setup
Prefer raw WebGL with a full-screen quad unless the active file already uses another renderer.

```js
const laserVertexShader = `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const laserFragmentShader = `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_color;
uniform float u_xOffset;
uniform float u_coreWidth;
uniform float u_glowWidth;
uniform float u_smokeDensity;

varying vec2 v_uv;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);

  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;

  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p *= 2.02;
    amplitude *= 0.5;
  }

  return value;
}

void main() {
  vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
  vec2 p = (v_uv - 0.5) * aspect;
  float x = p.x - u_xOffset;
  float distanceToBeam = abs(x);

  float core = exp(-pow(distanceToBeam / u_coreWidth, 2.0));
  float glow = exp(-pow(distanceToBeam / u_glowWidth, 1.45));
  float scatter = exp(-pow(distanceToBeam / (u_glowWidth * 5.5), 1.25));
  float pulse = 0.9 + 0.1 * sin(u_time * 1.15);

  vec2 fogUv = p * 3.1 + vec2(0.0, -u_time * 0.035);
  fogUv.x += sin(p.y * 3.5 + u_time * 0.11) * 0.14;
  float fogBase = fbm(fogUv);
  float fogFine = fbm(p * 8.0 + vec2(sin(u_time * 0.07) * 0.35, u_time * 0.05));
  float fog = smoothstep(0.30, 0.86, fogBase * 0.72 + fogFine * 0.28);
  float smoke = fog * scatter * u_smokeDensity;

  vec3 brand = clamp(u_color, 0.0, 1.0);
  vec3 haloColor = mix(brand, vec3(1.0), 0.16);
  vec3 smokeColor = mix(brand, vec3(0.55), 0.28) * 0.55;
  vec3 hotCore = vec3(1.0, 0.96, 0.90);

  vec3 color = vec3(0.006, 0.007, 0.010);
  color += smokeColor * smoke;
  color += haloColor * glow * 0.46 * pulse;
  color += hotCore * core * 1.35;

  float vignette = smoothstep(1.25, 0.18, length(p));
  color *= vignette;

  float alpha = clamp(smoke * 0.72 + glow * 0.68 + core, 0.0, 1.0);
  gl_FragColor = vec4(color, alpha);
}
`;
```

## Initializer
Keep `u_resolution` synced on resize and animate through `u_time`.

```js
function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) || "Shader compile failed");
  }

  return shader;
}

function createProgram(gl, vertexSource, fragmentSource) {
  const program = gl.createProgram();
  gl.attachShader(program, createShader(gl, gl.VERTEX_SHADER, vertexSource));
  gl.attachShader(program, createShader(gl, gl.FRAGMENT_SHADER, fragmentSource));
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || "Program link failed");
  }

  return program;
}

function initWebGLLaser(canvas, options = {}) {
  if (!canvas) return () => {};

  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    premultipliedAlpha: false,
  });

  if (!gl) return () => {};

  const program = createProgram(gl, laserVertexShader, laserFragmentShader);
  const positionBuffer = gl.createBuffer();
  const positions = new Float32Array([
    -1, -1,
     1, -1,
    -1,  1,
    -1,  1,
     1, -1,
     1,  1,
  ]);

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
  gl.useProgram(program);

  const positionLocation = gl.getAttribLocation(program, "a_position");
  const uniforms = {
    resolution: gl.getUniformLocation(program, "u_resolution"),
    time: gl.getUniformLocation(program, "u_time"),
    color: gl.getUniformLocation(program, "u_color"),
    xOffset: gl.getUniformLocation(program, "u_xOffset"),
    coreWidth: gl.getUniformLocation(program, "u_coreWidth"),
    glowWidth: gl.getUniformLocation(program, "u_glowWidth"),
    smokeDensity: gl.getUniformLocation(program, "u_smokeDensity"),
  };

  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const color = options.color || hexToRgb01(accent);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let width = 1;
  let height = 1;
  let rafId = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, options.maxDpr || 1.5);
    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function render(time = 0) {
    gl.useProgram(program);
    gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
    gl.uniform1f(uniforms.time, time * 0.001);
    gl.uniform3f(uniforms.color, color[0], color[1], color[2]);
    gl.uniform1f(uniforms.xOffset, options.xOffset || 0.0);
    gl.uniform1f(uniforms.coreWidth, options.coreWidth || 0.0045);
    gl.uniform1f(uniforms.glowWidth, options.glowWidth || 0.035);
    gl.uniform1f(uniforms.smokeDensity, options.smokeDensity || 0.52);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    if (!reduceMotion) rafId = requestAnimationFrame(render);
  }

  function handleResize() {
    resize();
    render();
  }

  resize();
  render();
  window.addEventListener("resize", handleResize);

  return () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener("resize", handleResize);
    gl.deleteBuffer(positionBuffer);
    gl.deleteProgram(program);
  };
}

const cleanupLaser = initWebGLLaser(document.querySelector("[data-webgl-laser]"), {
  color: hexToRgb01(accent),
  xOffset: 0.0,
  coreWidth: 0.0045,
  glowWidth: 0.035,
  smokeDensity: 0.52,
  maxDpr: 1.5,
});
```

## Tuning Knobs
- Beam position: adjust `xOffset`; keep it in aspect-correct centered UV space.
- Beam thickness: tune `coreWidth` separately from `glowWidth`; keep the core extremely thin.
- Color: derive `color` from the brand accent, then soften halo and smoke in shader.
- Smoke density: tune `smokeDensity`, FBM scale, drift speed, scatter width, and edge falloff.
- Performance: reduce FBM octaves or cap `maxDpr` before changing the visual structure.

## Taste Rules
- The hottest beam core stays near white.
- The halo and fog use the design's primary or strongest accent color.
- Smoke blooms near the beam and dissipates outward.
- Pulse affects glow only; avoid rapid flicker.
- Content readability wins over bloom, haze, or cinematic drama.

## Avoid
- Hardcoding blue when the design uses another primary color.
- Making the beam thick enough to read as a glowing bar.
- Generic full-screen fog that is not concentrated around the beam.
- Turning the effect into a Three.js scene, particle explosion, or multicolor neon background.
- Letting the canvas intercept pointer events.
- Dense fog or extreme bloom that washes out foreground UI.


---

## background-grid-webgl

---
name: background-grid-webgl
description: "Create a perspective WebGL background grid with fading lines, subtle particle haze, slow forward drift, and gentle camera parallax."
---

# Background Grid WebGL Skill

## Use When
- Create a perspective WebGL background grid with fading lines, subtle particle haze, slow forward drift, and gentle camera parallax.

## Workflow

## Scope
- Apply this only to the immersive background grid layer, not to the full page layout, copy, or unrelated particle or laser systems.
- Use it when the design needs a perspective tech grid receding into space with subtle motion and depth.

## Visual target
- Create a large perspective ground-plane grid viewed from an elevated camera angle so the lines recede toward the horizon.
- Keep the grid understated and atmospheric: thin lines, soft fade with distance, dark background, and restrained glow rather than a loud retro neon floor.
- Add a light field of floating particles or dust to give the scene depth without overpowering the grid.
- Use the design's primary color or strongest accent color sparingly for glow, particles, or secondary emphasis. If the design is neutral, a white or cool gray grid is acceptable.

## Implementation guidance
- Prefer Three.js or equivalent real WebGL rendering for this effect.
- Use a perspective camera positioned above the plane and looking toward the origin to emphasize depth.
- Build the grid as a large plane helper or custom grid with line opacity fading by distance so the far field dissolves smoothly.
- Animate the grid with slow forward drift or repeated positional cycling so it feels alive without becoming distracting.
- Add subtle mouse-responsive camera parallax or offset, but keep the movement calm and damped.
- Add a sparse additive particle field with low opacity and slow motion to soften the empty space around the grid.

## Tuning knobs
- Grid density: control plane size, division count, and line spacing.
- Fade: adjust opacity falloff so the grid recedes naturally into darkness.
- Motion: tune forward drift speed, particle float speed, and camera smoothing.
- Camera: adjust height, distance, tilt, and parallax strength to control perspective drama.
- Color: keep the base grid subtle and use the active design accent only as a restrained highlight.

## Avoid
- Bright synthwave neon grids unless the design explicitly calls for that style.
- Thick linework or high-contrast grids that compete with foreground content.
- Dense particles or fog that obscure the grid structure.
- Aggressive mouse tracking or fast grid motion that makes the background feel unstable.


---

## globe-gl

---
name: globe-gl
description: Use when implementing globe.gl (Globe.GL) for 3D globe data visualization with WebGL/ThreeJS, including setup, data layers (points, arcs, polygons, labels), and integration patterns in plain HTML or React.
---

# Globe.GL Skill

## Workflow
1. Confirm environment (plain HTML, framework, React bindings) and the data layers needed.
2. Provide a minimal quick-start snippet plus the layer-specific fields.
3. Add interactions or extra layers only if requested.
4. Call out container sizing and performance considerations.

## Quick start (ESM)
```html
<script type="module">
  import Globe from 'globe.gl';

  const myGlobe = new Globe(document.getElementById('globe'))
    .globeImageUrl(myImageUrl)
    .pointsData(myData);
</script>
```

## Quick start (script tag)
```html
<script src="//cdn.jsdelivr.net/npm/globe.gl"></script>
<script>
  const myGlobe = new Globe(document.getElementById('globe'))
    .globeImageUrl(myImageUrl)
    .pointsData(myData);
</script>
```

## Common layers to mention
- Points
- Arcs
- Polygons
- Paths
- Heatmaps and hex bins
- Labels or HTML elements
- 3D objects and custom layers

## Practical tips
- Size the container with CSS; the globe fills its parent element.
- Reduce point count or size for performance on mobile.
- Use a darker globe texture for neon-style data overlays.

## Questions to ask when specs are missing
- Which layers do you need (points, arcs, polygons, labels)?
- What should the globe size be on desktop vs mobile?
- Do you want drag/rotate interactions or a static globe?
- Is this plain HTML, React (`react-globe.gl`), or another framework?


---

## globe-particles

---
name: globe-particles
description: Create a globe-like 3D particle visualization with a dense luminous spherical core and thinner orbital ring or flattened disc. Use when a design needs a premium planetary, orbital, synthesized data-globe effect rendered with real WebGL/Three.js particles, not generic starfields or full page layout changes.
---

# Globe Particles

## Scope
- Apply only to a globe-like 3D particle visualization.
- Do not change full page layout, copy, or unrelated motion systems.
- Use for planetary, orbital, infrastructure, or synthesized data-globe effects.
- Keep the core neutral or white-hot and derive ring/glow accents from the design's primary color.

## Visual Target
- Dense spherical core of luminous points.
- Thinner outer orbital ring or flattened disc around the sphere.
- Clear globe silhouette with tilt, depth, and layered particle density.
- Dark atmospheric background, restrained glow, clean structure, and subtle sci-fi depth.
- Premium and cinematic, not playful or noisy.

## HTML And CSS

```html
<div class="globe-particles-shell">
  <canvas class="globe-particles-canvas" data-globe-particles></canvas>
</div>
```

```css
.globe-particles-shell {
  position: relative;
  width: min(100%, 760px);
  aspect-ratio: 1 / 1;
}

.globe-particles-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  pointer-events: none;
}
```

## Particle Shader
Use circular shader points so particles stay crisp and luminous.

```js
const globeParticleVertex = `
attribute float a_size;
attribute float a_layer;

uniform float u_time;
uniform float u_pointSize;

varying float v_layer;
varying float v_depth;
varying float v_falloff;

void main() {
  vec3 pos = position;
  float breathe = 1.0 + sin(u_time * 0.65 + a_layer * 4.0) * 0.012;
  pos *= breathe;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = u_pointSize * a_size * (1.0 / max(0.18, -mvPosition.z));
  gl_Position = projectionMatrix * mvPosition;

  v_layer = a_layer;
  v_depth = smoothstep(-1.8, 1.8, pos.z);
  v_falloff = smoothstep(2.45, 0.25, length(pos));
}
`;

const globeParticleFragment = `
precision highp float;

uniform vec3 u_coreColor;
uniform vec3 u_accentColor;

varying float v_layer;
varying float v_depth;
varying float v_falloff;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  float alpha = smoothstep(0.5, 0.0, d);
  alpha *= alpha;

  vec3 color = mix(u_coreColor, u_accentColor, smoothstep(0.35, 1.0, v_layer));
  color += vec3(1.0) * v_depth * 0.08;
  color = mix(color * 0.42, color, clamp(v_falloff + v_layer * 0.28, 0.0, 1.0));
  alpha *= mix(0.52, 1.0, clamp(v_falloff + v_layer * 0.24, 0.0, 1.0));

  gl_FragColor = vec4(color, alpha);
}
`;
```

## Three.js Recipe

```js
import * as THREE from "three";

function hexToRgb01(hex) {
  const clean = hex.replace("#", "").trim();
  const value = clean.length === 3
    ? clean.split("").map((char) => char + char).join("")
    : clean;

  return new THREE.Color(
    parseInt(value.slice(0, 2), 16) / 255,
    parseInt(value.slice(2, 4), 16) / 255,
    parseInt(value.slice(4, 6), 16) / 255
  );
}

function buildGlobeParticleGeometry(options = {}) {
  const sphereCount = options.sphereCount || 2600;
  const ringCount = options.ringCount || 1300;
  const radius = options.radius || 1.35;
  const ringRadius = options.ringRadius || 2.05;
  const ringThickness = options.ringThickness || 0.12;
  const total = sphereCount + ringCount;

  const positions = new Float32Array(total * 3);
  const sizes = new Float32Array(total);
  const layers = new Float32Array(total);

  for (let i = 0; i < sphereCount; i++) {
    const z = Math.random() * 2 - 1;
    const theta = Math.random() * Math.PI * 2;
    const r = radius * (0.58 + Math.pow(Math.random(), 0.42) * 0.42);
    const root = Math.sqrt(1 - z * z);
    const index = i * 3;

    positions[index] = Math.cos(theta) * root * r;
    positions[index + 1] = Math.sin(theta) * root * r;
    positions[index + 2] = z * r;
    sizes[i] = 0.72 + Math.random() * 0.72;
    layers[i] = Math.random() * 0.28;
  }

  for (let i = 0; i < ringCount; i++) {
    const pointIndex = sphereCount + i;
    const angle = Math.random() * Math.PI * 2;
    const r = ringRadius + (Math.random() - 0.5) * ringThickness;
    const y = (Math.random() - 0.5) * ringThickness * 0.58;
    const index = pointIndex * 3;

    positions[index] = Math.cos(angle) * r;
    positions[index + 1] = y;
    positions[index + 2] = Math.sin(angle) * r;
    sizes[pointIndex] = 0.62 + Math.random() * 0.58;
    layers[pointIndex] = 0.72 + Math.random() * 0.28;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("a_size", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("a_layer", new THREE.BufferAttribute(layers, 1));
  return geometry;
}

function initGlobeParticles(canvas, options = {}) {
  if (!canvas) return () => {};

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, options.maxDpr || 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, options.cameraDistance || 5.6);

  const accent = options.accentColor
    ? new THREE.Color(options.accentColor)
    : hexToRgb01(getComputedStyle(document.documentElement).getPropertyValue("--brand-accent").trim() || "#8b5cf6");

  const geometry = buildGlobeParticleGeometry(options);
  const material = new THREE.ShaderMaterial({
    vertexShader: globeParticleVertex,
    fragmentShader: globeParticleFragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      u_time: { value: 0 },
      u_pointSize: { value: options.pointSize || 18 },
      u_coreColor: { value: new THREE.Color(options.coreColor || 0xf8fafc) },
      u_accentColor: { value: accent },
    },
  });

  const particles = new THREE.Points(geometry, material);
  particles.rotation.x = options.tiltX ?? -0.42;
  particles.rotation.z = options.tiltZ ?? 0.22;
  scene.add(particles);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pointer = new THREE.Vector2(0, 0);
  let rafId = 0;

  function resize() {
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, options.maxDpr || 1.6));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function handlePointerMove(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    pointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
  }

  function render(time = 0) {
    const t = time * 0.001;
    material.uniforms.u_time.value = t;

    const mouseStrength = options.mouseStrength ?? 0.08;
    const breath = reduceMotion ? 0 : Math.sin(t * 0.55) * 0.045;
    particles.rotation.y = t * (options.rotationSpeed || 0.12);
    particles.rotation.x = (options.tiltX ?? -0.42) + pointer.y * mouseStrength;
    particles.rotation.z = (options.tiltZ ?? 0.22) + pointer.x * mouseStrength;
    particles.scale.setScalar(1 + breath);

    renderer.render(scene, camera);
    if (!reduceMotion) rafId = requestAnimationFrame(render);
  }

  function handleResize() {
    cancelAnimationFrame(rafId);
    resize();
    render();
  }

  resize();
  render();
  window.addEventListener("resize", handleResize);
  window.addEventListener("pointermove", handlePointerMove);

  return () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener("resize", handleResize);
    window.removeEventListener("pointermove", handlePointerMove);
    geometry.dispose();
    material.dispose();
    renderer.dispose();
  };
}

const cleanupGlobe = initGlobeParticles(document.querySelector("[data-globe-particles]"), {
  sphereCount: 2600,
  ringCount: 1300,
  accentColor: "#8b5cf6",
  radius: 1.35,
  ringRadius: 2.05,
  rotationSpeed: 0.12,
  mouseStrength: 0.08,
});
```

## Tuning Knobs
- Density: tune `sphereCount` and `ringCount` separately.
- Scale: tune `radius`, `ringRadius`, `ringThickness`, and `cameraDistance`.
- Color: keep `coreColor` neutral; derive `accentColor` from the brand primary.
- Motion: tune `rotationSpeed`, `tiltX`, `tiltZ`, `mouseStrength`, and breathing amplitude.
- Glow: tune `pointSize`, additive blending, and particle count so the shape stays crisp.
- Performance: lower particle counts or cap `maxDpr` before changing the visual structure.

## Taste Rules
- The silhouette must read as a globe, not a loose starfield.
- The ring should feel orbital and tilted, not like a flat decorative underline.
- Use restrained glow; let density and depth create the premium feel.
- Keep mouse response gentle so the object drifts rather than swings.
- Put the globe over a dark background or inside a dark atmospheric shell.

## Avoid
- Generic starfield noise with no spherical structure.
- Oversized particles or bloom that destroys the globe silhouette.
- Hardcoded accent colors when the design has a clear primary color.
- Wild cursor interaction or fast spinning.
- Dense fog that turns the object into a blurry blob.

## Quick Checks
- Sphere and ring are distinct particle populations.
- Core reads mostly neutral or white-hot.
- Accent color appears on ring, highlights, or glow.
- Tilt reveals the ring and globe depth.
- Reduced motion renders a still or near-still object.
- Geometry, material, renderer, listeners, and RAF are cleaned up.


---

## dither-background

---
name: dither-background
description: Create a dark monochrome procedural background with enlarged square pixels and visible Bayer-style ordered dithering. Use when a page needs an atmospheric near-black dither field, broad organic waves or cloud masses, and restrained gray-white highlights behind framed UI, hero content, or data overlays.
---

# Dither Background

## Use When
- A dark interface needs an atmospheric monochrome background layer.
- The visual should show enlarged square pixels and visible ordered dithering.
- The design calls for organic waves, cloud-like masses, or procedural depth without colorful gradients.
- The background should support framed UI, hero content, or data overlays.

## Visual Target
- Near-black base with charcoal midtones, soft gray buildup, and occasional white highlights.
- Clearly visible square pixel cells, not tiny film grain.
- 4x4 Bayer-style dither pattern or equivalent ordered thresholding.
- Broad organic waves or cloud-like masses, not random TV noise.
- Vignetted edges so the brighter mass sits centrally or off-axis.

## HTML And CSS

```html
<canvas class="dither-background" data-dither-background></canvas>
```

```css
.dither-background {
  position: fixed;
  inset: 0;
  z-index: 0;
  width: 100vw;
  height: 100vh;
  background: #030303;
  pointer-events: none;
}

.page-content {
  position: relative;
  z-index: 1;
}
```

## Canvas Recipe
Use a real canvas when motion or procedural depth is needed.

```js
const BAYER_4X4 = [
   0,  8,  2, 10,
  12,  4, 14,  6,
   3, 11,  1,  9,
  15,  7, 13,  5,
].map((value) => (value + 0.5) / 16);

function smoothstep(edge0, edge1, value) {
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function noise2(x, y) {
  const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return value - Math.floor(value);
}

function valueNoise(x, y) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);

  const a = noise2(ix, iy);
  const b = noise2(ix + 1, iy);
  const c = noise2(ix, iy + 1);
  const d = noise2(ix + 1, iy + 1);
  return (
    a * (1 - ux) * (1 - uy) +
    b * ux * (1 - uy) +
    c * (1 - ux) * uy +
    d * ux * uy
  );
}

function fbm(x, y) {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;

  for (let octave = 0; octave < 4; octave++) {
    value += valueNoise(x * frequency, y * frequency) * amplitude;
    frequency *= 2.02;
    amplitude *= 0.5;
  }

  return value;
}

function initDitherBackground(canvas, options = {}) {
  if (!canvas) return () => {};

  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return () => {};

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cell = options.cellSize || 7;
  const maxDpr = options.maxDpr || 1.5;
  let width = 1;
  let height = 1;
  let cols = 1;
  let rows = 1;
  let rafId = 0;

  const palette = options.palette || [
    [3, 3, 3],
    [16, 16, 17],
    [34, 35, 37],
    [74, 75, 78],
    [168, 169, 171],
    [236, 236, 232],
  ];

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(width / cell);
    rows = Math.ceil(height / cell);
  }

  function sampleField(x, y, time) {
    const nx = (x / cols - 0.5) * 2;
    const ny = (y / rows - 0.5) * 2;
    const distance = Math.sqrt(nx * nx * 0.84 + ny * ny * 1.28);
    const vignette = 1 - smoothstep(0.18, 1.15, distance);
    const drift = reduceMotion ? 0 : time * 0.018;

    const wave =
      Math.sin(nx * 2.8 + ny * 1.2 + drift) * 0.18 +
      Math.sin(nx * -1.4 + ny * 3.8 - drift * 0.8) * 0.14;
    const cloud = fbm(nx * 1.35 + drift * 0.16, ny * 1.35 - drift * 0.08);
    const ridge = smoothstep(0.48, 0.92, cloud + wave);
    const offAxisMass = smoothstep(0.98, 0.18, Math.hypot(nx + 0.22, ny - 0.08));

    return Math.max(0, Math.min(1, ridge * vignette * 0.92 + offAxisMass * 0.18));
  }

  function render(time = 0) {
    const seconds = time * 0.001;
    ctx.fillStyle = "rgb(3,3,3)";
    ctx.fillRect(0, 0, width, height);

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const threshold = BAYER_4X4[(y % 4) * 4 + (x % 4)];
        const brightness = sampleField(x, y, seconds);
        const stepped = Math.floor(Math.max(0, Math.min(0.999, brightness + threshold * 0.18)) * palette.length);
        const color = palette[Math.min(palette.length - 1, stepped)];
        ctx.fillStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }

    if (!reduceMotion) rafId = requestAnimationFrame(render);
  }

  function handleResize() {
    cancelAnimationFrame(rafId);
    resize();
    render();
  }

  resize();
  render();
  window.addEventListener("resize", handleResize);

  return () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener("resize", handleResize);
  };
}

const cleanupDither = initDitherBackground(
  document.querySelector("[data-dither-background]"),
  {
    cellSize: 7,
    maxDpr: 1.5,
  }
);
```

## Tuning Knobs
- Cell size: `5px-10px`; larger cells make the Bayer matrix more legible.
- Palette: near-black, charcoal, soft gray, rare white highlights only.
- Shape: tune `wave`, `cloud`, `ridge`, and `offAxisMass` to create broad masses.
- Vignette: increase edge falloff when foreground readability needs more quiet.
- Motion: keep drift slow; use low time multipliers and avoid flicker.
- Performance: increase `cellSize` or cap `maxDpr` before simplifying the field.

## Composition Notes
- Put the canvas behind the interface with `pointer-events: none`.
- Use it as atmosphere behind framed UI, hero copy, or data overlays.
- Keep foreground contrast controlled and typography clean.
- Let one main bright mass define the composition; avoid even full-screen brightness.

## Avoid
- Rainbow gradients, colorful noise, or soft blurry blobs without dither structure.
- Tiny grain or static-like speckle where the square matrix disappears.
- Bright full-screen white noise that competes with foreground type.
- Random per-frame noise that flickers instead of drifting.
- Covering the entire viewport with equally bright cells.

## Quick Checks
- The square Bayer pattern is visible from normal viewing distance.
- The field forms broad organic waves or cloud masses.
- The palette stays monochrome and restrained.
- Edges recede into near-black.
- Foreground UI remains readable without heavy overlays.


---

## shaders-cursor-ripples

---
name: shaders-cursor-ripples
description: Add cursor-following fluid WebGPU distortion over an existing image with the Shaders library's ImageTexture and CursorRipples components. Use when a hero, gallery, or media panel needs a water-ripple mouse effect; when replacing a drifting CSS spotlight or flashlight reveal; or when a prompt says to borrow only the shader interaction from a Shaders.com reference while preserving the current brand, image, copy, and layout.
---

# Shaders Cursor Ripples

## Core Contract

1. Preserve the existing page, content, and semantic image.
2. Install `shaders` and import from the active framework subpath.
3. Render the source image through one `Shader` canvas.
4. Place `CursorRipples` after `ImageTexture` so it post-processes that image.
5. Keep `toneMapping="aces"` on the root.
6. Let Shaders track the cursor. Remove custom spotlight coordinates, radial masks, duplicated reveal images, and pointer animation loops.
7. Keep one real image beneath the canvas as the accessible loading and WebGPU fallback.
8. Disable the shader for reduced motion and unsupported WebGPU.
9. Lazy-load the shader code so the library does not inflate the initial page bundle.

When the user asks for only the shader effect, do not copy a reference's ribbon, blob, glow, typography, layout, copy, colors, or identity. Do not substitute the Shaders `Water` component: `CursorRipples` is the interactive image-displacement effect.

## Inspect Before Editing

- Find the real media wrapper, image URL, crop, overlays, z-index, and existing motion.
- Confirm the wrapper has a non-zero rendered width and height.
- Search for old reveal code such as `data-reveal-hover`, `mask-image: radial-gradient`, duplicated images, `requestAnimationFrame`, and manual pointer listeners.
- Preserve unrelated parallax or entrance motion unless it conflicts with the shader canvas.
- Check the installed `shaders` version and current framework API when the package may have changed.

## Install

```bash
npm install shaders
```

Import from `shaders/react`, `shaders/vue`, `shaders/svelte`, or `shaders/solid`. For Vite projects, never add `shaders` to `optimizeDeps.exclude`; its CommonJS dependencies need Vite pre-bundling. No `optimizeDeps` entry is normally required.

Before a commercial release, verify the current Shaders license terms.

## Required Composition

Keep the component order and values below:

```tsx
<Shader toneMapping="aces">
  <ImageTexture url={imageUrl} objectFit="cover" />
  <CursorRipples decay={7.3} radius={0.6} />
</Shader>
```

Use this as the baseline before tuning `intensity`, `chromaticSplit`, or `edges`. Do not add `SolidColor`, `Blob`, `Form3D`, `GaborNoise`, `Glow`, or another generator unless the user explicitly requests the reference's generated artwork.

For React, copy and adapt [assets/react/cursor-ripple-shader.tsx](assets/react/cursor-ripple-shader.tsx) and [assets/react/cursor-ripple-media.css](assets/react/cursor-ripple-media.css).

## Client and Fallback Pattern

Mount the shader only after the browser confirms WebGPU and motion is allowed:

```tsx
const CursorRippleShader = lazy(() => import("./cursor-ripple-shader"));

const [shaderEnabled, setShaderEnabled] = useState(false);
const [shaderReady, setShaderReady] = useState(false);

useEffect(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const sync = () => {
    const enabled = "gpu" in navigator && !reduceMotion.matches;
    setShaderEnabled(enabled);
    if (!enabled) setShaderReady(false);
  };

  sync();
  reduceMotion.addEventListener("change", sync);
  return () => reduceMotion.removeEventListener("change", sync);
}, []);
```

Keep the semantic image in the wrapper, then overlay the lazy shader:

```tsx
<figure className="cursor-ripple-media">
  <img
    className="cursor-ripple-media__fallback"
    src={imageUrl}
    alt={meaningfulAlt}
    width={width}
    height={height}
  />

  {shaderEnabled ? (
    <Suspense fallback={null}>
      <CursorRippleShader
        imageUrl={imageUrl}
        ready={shaderReady}
        onReady={() => setShaderReady(true)}
      />
    </Suspense>
  ) : null}
</figure>
```

For Next.js, an `ssr: false` dynamic import is also valid. Do not hide the fallback until the shader calls `onReady`; a failed WebGPU initialization must leave the page legible and complete.

## Layering Rules

- Give the media wrapper `position: relative`, a definite size, `overflow: hidden`, and `isolation: isolate`.
- Keep the fallback at z-index `0` and the canvas at z-index `1`.
- Fill the wrapper with `position: absolute; inset: 0; width: 100%; height: 100%`.
- Set the shader layer to `pointer-events: none`; Shaders listens globally and converts pointer coordinates using the canvas bounds.
- Mark the shader wrapper `aria-hidden="true"`; the fallback image owns the accessible name.
- Place copy, links, and controls above the canvas so the effect never intercepts interaction.
- Preserve the same crop between the fallback and `ImageTexture`. Use `objectFit="cover"` for full-bleed media.

## Remove the Failed Spotlight Pattern

Delete the old implementation rather than leaving it hidden:

- second reveal image;
- radial `mask-image` and custom reveal variables;
- smoke or blur overlays tied to pointer position;
- component-local `requestAnimationFrame` pointer easing;
- `pointerenter`, `pointermove`, `pointerleave`, and resize bookkeeping created only for the flashlight;
- coarse-pointer rules that reference the retired reveal layers.

Keeping both systems causes coordinate drift, extra GPU work, and confusing fallbacks.

## Performance and Motion

- Lazy-load the shader module behind the WebGPU check.
- Keep exactly one shader canvas for the media panel.
- Use the library's `onReady` callback for a short opacity handoff.
- Use `disableTelemetry` when telemetry is not required.
- Do not animate the canvas size; animate a stable parent if parallax is needed.
- Disable or unmount the shader under `prefers-reduced-motion: reduce`.
- Keep touch layouts usable with the static image; never put essential information inside the effect.

## Verification

Run the project's lint, production build, rendered tests, and `git diff --check`. Then verify in a real browser:

1. Confirm exactly one `canvas[data-renderer="shaders"]` exists.
2. Confirm the shader reaches its ready class and the fallback image remains present.
3. Sweep the pointer across several points in the media. The distortion must follow that path without a detached circle.
4. Confirm links and controls remain clickable.
5. Confirm no console errors or warnings occur.
6. Confirm the static image remains when WebGPU is unavailable or reduced motion is enabled.
7. Confirm the old `data-reveal-hover` or radial-mask layer is absent.
8. Check mobile and desktop crops after the canvas initializes.

## Failure Diagnosis

- **Canvas exists but is blank:** verify the wrapper has non-zero dimensions and the image URL is same-origin or CORS-readable.
- **Image renders but does not ripple:** keep `CursorRipples` after `ImageTexture`; it requires a child/input surface.
- **Ripple is offset:** remove manual pointer transforms and check whether a transformed ancestor changes the canvas bounds.
- **Page crashes during SSR:** move the shader into a client-only, lazy-loaded component.
- **Image flashes on load:** retain the fallback and fade the shader in only from `onReady`.
- **Initial bundle becomes large:** confirm the Shaders import lives only inside the lazy module.
- **Effect blocks buttons:** keep the canvas pointer-transparent and controls in a higher stacking layer.

## Handoff

Report the affected media, Shaders package version, fallback behavior, reduced-motion behavior, build/test results, and live interaction verification. Distinguish a locally ready effect from a published deployment.


---

## add-shader-cursor-trail

---
name: add-shader-cursor-trail
description: "Add the Shaders WebGPU mouse effect used for the Tidal Commons hero: a white twinkling halftone cursor trail driven by ChromaFlow, masked through a DotGrid, finished with chromatic ripples and film grain, and protected by static, touch, accessibility, SSR, and performance fallbacks. Use when a user asks for this shader mouse effect, a halftone cursor trail, an interactive WebGPU hero/contact background, or a reusable cursor-following shader layer in React, Next.js, Vue, Svelte, Solid, or plain web projects."
---

# Add Shader Cursor Trail

Implement the exact trail as progressive enhancement. Preserve the host section's semantic content, imagery, controls, and static first frame.

## Workflow

1. Inspect the framework, rendering mode, existing motion stack, layer order, reduced-motion rules, and package manager. Do not add another smooth-scroll engine or replace the section's content.
2. Install `shaders` with the existing package manager. Import from the matching framework subpath: `shaders/react`, `shaders/vue`, `shaders/svelte`, or `shaders/solid`.
3. Read [references/implementation.md](references/implementation.md) before implementation. Keep the six shader nodes, their order, both invisible drivers, and both ID linkages exact.
4. For React or Next.js, copy and adapt the files in `assets/react/`. Keep the lightweight capability gate separate from the heavy shader module so ineligible visitors do not request the shader bundle.
5. Place one full-bleed, `aria-hidden="true"` shader layer behind the section content. Keep links and controls above it. Do not set `pointer-events: none` on the canvas unless cursor tracking is verified to use global events.
6. Gate loading on WebGPU, a fine hover pointer, normal motion/transparency preferences, document visibility, window focus, and section intersection. Unmount when the section leaves view so GPU work stops.
7. Keep the original image or dark background as the complete fallback. Hide the layer for reduced motion, reduced transparency, coarse/no-hover pointers, and forced colors.
8. Adapt only presentation variables such as opacity and blend mode. Do not change the graph to decorative noise, add WebGL/Three.js, or hotlink Shaders preview assets.

## Validate

Run the project's lint, typecheck/tests, and production build. For React implementations, also run:

```bash
node /path/to/add-shader-cursor-trail/scripts/verify-cursor-trail.mjs \
  path/to/CursorTrailShader.tsx \
  path/to/CursorTrailGate.tsx \
  path/to/cursor-trail.css
```

Verify the static section with JavaScript unavailable, keyboard access to content above the layer, touch behavior, reduced motion, unsupported WebGPU, focus/visibility cleanup, and absence of runtime requests to `previews.shaders.com` or `data.shaders.com`.

Report the chosen blend mode, fallback, capability gates, production-build result, and any browser limitation. Do not claim WebGPU visual verification unless it was actually performed in a compatible browser.


---

## thinking-orbs

---
name: thinking-orbs
description: Add accessible animated AI loading and agent-status indicators with the React thinking-orbs library. Use when a chat, copilot, voice, search, generation, or tool-running interface needs a semantic working, searching, solving, listening, composing, or shaping state; when replacing a generic spinner with an AI activity orb; or when implementing the library's size, theme, speed, pause, reduced-motion, and canvas behavior.
---

# Thinking Orbs

## Core Contract

1. Use `thinking-orbs` in React 18+ interfaces that need indeterminate AI activity feedback.
2. Map the real product lifecycle to one of the six shipped states.
3. Use only the tuned `20` or `64` pixel size. Do not stretch one preset into another.
4. Keep `theme="auto"` unless the surrounding surface has a known fixed theme.
5. Pair the orb with concise visible status text when the activity matters to the user.
6. Override `aria-label` with a task-specific label, or hide the orb from assistive technology when adjacent live text already announces the same state.
7. Use `paused` to freeze the current frame. Do not simulate pause with `speed={0}`.
8. Treat the orb as indeterminate feedback, never as a progress percentage or completion signal.

The package renders monochrome dots on a transparent 2D canvas. It does not expose custom colors, arbitrary sizes, or determinate progress.

## Install

Inspect the project package manager, then install:

```bash
npm install thinking-orbs
```

The package declares `react` and `react-dom` version 18 or newer as peer dependencies. Import the component and exported types from the package root:

```tsx
import {
  ThinkingOrb,
  type OrbSize,
  type OrbState,
  type OrbTheme,
  type ThinkingOrbProps,
} from "thinking-orbs";
```

## Choose the State

- `working` — generic tool execution, multi-step work, or an activity without a more precise state.
- `searching` — retrieval, web search, file search, or knowledge lookup.
- `solving` — reasoning, analysis, calculation, or planning.
- `listening` — microphone input, speech capture, or waiting for a spoken turn.
- `composing` — writing, summarizing, drafting, or generating a text response.
- `shaping` — creating or refining an image, layout, structured artifact, or other formed output.

Prefer a truthful generic `working` state over a visually interesting but inaccurate state. Change the state only when the underlying activity changes.

## Choose the Size

- Use `size={20}` inline with text, inside buttons, or in compact status rows.
- Use `size={64}` at chat-avatar scale, in an empty state, or as the main visual status.

The presets have different dot counts, dot sizes, and speed tuning. They are separate designs rather than a scale factor. If the layout needs more surrounding space, size the wrapper instead of applying CSS transforms to the canvas.

## Basic Usage

```tsx
import { ThinkingOrb } from "thinking-orbs";

export function AgentStatus() {
  return (
    <ThinkingOrb
      state="searching"
      size={20}
      theme="auto"
      aria-label="Searching project files…"
    />
  );
}
```

All other canvas props pass through, including `className`, `style`, `data-*`, event handlers, and ARIA attributes.

## Model the Product Lifecycle

Keep product phases separate from visual states so the mapping stays explicit:

```tsx
import { ThinkingOrb, type OrbState } from "thinking-orbs";

type AgentPhase =
  | "idle"
  | "retrieving"
  | "reasoning"
  | "writing"
  | "creating"
  | "done"
  | "error";

const ORB_BY_PHASE: Partial<Record<AgentPhase, OrbState>> = {
  retrieving: "searching",
  reasoning: "solving",
  writing: "composing",
  creating: "shaping",
};

export function AgentActivity({ phase }: { phase: AgentPhase }) {
  const state = ORB_BY_PHASE[phase];
  if (!state) return null;

  return <ThinkingOrb state={state} size={20} />;
}
```

Remove the orb on `done`, `error`, cancellation, or idle. Show the appropriate result, retry, or error UI instead of leaving the last activity animation running.

## Announce Status Once

The component defaults to `role="img"` with a per-state label such as “Searching…”. When visible text describes the same state, make the text the single announcement source:

```tsx
export function LiveAgentStatus() {
  return (
    <div role="status" aria-live="polite" className="agent-status">
      <ThinkingOrb state="solving" size={20} aria-hidden="true" />
      <span>Reviewing the repository…</span>
    </div>
  );
}
```

Use `aria-live="polite"` for ordinary phase changes. Avoid rapid label churn. Do not add another hidden live region when `role="status"` already owns the announcement.

## Theme

Use one of:

```tsx
<ThinkingOrb theme="auto" />
<ThinkingOrb theme="dark" />
<ThinkingOrb theme="light" />
```

- `auto` first checks an ancestor `data-theme="dark|light"` attribute or `dark` / `light` class.
- If no ancestor theme exists, `auto` follows `prefers-color-scheme`.
- Theme changes update live.
- `dark` means light dots intended for a dark background.
- `light` means dark dots intended for a light background.

The canvas is transparent. Verify contrast against the actual surface rather than the page root alone.

## Speed and Pause

```tsx
<ThinkingOrb state="working" speed={0.85} />
<ThinkingOrb state="composing" paused={isWaitingForApproval} />
```

`speed` multiplies the baked speed of the selected state and size. Start at `1`; use roughly `0.75–1.25` for subtle product tuning. Extreme values can make the hand-tuned motion feel frantic or stalled.

`paused` freezes the current frame while retaining the visual status. Remove the component when the activity has actually ended.

## Next.js and Client Rendering

The component uses React effects, canvas, `requestAnimationFrame`, media queries, and observers. Keep the package import behind a client boundary in the Next.js App Router:

```tsx
"use client";

import { ThinkingOrb } from "thinking-orbs";

export function ThinkingStatus() {
  return <ThinkingOrb state="working" size={20} />;
}
```

The library is SSR-safe because it paints only on the client after resolving the theme. A client boundary is still required where the framework enforces server and client component separation.

## Built-In Runtime Behavior

- Draws with plain Canvas 2D arcs; no WebGL or SVG filters.
- Caps device pixel ratio at `2`.
- Uses one `requestAnimationFrame` loop per visible instance.
- Uses the shared `performance.now()` clock so multiple orbs stay in phase.
- Pauses when the canvas scrolls offscreen through `IntersectionObserver`.
- Pauses when the browser tab is hidden.
- Renders one deterministic static frame under `prefers-reduced-motion: reduce`.
- Continues following live theme changes in reduced-motion mode.

Do not rebuild these behaviors in a wrapper. Add product state management and layout around the component, not a second animation loop.

## Power-User Canvas API

Prefer `<ThinkingOrb>` for product UI. The package also exports its resolved presets and raw frame painters for a custom canvas outside React:

```ts
import { MODE_DRAWS, resolvePreset } from "thinking-orbs";

const { mode, speed, opts } = resolvePreset("searching", 64);
const drawFrame = MODE_DRAWS[mode];

drawFrame(
  context,
  64,
  (performance.now() / 1000) * speed,
  true, // true draws light ink for a dark surface
  opts,
);
```

`STATE_TO_MODE` exposes the internal mapping:

- `working` → `orbits`
- `searching` → `globe`
- `solving` → `rubik`
- `listening` → `wave`
- `composing` → `ribbon`
- `shaping` → `morph`

Use the raw API only when another renderer owns the canvas lifecycle. It provides a frame painter, not component behavior. Reimplement DPR sizing, clearing, animation scheduling, pausing, theme resolution, reduced motion, visibility handling, cleanup, and accessibility when bypassing `<ThinkingOrb>`.

## Verification

Run the project's typecheck, tests, production build, and `git diff --check`. Then verify in a real browser:

1. Trigger every product phase and confirm the mapped orb state is truthful.
2. Confirm `20` and `64` pixel instances are crisp without CSS scaling.
3. Test dark, light, and live theme switching.
4. Test reduced motion and confirm the orb becomes a static representative frame.
5. Scroll the orb offscreen and return; confirm it resumes without visible breakage.
6. Hide and restore the tab; confirm animation resumes.
7. Inspect accessibility: announce the status exactly once and use a task-specific label.
8. Confirm the orb disappears on success, error, cancellation, and idle.
9. Confirm no console errors, hydration warnings, or layout shifts occur.

## Common Pitfalls

- **Type error on size:** use exactly `20` or `64`; do not pass arbitrary dimensions.
- **Wrong contrast:** remember `dark` targets dark backgrounds and therefore draws light ink.
- **Duplicate screen-reader output:** hide the canvas when adjacent `role="status"` text already announces the task.
- **Misleading state:** do not show `searching` during generation or `composing` during microphone capture.
- **Permanent loading UI:** remove the orb when work ends and render the actual terminal state.
- **Hydration or server-component error:** move the import into a client component.
- **Brand color requested:** the public API is monochrome; choose another loader or make an intentional library fork instead of relying on unsupported styling.

## Handoff

Report the mapped product phases, chosen size, theme mode, accessible label strategy, reduced-motion behavior, and build/browser verification. Distinguish local implementation from a deployed release.


---

## gooey-blob-system

---
name: gooey-blob-system
description: "Create a gooey blob system using SVG filters where multiple shapes merge into a single fluid form. Use overlapping circles combined with a Gaussian blur and color matrix filter to produce a continuous, organic mass. The forms should visually fuse and separate based on proximity. Focus on filter-driven merging (blur + threshold effect), soft organic boundaries with no hard edges, multiple independent shapes behaving as one system, and smooth continuous motion that feels fluid and cohesive."
---

# Gooey Blob System Skill

## Use When
- A page needs organic fluid shapes that visually merge, separate, and move as one soft system.

## Workflow
1. Build the effect with SVG filters: Gaussian blur followed by a color matrix threshold.
2. Animate multiple overlapping circles or blobs so they approach and separate naturally.
3. Keep boundaries soft and continuous; the visual should feel fluid rather than like separate circles.
4. Use the blob system as a background accent, loader, cursor field, or hero atmosphere.
5. Tune blur, contrast, and shape spacing together so merging remains visible.

## Guardrails
- Do not fake gooey behavior with plain blurred circles that never merge.
- Do not add fast jittery motion; keep it smooth and cohesive.
- Provide a static or simplified fallback for low-motion contexts.


---

## liquid-metal-border

---
name: liquid-metal-border
description: Add and tune animated liquid-metal WebGL borders with the React `metal-fx` package. Use when buttons, icon controls, chips, tabs, cards, or selected surfaces need a metallic active, selected, hover, focus, or premium border; when implementing the MetalFx component from metal.jakubantalik.com; or when troubleshooting its presets, themes, strength, glow, reflections, sizing, radius, animation, accessibility, SSR, or performance.
---

# Liquid Metal Border

## Core Contract

1. Use `metal-fx` in React 18 or newer.
2. Wrap exactly one real host element such as a `button`, `a`, `div`, or `article`.
3. Keep the host semantic and interactive. `MetalFx` is visual framing, not the control.
4. Reserve the animated border for active, selected, focused, hovered, or primary surfaces. Do not put it around every control.
5. Keep a static CSS border or focus outline as the fallback. WebGL decoration must never carry essential state by itself.
6. Pause non-active instances and reduced-motion experiences.
7. Test light and dark modes independently. Reflections intentionally render only in dark mode.

## Inspect Before Editing

- Confirm the project uses React and has `react` and `react-dom` version 18 or newer.
- Find the real control, its dimensions, radius, background, border, outline, shadow, active-state source, and theme source.
- Decide whether the metal should be always visible or driven by `active`, `selected`, hover, or focus state.
- Check whether the project has a manual theme toggle. Use that state instead of `theme="auto"` when it does not follow the OS.
- Identify nearby elements that genuinely benefit from reflected light. Do not add reflections by default.
- Check the installed `metal-fx` version before relying on the prop surface below.

## Install and Import

Install with the project's package manager:

```bash
npm install metal-fx
# pnpm add metal-fx
# yarn add metal-fx
# bun add metal-fx
```

Import the named React component:

```tsx
import { MetalFx } from "metal-fx";
```

Do not import a stylesheet. The package injects its component styles. It supports ESM and CommonJS builds, is SSR-safe, and mounts the WebGL pipeline after hydration. In a Next.js App Router project, render it from a Client Component because the component uses client-side React hooks.

## Baseline Button

Start with a restrained border before adding reflections or custom shader geometry:

```tsx
import { MetalFx } from "metal-fx";

export function UpgradeButton() {
  return (
    <MetalFx
      variant="button"
      preset="chromatic"
      theme="auto"
      strength={0.85}
    >
      <button type="button">Upgrade to Pro</button>
    </MetalFx>
  );
}
```

The wrapper measures the child, paints the metal ring on top, and keeps the child interactive. Size the child normally with CSS, Tailwind, or inline styles.

## Active-State Pattern

Keep one mounted instance and drive its intensity from real component state. Use `aria-pressed`, `aria-selected`, or the native selected-state mechanism so the visual effect is not the only signal.

```tsx
"use client";

import { useEffect, useState } from "react";
import { MetalFx } from "metal-fx";

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);

    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return reduced;
}

export function LiquidMetalToggle({
  selected,
  onSelect,
}: {
  selected: boolean;
  onSelect: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const reducedMotion = useReducedMotion();
  const highlighted = selected || hovered || focused;

  return (
    <MetalFx
      className="liquid-metal-toggle"
      variant="button"
      preset="chromatic"
      strength={highlighted ? 0.9 : 0.14}
      paused={reducedMotion || !highlighted}
      disableGlow={reducedMotion || !highlighted}
      ringCssPx={selected ? 1.5 : 1}
      normalizeHostStyles={false}
    >
      <button
        type="button"
        className="liquid-metal-toggle__control"
        aria-pressed={selected}
        onClick={onSelect}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      >
        Auto
      </button>
    </MetalFx>
  );
}
```

```css
.liquid-metal-toggle {
  background: #18181b;
  border-radius: 999px;
}

.liquid-metal-toggle__control {
  min-height: 40px;
  padding: 0 18px;
  color: #fafafa;
  background: transparent;
  border: 0;
  border-radius: 999px;
  box-shadow: none;
}

.liquid-metal-toggle__control:focus-visible {
  outline: 2px solid #ffffff;
  outline-offset: 3px;
}
```

Use `paused` to stop non-active canvas updates; it freezes the last frame without hiding the ring. `strength` changes rendered opacity from `0` to `1` but does not slow the shader.

## Static Border and Card Pattern

Use the wrapper as the surface when the child must remain transparent:

```tsx
<MetalFx
  variant="button"
  preset="silver"
  theme="dark"
  strength={0.55}
  borderRadius={24}
  ringCssPx={1}
  shaderScale={1.45}
  disableGlow
  normalizeHostStyles={false}
  style={{ background: "#111318" }}
>
  <article className="feature-card">
    <h3>Realtime review</h3>
    <p>Keep feedback attached to the work.</p>
  </article>
</MetalFx>
```

Keep the article background transparent so it does not cover the ring. Use the child for content layout and the `MetalFx` wrapper for the visible surface.

## Complete Customization Surface

| Prop | Values and default | Use |
| --- | --- | --- |
| `children` | One React host element; required | Preserve the real button, link, chip, card, or icon control. |
| `variant` | `"button"` default, `"circle"` | Choose a 1 px pill-style baseline at shader scale `1.6`, or a 2 px compact-circle baseline at scale `1.3`. The measured child still controls the rendered size. |
| `preset` | `"chromatic"` default, `"silver"`, `"gold"` | Choose iridescent rainbow, cool steel, or warm gold. Each includes dark and light tuning. |
| `theme` | `"auto"` default, `"dark"`, `"light"` | Follow live `prefers-color-scheme` changes or pin the effect to the app theme. SSR starts dark, then resolves on the client. |
| `strength` | Number `0..1`; default `1` | Scale canvas and glow opacity. Use lower values for idle states and stronger values for active states. |
| `paused` | Boolean; default `false` | Freeze this instance on its current shader frame while keeping the silhouette visible. |
| `borderRadius` | Number in CSS pixels; optional | Override the radius. When omitted, read the child's computed radius on resize. |
| `normalizeHostStyles` | Boolean; default `true` | Remove the child's background, border, outline, and shadow so they do not fight the ring. Set `false` when preserving a custom focus outline or fallback border. |
| `reflectionTargets` | Array of React element refs; optional | Cast a soft mirrored reflection onto selected neighbouring elements. Dark mode only. |
| `disableGlow` | Boolean; default `false` | Remove the wandering halo while retaining the shader ring. |
| `shaderScale` | Number; variant baseline by default | Increase to zoom into larger metal pattern features; decrease to zoom out. |
| `ringCssPx` | Number; variant baseline by default | Override the visible ring thickness in CSS pixels. |
| `scale` | Number; default `1` | Scale every absolute-pixel engine constant together for CSS zoom or deliberately enlarged UI systems. |
| `className` | String; optional | Style the `MetalFx` wrapper, not the child. |
| `style` | React CSS properties; optional | Size or style the wrapper surface directly. |
| `ref` | React ref; optional | Access the forwarded wrapper `HTMLDivElement`. |

Other valid `HTMLDivElement` attributes are forwarded to the wrapper.

## Tuning Defaults

- Primary pill button: `variant="button"`, `strength={0.75}`, `ringCssPx={1}`.
- Selected tab or filter: idle strength `0.1–0.2`, selected strength `0.75–0.9`.
- Icon button: `variant="circle"`, explicit square child dimensions, `strength={0.7}`.
- Large card: `ringCssPx={1}`, `shaderScale={1.3–1.6}`, `disableGlow`.
- Premium CTA: start with `chromatic`; use `silver` for neutral UI and `gold` only for warm or luxury palettes.
- Quiet active state: disable glow before reducing the ring below legibility.
- Doubled design system: use `scale={2}` instead of independently doubling shader, ring, glow, and reflection values.

Keep `strength <= 0.9` for routine controls. Full-strength chromatic metal can dominate labels and icons.

## Sizing and Radius

Prefer sizing the child:

```tsx
<MetalFx variant="circle">
  <button style={{ width: 36, height: 36 }} aria-label="Send">
    ↑
  </button>
</MetalFx>
```

To make the frame larger than the child, size the wrapper and stretch the child:

```tsx
<MetalFx style={{ width: 44, height: 44 }} variant="circle">
  <button
    style={{ width: "100%", height: "100%" }}
    aria-label="Send"
  >
    ↑
  </button>
</MetalFx>
```

The wrapper uses `display: inline-flex`. Do not create cyclic percentage sizing where neither wrapper nor child has an intrinsic size.

## Proximity Reflections

Pass only explicit refs to neighbouring elements:

```tsx
import { useRef } from "react";

const chipRef = useRef<HTMLButtonElement>(null);

<>
  <button ref={chipRef}>Tools</button>
  <MetalFx variant="circle" reflectionTargets={[chipRef]}>
    <button aria-label="Send">↑</button>
  </MetalFx>
</>
```

Omit `reflectionTargets` to disable reflection work. In light mode, reflections are skipped automatically.

## Accessibility and Motion

- Preserve native `button`, `a`, and form semantics inside the wrapper.
- Keep active state in `aria-pressed`, `aria-selected`, checked state, or current-route state.
- Do not rely on hue or animation alone. Retain text, icon, position, weight, or a static edge change.
- Be careful with `normalizeHostStyles`. Its default removes the child's `outline`; set it to `false` and define transparent chrome plus `:focus-visible` when the control needs its own focus ring.
- Set `paused` for reduced motion. Also disable the wandering glow when its movement is unnecessary.
- Keep the effect pointer-transparent and verify the child remains clickable and keyboard-operable.
- Retain a plain CSS border or surface treatment for WebGL failure.

## Performance

`metal-fx` reuses one shared WebGL context, one compiled shader, and one animation loop across mounted instances. It also pauses offscreen copies with `IntersectionObserver` and debounces resize work through animation frames.

Still keep the effect selective:

- Mount it on primary or stateful surfaces, not whole grids of idle controls.
- Pause non-active instances.
- Omit reflections unless they add visible depth.
- Do not animate the wrapped element's dimensions continuously.
- Prefer `disableGlow` for restrained cards and dense toolbars.

## Verification

Run the project's lint, typecheck, production build, tests, and `git diff --check`. Then verify in the Codex browser:

1. Confirm the package is present in the manifest and lockfile.
2. Confirm one `.metal-fx-root` wraps one semantic host.
3. Test hover, pointer-down, selected, keyboard focus, and disabled states.
4. Confirm the active state is exposed semantically and remains clear with the effect hidden.
5. Confirm the focus ring is visible when `normalizeHostStyles` is enabled or disabled.
6. Check the measured size and radius at every responsive breakpoint.
7. Test the app's real light and dark themes; do not assume `auto` matches a manual toggle.
8. Enable reduced motion and confirm the shader stops moving.
9. Scroll the control offscreen and back; confirm the effect resumes without a blank frame.
10. Check console output for WebGL, hydration, resize, or ref errors.
11. Confirm neighbouring controls receive reflections only when explicitly targeted in dark mode.

## Failure Diagnosis

- **The ring is covered:** the child has an opaque background above the canvas. Use default normalization or make the child transparent and style the wrapper.
- **The focus ring disappeared:** `normalizeHostStyles` removed the child outline. Set it to `false` and reset only background, border, and shadow in project CSS.
- **The radius is wrong:** use a real computed radius on the child or pass `borderRadius` explicitly.
- **A circle looks soft or thin:** use `variant="circle"` and explicit square dimensions before increasing `ringCssPx`.
- **The pattern is too busy:** lower `strength`, disable glow, or use `silver`; do not immediately thicken the ring.
- **Reflections are missing in light mode:** expected behavior; reflections are dark-mode only.
- **The effect is the wrong physical size after zooming:** set `scale` to the UI scale instead of tuning each pixel constant independently.
- **The page crashes in a server component:** move the usage behind the framework's client-component boundary.
- **The border is blank on unsupported hardware:** keep the semantic control and CSS fallback complete; treat the WebGL ring as enhancement.

## Handoff

Report the installed `metal-fx` version, wrapped control, active-state source, preset, theme strategy, fallback border, reduced-motion behavior, build/test results, and Codex-browser verification. Distinguish local readiness from a deployed result.


---

## ambient-section-particles

---
name: ambient-section-particles
description: Add a restrained particle atmosphere inside one section with configurable shapes, density, gravity, wind, sway, rotation, recycling or settling, pointer disturbance, visibility pausing, responsive limits, and reduced-motion fallbacks. Use for petals, leaves, snow, sparks, confetti, dots, paper, icons, or brand fragments that support a section's mood without obscuring content.
---

# Ambient Section Particles

Build particles as a bounded atmosphere layer, not as a page-wide screensaver. Keep the content primary and stop work when the effect cannot be seen.

## Choose the renderer

- Use canvas for roughly 40 or more small particles, frequent motion, pointer forces, or simple procedural shapes.
- Use DOM or inline SVG for a small count of branded fragments that need individual styling or semantic labels.
- Use WebGL only for thousands of particles, depth, shaders, or real 3D behavior. Cap device pixel ratio and provide a static fallback.

Start with the least expensive renderer that preserves the desired shape language.

## Define one configuration

```js
const particles = {
  count: 54,
  gravity: 7,
  wind: -3,
  sway: 16,
  speed: [8, 18],
  size: [4, 12],
  opacity: [0.18, 0.62],
  rotation: [-0.8, 0.8],
  mode: "recycle",
  pointerRadius: 110,
  maxDpr: 2
};
```

Scale density by container area, then clamp it for mobile and low-power devices. Do not derive count from viewport width alone.

## Layer the section

1. Give the section a positioning context and clip overflow when particles should remain bounded.
2. Place the particle surface behind content but above the background.
3. Set the layer to `pointer-events: none`; listen for pointer movement on the section.
4. Reserve a quiet content zone or lower density behind long text and controls.
5. Keep controls and links in normal DOM stacking with visible focus.

## Run the simulation

- Seed particles inside or just above the container bounds.
- Update gravity, wind, phase-based sway, rotation, opacity, and position from elapsed time.
- Clamp large time deltas after background tabs or stalled frames.
- Use one `requestAnimationFrame` loop for the whole layer.
- Resize with `ResizeObserver`; cap canvas backing resolution at `min(devicePixelRatio, maxDpr)`.
- For pointer disturbance, apply a small distance-based force and let particles settle back naturally. Never attach a listener per particle.

Support explicit end modes:

- `recycle`: return particles above the section after exit.
- `exit`: remove particles after they leave the bounds.
- `settle`: resolve into a shallow visual pile with a strict height cap.
- `static`: render a deterministic still composition.

## Stop invisible work

Use IntersectionObserver to start only when the section is visible. Cancel animation frames when it exits or `document.hidden` becomes true. Resume from the current simulation state instead of spawning a second loop.

On teardown, disconnect observers, remove resize and pointer listeners, cancel the frame, and release renderer resources.

## Respect the reader

- Under `prefers-reduced-motion: reduce`, render a sparse static arrangement or remove the layer.
- Keep particles decorative and hidden from assistive technology.
- Control opacity and contrast so motion never crosses the legibility threshold.
- Avoid full-screen pointer repulsion, rapid direction changes, flashes, and large objects crossing form controls.
- Pause decorative motion while a modal or critical task in the section is active when it competes for attention.

## Verify

Test entry and exit pausing, background-tab recovery, fast resize, 390/768/1440 widths, device pixel ratio, pointer and touch input, reduced motion, section overflow, content focus, long text, route cleanup, and console errors. Confirm only one animation loop survives repeated mounts.

Use [demo/index.html](demo/index.html) as the working reference and [demo/PROMPT.md](demo/PROMPT.md) to recreate or remix it. Keep [REFERENCES.md](REFERENCES.md) as the links-only implementation source list.


---

## vantajs

---
name: vantajs
description: Use when adding animated WebGL background effects with Vanta.js (setup, parameters, resizing, performance, integration in React/Next.js).
---

# Vanta.js — Animated WebGL Backgrounds Skill

## When to use
- Decorative animated backgrounds behind hero sections
- You want “wow” quickly without building a full three.js scene
- Lightweight integration into static sites or React/Vue

## How it works
- Vanta injects a canvas into a container element and renders an effect (many use three.js).
- Typical usage: include `three.min.js` (or provide THREE) + one Vanta effect bundle.

## Key APIs/patterns
- Init:
  - `const effect = VANTA.WAVES({ el: "#hero", ...options })`
- Update after init:
  - `effect.setOptions({ color: 0xff88cc })`
- Resize:
  - `effect.resize()` (if container size changes)
- Cleanup:
  - `effect.destroy()` (important in SPAs)

## Common pitfalls
- Container has no size → nothing visible
  - Ensure the target element has explicit width/height (or is laid out).
- Multiple WebGL canvases on one page → GPU load
  - Keep to 1–2 effects/page.
- Mobile/older GPU issues
  - Provide a fallback background color/image; consider disabling on small screens.
- Bundling in frameworks
  - Some builds require `window.THREE` or passing `THREE` in options.

## Quick recipes

### 1) Minimal waves background
```html
<div id="hero" style="height: 70vh;"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/vanta/dist/vanta.waves.min.js"></script>
<script>
  const effect = VANTA.WAVES({ el: "#hero", color: 0x0b1220, shininess: 40, waveHeight: 16, zoom: 0.9 });
</script>
```

### 2) React cleanup pattern (concept)
- Create effect in `useEffect`, store in ref, call `destroy()` on unmount.

## What to ask the user
- Which effect (waves, birds, fog, net, etc.) and brand colors?
- Must it run on mobile? If yes, what’s acceptable FPS/quality?
- Is it behind text (needs contrast/readability)?


---

## cobejs

---
name: cobejs
description: Use when adding a lightweight interactive globe with cobe (canvas setup, markers, interaction, performance, integration with React/Next.js).
---

# cobe.js — Lightweight WebGL Globe Skill

## When to use
- A “spinning globe” / location markers in hero or about pages
- You want a small, focused globe lib (not full three.js)
- Decorative + interactive (markers, rotation) with minimal setup

## Key APIs/patterns
- Core:
  - `import createGlobe from "cobe"`
  - `const globe = createGlobe(canvas, { ...options, onRender(state) { ... } })`
- Important options (common):
  - `devicePixelRatio`, `width`, `height`
  - `phi`, `theta` (rotation angles)
  - `scale`, `dark`, `diffuse`
  - `baseColor`, `markerColor`, `glowColor`
  - `markers: [{ location: [lat, lon], size, color? }]`
- Lifecycle:
  - `globe.toggle()` pauses RAF
  - `globe.destroy()` removes instance

## Common pitfalls
- Canvas sizing mismatch
  - Set CSS size AND set canvas `width/height` scaled for DPR.
- Not updating on resize
  - Recompute width/height and recreate or update params.
- Too high DPR on mobile
  - Clamp DPR to 1–2.

## Quick recipe: responsive globe with markers
```js
import createGlobe from "cobe";

const canvas = document.getElementById("cobe");
let phi = 0;

function setup() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio, 2);
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);

  const globe = createGlobe(canvas, {
    devicePixelRatio: dpr,
    width: canvas.width,
    height: canvas.height,
    phi: 0,
    theta: 0.2,
    dark: 0,
    diffuse: 1.2,
    scale: 1,
    mapSamples: 16000,
    mapBrightness: 6,
    baseColor: [0.2, 0.2, 0.25],
    glowColor: [1, 1, 1],
    markerColor: [0.8, 0.5, 1],
    markers: [{ location: [1.3521, 103.8198], size: 0.08 }],
    onRender: (state) => {
      state.phi = phi;
      phi += 0.01;
    },
  });

  return globe;
}

let globe = setup();
window.addEventListener("resize", () => {
  globe.destroy();
  globe = setup();
});
```

## What to ask the user
- Globe size and placement (hero, section, card)?
- Marker locations + colors (brand-aligned)?
- Interaction needs (drag to rotate vs. ambient spin)?


---

## matterjs

---
name: matterjs
description: Use when implementing 2D physics interactions with Matter.js, including Engine/World setup, Render/Runner configuration, adding bodies and constraints, and scroll/interaction-friendly canvas scenes.
---

# Matter.js Skill

## Workflow
1. Confirm environment (plain HTML, React, or canvas-only) and rendering approach (Matter.Render for debug vs custom renderer).
2. Provide a minimal Engine/World/Render/Runner setup and add bodies.
3. Add interactions (mouse constraint) or constraints only if requested.
4. Share cleanup steps for SPA or teardown scenarios.

## Minimal setup
```html
<script>
  const { Engine, Render, Runner, Bodies, Composite } = Matter;

  const engine = Engine.create();

  const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
      width: 800,
      height: 600,
      wireframes: false
    }
  });

  const runner = Runner.create();
  Runner.run(runner, engine);
  Render.run(render);

  const ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });
  const box = Bodies.rectangle(400, 200, 80, 80);

  Composite.add(engine.world, [ground, box]);
</script>
```

## Common patterns
- Use `Composite.add(engine.world, [...])` to add bodies to the world.
- Use `Render.create({ element, engine })` to create a canvas automatically, or pass a `canvas` you create yourself.
- Set `render.options.wireframes = false` for solid rendering.
- Use `Runner.run(runner, engine)` for a simple loop, or call `Engine.update` in your own loop if you need custom timing.

## Mouse interaction (optional)
```js
const { Mouse, MouseConstraint } = Matter;
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, { mouse });
Composite.add(engine.world, mouseConstraint);
render.mouse = mouse;
```

## Cleanup checklist (SPA)
- Stop the runner with `Runner.stop(runner)`.
- Remove the render canvas from the DOM.
- Clear engine and world if needed.

## Questions to ask when specs are missing
- What viewport size and scaling should the canvas use?
- Are we using Matter.Render or a custom renderer?
- Do you want mouse/touch drag interaction?
- Should the simulation loop be paused when offscreen?


---

## unicorn-studio

---
name: unicorn-studio
description: Use when embedding and customizing Unicorn Studio interactive animations on the web (embed, responsive sizing, performance, layering with UI, fallbacks).
---

# Unicorn Studio — No-code WebGL Scenes (Embed/SDK) Skill

## When to use
- Designers want custom WebGL visuals without hand-coding shaders/three.js
- You need “designed” effects layered with text/images/video, with built-in interactivity
- Site builders: Framer, Webflow, Wix, Figma Sites, etc.

## What it is
- A scene editor (layers + effects + events) that exports:
  - Embed via Unicorn Studio SDK (small JS library)
  - Or JSON/code export for faster/self-hosted loading (plan-dependent)

## Key embed patterns
- Load SDK (can be in `<head>` or footer depending on above-the-fold):
  - UMD from jsDelivr (versioned)
  - Call `UnicornStudio.init()` once DOM is ready
- Add attributes to a container element:
  - `data-us-project="PROJECT_ID"`
  - Optional performance/behavior params:
    - `data-us-scale` (render scale)
    - `data-us-dpi` (resolution multiplier)
    - `data-us-fps` (cap FPS)
    - `data-us-lazyload="true"`
    - `data-us-production="true"`
  - Optional JSON source:
    - `data-us-project-src="https://.../scene.json.txt"`

## Events (authoring-side)
- Appear (entrance), Scroll (progress/velocity), Hover, Mousemove
- Use events for “feels interactive” without writing JS.

## Common pitfalls
- Container has no defined dimensions → scene won’t display
  - Ensure the element with `data-us-project` has width/height.
- Too many scenes on one page → WebGL context limits + memory
  - Prefer <10 scenes/page; WebGL context max ~16.
- Performance on low-end devices
  - Use `data-us-scale`/`data-us-dpi`/`data-us-fps`; reduce dynamic layers/effects.
- Site builder preview limitations
  - Many builders won’t render in edit mode; must preview/publish to see it.

## Quick recipes

### 1) Basic embed container
```html
<div style="width: 100%; height: 420px" data-us-project="YOUR_PROJECT_ID"></div>
```

### 2) Performance-first embed
```html
<div
  style="width: 100%; height: 420px"
  data-us-project="YOUR_PROJECT_ID"
  data-us-lazyload="true"
  data-us-production="true"
  data-us-scale="0.75"
  data-us-dpi="1.25"
  data-us-fps="45"
></div>
```

## What to ask the user
- Target platform: Webflow / Framer / coded site?
- Is the scene above-the-fold? (affects script placement and lazyload)
- Mobile support requirement + acceptable quality/FPS
- Number of scenes on the page and whether JSON export is available


---

## atmosphere-background

---
name: atmosphere-background
description: "Create a dark atmospheric background with drifting vertical light folds, screen-blended glow, and a concentrated luminous corner or lower-edge bloom."
---

# Atmosphere Background Skill

## Use When
- Create a dark atmospheric background with drifting vertical light folds, screen-blended glow, and a concentrated luminous corner or lower-edge bloom.

## Workflow

## Scope
- Apply this only to the immersive background layer, not to the full page layout, typography, or unrelated WebGL/particle systems.
- Use it when the design needs a moody atmospheric backdrop with fluid light curtains or folds instead of geometric grids, blobs, or literal illustrations.

## Visual target
- Create a deep near-black background with soft vertical light folds drifting across the frame like illuminated fabric, fog sheets, or light curtains.
- Build the glow from multiple overlapping vertical bands so the background feels layered and spatial rather than flat.
- Let brightness accumulate more strongly toward one area, especially the lower right or lower edge, so the scene has a cinematic focal glow instead of uniform brightness.
- Keep the palette restrained: dark navy or charcoal base, then derive the glow from the design's primary color or strongest accent color. If no clear brand color exists, a cool cyan-blue atmosphere is acceptable.

## Implementation guidance
- Prefer canvas or shader-driven rendering for this effect instead of static CSS gradients when motion is required.
- Use multiple tall overlapping bands or folds with slow sine-wave drift so the structure reads as moving atmospheric light rather than hard columns.
- Use screen or additive-style blending so the overlapping folds brighten naturally where they cross.
- Shape each fold with vertical gradients that fade at the top and intensify toward the bottom or focal corner.
- Add a subtle radial glow overlay near the focal edge or corner to reinforce depth and the main luminous area.
- Motion should stay slow and meditative: gentle drift, slight intensity modulation, no noisy flicker or rapid pulsing.

## Tuning knobs
- Fold count: add or reduce the number of vertical folds depending on how dense the atmosphere should feel.
- Drift: control horizontal sway amplitude and speed to keep motion calm.
- Brightness focus: place the strongest glow near a corner, edge, or lower quadrant instead of spreading it evenly across the whole frame.
- Color: tint the folds with the active design accent while preserving a dark, premium base.
- Softness: adjust overlap width, gradient falloff, and post-glow strength so the background feels luminous but not washed out.

## Avoid
- Flat multi-stop gradients with no layered fold structure.
- Loud rainbow color transitions or bright full-frame glow that competes with foreground content.
- Hardcoded cyan if the design clearly uses another primary color.
- Fast turbulence, noisy particle motion, or obvious repeating patterns that break the calm atmospheric look.


---

## optimize-threejs-games

---
name: optimize-threejs-games
description: Profile, diagnose, and improve Three.js or WebGL game performance without regressing gameplay. Use for frame-time drops, CPU/GPU pressure, draw calls, texture and geometry budgets, animation loops, adaptive quality, mobile performance, and browser performance verification.
---

# Optimize Three.js Games

Measure before changing behavior, then validate the same gameplay path after every optimization.

## Establish a repeatable scene

Choose a deterministic representative encounter and record device, viewport, quality level, player position, enemies, active effects, frame-time sample, draw calls, triangles, texture count, and warnings. Compare like with like.

## Diagnose the limiting side

- Suspect CPU when simulation, allocations, React work, pathfinding, or per-frame scans grow with actors.
- Suspect GPU when resolution, overdraw, shadows, transparent particles, post-processing, draw calls, geometry, or texture bandwidth dominate.
- Inspect before optimizing; do not lower quality blindly.

## Apply low-risk fixes first

Reuse geometry/materials, pool transient effects, cull inactive/offscreen work, throttle noncritical UI updates, cap particle counts, avoid per-frame allocation, and update only changed transforms. Keep render quality settings explicit and reversible. Degrade decorative effects before combat readability or controls.

## Guard the result

Re-run the original encounter and verify frame time, visual correctness, collision/contact behavior, memory stability, mobile controls, reduced motion, and console health. Close temporary servers, benchmarks, and browser tabs once they are no longer needed.


---

## design-first-ui-prompting

---
name: design-first-ui-prompting
description: Use when you need design-first, spec-driven, skimmable prompts for UI generation. Covers prompt structure, constraints, variations, typography/spacing rules, and iteration workflow for consistent UI outputs.
---

# Design-First UI Prompting Skill

This skill is for **design-first prompting**: turn fuzzy ideas into a tight spec that produces consistent UI.

## Core principle
**Prompt like a design system, not a wish.**

## Prompt Structure (copy/paste)
Use this skeleton, then fill the blanks.

```text
GOAL
- What are we making? (e.g., landing page hero / onboarding / dashboard / carousel slide)
- Who is it for? (persona)
- What’s the success criteria? (clarity, conversion, vibe)

FORMAT
- Size/aspect: (e.g., 1080x1350)
- Safe margins: (e.g., 90px)

LAYOUT (wireframe in words)
- Grid: (e.g., Swiss 6-col)
- Placement: (e.g., type-left / image-right)
- Hierarchy: H1 → subhead → body → CTA

TYPE SYSTEM
- Font vibe: (e.g., Söhne / Neue Haas / SF Pro)
- Weights: (H1 700, body 400)
- Leading: (tight for H1, readable for body)
- Tracking: (micro labels wider)

COLOR + MATERIAL
- Background: (hex or description)
- Text: (white/ivory/charcoal)
- One accent only: (cyan/lime/purple)
- Texture: (subtle grain, no plastic HDR)

IMAGERY / UI STYLE
- UI style: (minimal / glass / editorial / playful 3D)
- If photo: lighting + crop + texture rules
- If 3D: materials + lighting + softness

COPY (render EXACTLY)
- Line 1:
- Line 2:
- ...

CONSTRAINTS (change 1–2 things only)
- FONT: ___
- STYLE: ___
- MODE: ___

NEGATIVE PROMPT
- No logos, no watermarks
- No extra text beyond provided lines
- No gibberish typography
```

## Rules that improve consistency

### 1) Lock one “system”, then iterate with variants
- First output: nail **layout + hierarchy + copy**.
- Variants: change **ONE variable** at a time:
  - angle / crop
  - accent color
  - card arrangement
  - background tone

### 2) Treat typography as fragile
If the model keeps misspelling:
- Use **2-pass workflow**:
  1) Generate without text (reserve a clean text-safe area)
  2) Typeset in Figma

### 3) Use “constraints cards”
When you want the model to obey a style:
- Add a small “Constraints” panel with explicit values.
- It anchors the output like a mini style guide.

Example:
```text
Constraints
FONT  CANELA
STYLE  MINIMAL
MODE  DARK
```

### 4) Keep a local reference pack
Don’t ask the model to “remember” taste.
- Save references into a gitignored local reference folder, such as `refs/...`
- Point prompts to the reference style

## Fast iteration checklist (what to tweak)
- Spacing: margins, leading, baseline rhythm
- Contrast: background vs text
- Hierarchy: one hero line, one support line
- One accent only (don’t rainbow)
- Texture: add grain, remove smoothing

## Questions to ask (when user is vague)
- What’s the single message of this screen?
- What’s the hierarchy (H1 / sub / CTA)?
- Which style lane: minimal editorial vs playful 3D vs glass UI?
- Any must-keep constraints (font vibe, color, spacing, grid)?


---

## audit-verify-explain-grade-5

---
name: audit-verify-explain-grade-5
description: Audit work, verify claims with concrete evidence, and explain the result in simple grade-5 language. Use when the user asks to review, audit, check, verify, explain a change, explain a fix, summarize test results, validate whether something works, or translate technical findings into plain language for non-technical readers.
---

# Audit, Verify, Explain

## Core Rule

Treat every answer as three jobs:

1. Audit what changed or what is being claimed.
2. Verify it with direct evidence.
3. Explain it like the reader is smart but new to the topic.

Do not skip verification when local files, commands, logs, tests, screenshots, or source data are available. Do not pretend something was verified if it was only inferred.

## Workflow

### 1. Audit

Start by finding the real source of truth:

- For code changes, inspect the diff, touched files, related call sites, and existing tests.
- For bug fixes, identify the before/after behavior and the user-facing path.
- For performance claims, separate measured evidence from likely improvement.
- For release or app behavior, check the packaged/running artifact when possible.
- For documents or content, compare the user request against the actual produced artifact.

Look for:

- obvious bugs or regressions
- missing edge cases
- stale assumptions
- unverified claims
- mismatches between implementation and user intent
- risks that a grade-5 explanation might accidentally hide

### 2. Verify

Prefer evidence in this order:

1. Automated tests, builds, linters, typechecks, or validators.
2. Running the actual app or workflow.
3. Logs, process checks, screenshots, generated artifacts, or live output.
4. Static code inspection when execution is impractical.
5. Clearly labeled inference when nothing stronger is available.

When verification fails, report the blocker and what it means. When verification is partial, say exactly what was and was not checked.

For performance work, avoid overclaiming. Say "this removes repeated work" only when the code clearly does so. Say "should improve" only when no timing trace was captured. Say "measured faster" only when before/after measurements exist.

### 3. Explain Simply

Use grade-5 language without talking down to the user:

- Use short sentences.
- Define technical terms in plain words.
- Use one simple analogy only if it genuinely helps.
- Say what changed, why it matters, and how to test it.
- Keep important caveats visible.

Prefer this shape:

```markdown
What changed:
- ...

Why it matters:
- ...

How I verified it:
- ...

What is still not proven:
- ...
```

For very small answers, use a short paragraph instead of forcing headings.

## Explanation Standards

Translate technical ideas like this:

- "cache" -> "remember the answer so we do not ask the same question again"
- "metadata" -> "small facts about a file, like size or modified date"
- "regression" -> "something that used to work but broke"
- "artifact" -> "the real file or app that was created"
- "static inspection" -> "reading the code without running it"

Do not say "everything works" unless the full workflow was tested. Say "the checked parts work" when verification covered only part of the system.

## Output Rules

Lead with the answer. Keep the tone calm and clear.

Include file paths, commands, commit hashes, test names, or log snippets when they are the evidence. Keep them brief.

Separate facts from judgment:

- Fact: "The tests passed."
- Judgment: "That gives confidence in the timeline planner, but not the full editor UI."

End with the most useful next test only when another test would materially improve confidence.


---

## article-prompts-to-skills

---
name: article-prompts-to-skills
description: Convert an article, tutorial, or prompt pack into focused reusable AgentSkills, one independent capability per skill, with portable instructions, example prompts, working demos, preview screenshots, validation, gallery updates, and a narrow commit. Use when the user asks to turn an article's prompts, tutorial sections, design patterns, interactions, or workflow ideas into complete skills rather than leaving them as prose.
---

# Article Prompts to Skills

Turn source prompts into small, demonstrable capability packages. Preserve the useful behavior, not the source page's brand or layout.

## 1. Inspect Before Extracting

1. Read the repository instructions and the complete source article.
2. Run `git status --short`; preserve unrelated work.
3. Inventory every explicit prompt, heading, example, asset, and acceptance criterion.
4. Search existing `SKILL.md` files for overlapping capabilities before creating folders.
5. If the source is raw HTML and the prompts do not exist yet, use `$html-to-interaction-prompts` first, then return here.

Do not infer a family of skills from a title alone. Trace each proposed skill to source evidence.

## 2. Build an Extraction Ledger

Create a working table before editing files:

| Source prompt | Reusable capability | Keep | Remove | Skill name | Demo proof |
| --- | --- | --- | --- | --- | --- |

Apply these boundaries:

- Create one skill per independently reusable behavior.
- Merge steps only when separating them would make either step unusable.
- Update an existing skill when its contract already covers the capability.
- Skip decorative or editorial fragments that do not create a repeatable method.
- Name skills after the outcome or mechanism, never after the source article.

## 3. Extract the Portable Contract

Keep the source's successful mechanics:

- behavior and state transitions;
- data model and parameter defaults;
- timing, easing, spacing, and responsive rules;
- accessibility, reduced-motion, and keyboard behavior;
- performance constraints and failure modes;
- acceptance checks that prove the result.

Remove source-specific packaging:

- brand names, marketing copy, and proprietary content;
- page layout that is unrelated to the capability;
- hard-coded palettes, assets, and selectors;
- incidental implementation choices that do not affect the outcome.

The result must transfer to a different subject, layout, and visual system without rewriting the core instructions.

## 4. Package Every Skill

Initialize every new folder with the installed `skill-creator` initializer, then complete this contract:

```text
agent-skills/<category>/<skill-name>/
  SKILL.md
  agents/openai.yaml
  references/          # only when detailed reusable guidance is needed
  assets/ or scripts/  # only when the workflow genuinely reuses them
  demo/
    index.html
    PROMPT.md
    preview.jpg
    input.md            # required for workflow skills
    expected-output.md  # required for workflow skills
```

Write `SKILL.md` in imperative form. Keep only `name` and `description` in frontmatter. Put all trigger phrases in the description. Keep operational steps, constraints, pitfalls, and validation commands in the body.

Write `agents/openai.yaml` from the final skill:

- use a human-readable display name;
- keep the short description between 25 and 64 characters;
- make the default prompt explicitly invoke `$skill-name`.

## 5. Write Three Useful Example Prompts

Put these headings in `demo/PROMPT.md`:

### Minimal prompt

Invoke the skill and ask for one clear outcome.

```text
Use $skill-name to add <capability> to <target>.
```

### Recreate the demo

Describe the reference experience, implementation contract, deliverables, and acceptance checks. Specify what must remain local and self-contained.

### Remix prompt

Change the subject, content, palette, and composition while preserving the mechanism, accessibility behavior, responsive rules, and performance contract.

Read [references/example-packages.md](references/example-packages.md) for visual, mixed-source, and workflow examples.

## 6. Build Proof, Not Decoration

Make every demo original, self-contained, and inspectable:

- demonstrate the core mechanism on the first screen;
- use realistic content instead of labels such as “demo card”;
- add controls only when they expose meaningful states;
- support 390px through 1440px layouts;
- use semantic HTML and visible focus states;
- provide reduced-motion behavior for animated work;
- keep dependencies local and avoid a build step unless the skill requires one;
- use `input.md` and `expected-output.md` for nonvisual workflows.

Never treat a screenshot as the implementation. The HTML demo must work.

## 7. Validate the Complete Package

Run validation in proportion to the artifact:

1. Run the skill creator's `quick_validate.py` on every new or changed skill.
2. Run repository demo validation and any targeted syntax checks.
3. Open each demo in the permitted browser at desktop and mobile sizes.
4. Exercise the primary interaction, keyboard focus, and reduced-motion path.
5. Confirm the console is clean.
6. Capture a real browser preview at the repository's shared dimensions.
7. Rebuild the demo and screenshot galleries, then validate again.
8. Scan changed files for secrets, tokens, private paths, and private client data.

Do not claim visual or interaction verification from static file inspection alone.

## 8. Commit Only the Task

Stage the new skill folders and the gallery files they require. Review `git diff --cached --stat` and `git diff --cached` before committing. Leave pre-existing dirty files untouched.

Report:

- the source-to-skill mapping;
- the example prompt and demo paths;
- validation and browser evidence;
- the commit hash;
- unrelated dirty files that remain outside the commit.

## Failure Modes

- **Page clone:** copying the source layout instead of extracting the mechanism.
- **Mega-skill:** combining independent prompts into one vague skill.
- **Micro-fragments:** turning every sentence into a skill without reusable behavior.
- **Theme lock-in:** hard-coding the source's palette, assets, or copy.
- **Prompt-only package:** omitting a functioning demo and preview.
- **Fake proof:** claiming interaction verification without exercising it.
- **Dirty-tree spillover:** staging unrelated modifications or generated files.
