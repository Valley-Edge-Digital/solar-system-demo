/**
 * textures.js — procedural texture generation (browser-only; needs canvas).
 * Deterministic 3D value-noise fBm sampled on the unit sphere, so planet
 * maps have no longitude seam and no pole pinching.
 */
import * as THREE from "three";

// ─── Deterministic noise ──────────────────────────────────────
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PERM = new Uint8Array(512);
{
  const rand = mulberry32(1337);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = (rand() * (i + 1)) | 0;
    const t = p[i];
    p[i] = p[j];
    p[j] = t;
  }
  for (let i = 0; i < 512; i++) PERM[i] = p[i & 255];
}

function latticeHash(x, y, z) {
  return PERM[(PERM[(PERM[x & 255] + y) & 255] + z) & 255] / 255;
}

function smootherstep01(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/** 3D value noise in [0,1]. */
export function noise3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const u = smootherstep01(x - xi);
  const v = smootherstep01(y - yi);
  const w = smootherstep01(z - zi);

  const c000 = latticeHash(xi, yi, zi);
  const c100 = latticeHash(xi + 1, yi, zi);
  const c010 = latticeHash(xi, yi + 1, zi);
  const c110 = latticeHash(xi + 1, yi + 1, zi);
  const c001 = latticeHash(xi, yi, zi + 1);
  const c101 = latticeHash(xi + 1, yi, zi + 1);
  const c011 = latticeHash(xi, yi + 1, zi + 1);
  const c111 = latticeHash(xi + 1, yi + 1, zi + 1);

  const x00 = c000 + (c100 - c000) * u;
  const x10 = c010 + (c110 - c010) * u;
  const x01 = c001 + (c101 - c001) * u;
  const x11 = c011 + (c111 - c011) * u;
  const y0 = x00 + (x10 - x00) * v;
  const y1 = x01 + (x11 - x01) * v;
  return y0 + (y1 - y0) * w;
}

/** fBm in [0,1], `octaves` layers, lacunarity 2, gain 0.5. */
export function fbm3(x, y, z, octaves = 4) {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += noise3(x * freq, y * freq, z * freq) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

/** Ridged fBm (sharp crests), in [0,1]. */
export function ridged3(x, y, z, octaves = 4) {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    const n = 1 - Math.abs(noise3(x * freq, y * freq, z * freq) * 2 - 1);
    sum += n * n * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

// ─── Helpers ──────────────────────────────────────────────────
const _c1 = new THREE.Color();
const _c2 = new THREE.Color();

function hexLerp(a, b, t) {
  _c1.set(a);
  _c2.set(b);
  _c1.lerp(_c2, THREE.MathUtils.clamp(t, 0, 1));
  return _c1;
}

function canvasTexture(canvas, { srgb = true } = {}) {
  const tex = new THREE.CanvasTexture(canvas);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/**
 * Run `paint(px, py, pz, lat)` per texel on the unit sphere and write to a
 * size×size canvas. paint returns [r,g,b,a] in 0–255.
 */
function paintSphere(size, paint) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(size, size);
  const data = img.data;

  for (let y = 0; y < size; y++) {
    const lat = (y / size - 0.5) * Math.PI; // -π/2 … π/2
    const cosLat = Math.cos(lat);
    const py = Math.sin(lat);
    for (let x = 0; x < size; x++) {
      const lon = (x / size) * Math.PI * 2;
      const px = cosLat * Math.cos(lon);
      const pz = cosLat * Math.sin(lon);
      const idx = (y * size + x) * 4;
      const [r, g, b, a] = paint(px, py, pz, lat, lon);
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = a;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

const clamp255 = (v) => Math.min(255, Math.max(0, v));

// ─── Planet surfaces ──────────────────────────────────────────
export function makePlanetTexture(body) {
  const size = 512;

  // Hoisted per-body constants (kept out of the per-texel hot path)
  const baseCol = new THREE.Color(body.color ?? 0xa09890);
  const palette = body.texture === "bands"
    ? (body.bands?.colors || ["#888888"]).map((c) => new THREE.Color(c))
    : null;
  const darkMaria = new THREE.Color("#5c2410");
  const redSpot = new THREE.Color("#c65a38");
  const neptuneStorm = new THREE.Color("#1c2f8a");

  const canvas = paintSphere(size, (px, py, pz, lat) => {
    let col;

    switch (body.texture) {
      case "earth": {
        const n = fbm3(px * 1.8 + 7.3, py * 1.8, pz * 1.8, 5);
        const detail = fbm3(px * 7 + 3.1, py * 7, pz * 7, 4);
        const land = n + (detail - 0.5) * 0.25;
        const polar = Math.abs(Math.sin(lat));
        if (polar > 0.86 + (detail - 0.5) * 0.06) {
          col = hexLerp("#e8f0f2", "#cfdde4", detail); // ice caps
        } else if (land > 0.56) {
          const h = (land - 0.56) * 3.2;
          col = h > 0.55
            ? hexLerp("#6b7d4f", "#8a7d5a", (h - 0.55) * 2.2) // highland
            : hexLerp("#3d7a3f", "#5e8a4a", h * 2.2); // lowland green
        } else {
          const d = (0.56 - land) * 2.4;
          col = hexLerp("#2f6db3", "#16355e", THREE.MathUtils.clamp(d, 0, 1)); // ocean depth
        }
        break;
      }

      case "mars": {
        const n = fbm3(px * 2.2 + 11.7, py * 2.2, pz * 2.2, 5);
        const dark = fbm3(px * 4.5, py * 4.5 + 5.2, pz * 4.5, 3);
        col = hexLerp("#8a3a16", "#d06828", n);
        if (dark > 0.62) col.lerp(darkMaria, (dark - 0.62) * 2);
        if (Math.abs(Math.sin(lat)) > 0.93) col = hexLerp("#e8ddcf", "#d9cbb8", n);
        break;
      }

      case "bands": {
        // Latitude bands warped by turbulence so edges flow instead of ring.
        // The palette cycles a few times pole-to-pole for visible banding.
        const turb = fbm3(px * 2.4, py * 2.4, pz * 2.4, 4) - 0.5;
        const v = py + turb * (body.bands?.soft ? 0.06 : 0.12);
        const cycles = body.bands?.soft ? 1.8 : 2.6;
        const t = ((v * 0.5 + 0.5) * cycles) % 1;
        const f = (t < 0 ? t + 1 : t) * (palette.length - 1);
        const i0 = Math.min(palette.length - 2, Math.floor(f));
        col = palette[i0].clone().lerp(palette[i0 + 1], f - i0);
        const grain = fbm3(px * 9, py * 9, pz * 9, 3) - 0.5;
        col.offsetHSL(0, 0, grain * 0.1);
        if (body.id === "jupiter") {
          // Great Red Spot — a soft oval in the southern hemisphere.
          const spotLon = 1.1, spotLat = -0.36;
          const sx = Math.cos(spotLat) * Math.cos(spotLon);
          const sy = Math.sin(spotLat);
          const sz = Math.cos(spotLat) * Math.sin(spotLon);
          const d = Math.acos(THREE.MathUtils.clamp(px * sx + py * sy + pz * sz, -1, 1));
          if (d < 0.22) col.lerp(redSpot, (1 - d / 0.22) * 0.75);
        }
        break;
      }

      case "ice": {
        const n = fbm3(px * 1.6 + 4.4, py * 3.2, pz * 1.6, 4);
        const band = Math.sin(py * 6 + n * 3) * 0.5 + 0.5;
        col = baseCol.clone().offsetHSL(0, 0, (band - 0.5) * 0.08 + (n - 0.5) * 0.1);
        if (body.id === "neptune") {
          const storm = fbm3(px * 3 + 9.9, py * 3, pz * 3, 3);
          if (storm > 0.68) col.lerp(neptuneStorm, (storm - 0.68) * 2.4);
        }
        break;
      }

      case "venus": {
        const swirl = fbm3(px * 1.4 + py * 1.2, py * 2.6, pz * 1.4, 5);
        const streak = fbm3(px * 5 + swirl * 2.4, py * 5, pz * 5, 3);
        col = hexLerp("#c9a267", "#f0e2bb", streak * 0.7 + swirl * 0.3);
        break;
      }

      case "cratered":
      default: {
        const n = fbm3(px * 3 + 2.2, py * 3, pz * 3, 5);
        const craters = ridged3(px * 6 + 8.8, py * 6, pz * 6, 4);
        col = hexLerp("#7d7468", "#b3a99b", n);
        const pit = craters > 0.72 ? (craters - 0.72) * 2.6 : 0;
        col.offsetHSL(0, 0, -Math.min(0.28, pit));
        // Tint toward the body's own color so Pluto stays warm, Moon gray, etc.
        col.lerp(baseCol, 0.35);
        break;
      }
    }

    return [clamp255(col.r * 255), clamp255(col.g * 255), clamp255(col.b * 255), 255];
  });

  return canvasTexture(canvas);
}

/** Earth-style broken cloud layer (RGBA — alpha carries the cloud mask). */
export function makeCloudTexture() {
  const size = 512;
  const canvas = paintSphere(size, (px, py, pz, lat) => {
    const n = fbm3(px * 2.6 + 21.4, py * 2.6, pz * 2.6, 5);
    const wisps = fbm3(px * 8 + 13.7, py * 8, pz * 8, 3);
    let a = THREE.MathUtils.clamp((n - 0.52) * 4.5, 0, 1);
    a *= 0.55 + wisps * 0.6;
    // Fewer clouds right at the poles
    a *= 1 - Math.pow(Math.abs(Math.sin(lat)), 6) * 0.6;
    const shade = 235 + wisps * 20;
    return [shade, shade, shade + 5, clamp255(a * 255)];
  });
  return canvasTexture(canvas);
}

// ─── Sun ──────────────────────────────────────────────────────
export function makeSunTexture() {
  const size = 512;
  const canvas = paintSphere(size, (px, py, pz) => {
    const granule = fbm3(px * 6, py * 6, pz * 6, 4);
    const cell = ridged3(px * 10 + 4.4, py * 10, pz * 10, 3);
    const heat = THREE.MathUtils.clamp(0.72 + (granule - 0.5) * 0.7 + (cell - 0.5) * 0.35, 0, 1.25);
    const r = 255;
    const g = 140 + heat * 100;
    const b = 30 + heat * 70;
    return [r, clamp255(g), clamp255(b), 255];
  });
  return canvasTexture(canvas);
}

// ─── Rings ────────────────────────────────────────────────────
export function makeRingTexture(color, opacity = 0.75) {
  const width = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = 4;
  const ctx = canvas.getContext("2d");
  const c = new THREE.Color(color);

  for (let x = 0; x < width; x++) {
    const t = x / width;
    // Radial ringlet structure from 1D noise + named gaps
    const ringlet = noise3(t * 24, 3.7, 0) * 0.55 + noise3(t * 90, 9.1, 0) * 0.45;
    let a = opacity * (0.35 + ringlet * 0.85);
    if (t > 0.55 && t < 0.6) a *= 0.15; // Cassini division
    if (t > 0.72 && t < 0.755) a *= 0.35; // Encke gap
    if (t < 0.06 || t > 0.97) a *= 0.15; // soft inner/outer edges
    const shade = 0.72 + ringlet * 0.45;
    ctx.fillStyle = `rgba(${(c.r * 255 * shade) | 0},${(c.g * 255 * shade) | 0},${(c.b * 255 * shade) | 0},${THREE.MathUtils.clamp(a, 0, 1)})`;
    ctx.fillRect(x, 0, 1, 4);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  return tex;
}

// ─── Sky ──────────────────────────────────────────────────────
/** Milky-way band + faint nebula wisps on the sky sphere. */
export function makeMilkyWayTexture() {
  const size = 1024;
  const canvas = paintSphere(size, (px, py, pz) => {
    // Band centered on a tilted great circle so it reads as a galactic plane.
    const tilt = 0.35;
    const bandAxis = py * Math.cos(tilt) + pz * Math.sin(tilt);
    const band = Math.exp(-Math.pow(bandAxis / 0.24, 2));
    const wisps = fbm3(px * 2.4 + 31.7, py * 2.4, pz * 2.4, 5);
    const lanes = ridged3(px * 4 + 17.3, py * 4, pz * 4, 4);

    const glow = band * (0.32 + wisps * 0.85) * (1 - Math.max(0, lanes - 0.78) * 2.2);
    const r = 8 + glow * (46 + wisps * 30);
    const g = 10 + glow * (40 + wisps * 26);
    const b = 16 + glow * (58 + wisps * 40);
    // Faint warm core in one direction
    const core = Math.exp(-((px - 0.8) ** 2 + (py + 0.1) ** 2 + (pz - 0.2) ** 2) * 3);
    return [
      clamp255(r + core * 42),
      clamp255(g + core * 30),
      clamp255(b + core * 14),
      255,
    ];
  });
  return canvasTexture(canvas);
}

/** Radial-gradient sprite used for sun halo and comet head glow. */
export function makeGlowTexture(inner = "rgba(255,240,200,1)", outer = "rgba(255,150,40,0)") {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, inner);
  grad.addColorStop(0.25, inner.replace(",1)", ",0.55)"));
  grad.addColorStop(0.6, outer.replace(",0)", ",0.12)"));
  grad.addColorStop(1, outer);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
