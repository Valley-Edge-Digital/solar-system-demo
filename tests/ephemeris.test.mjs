import assert from "node:assert/strict";
import test from "node:test";

import { BODIES, COMET } from "../bodies.js";
import {
  DEG,
  J2000_MS,
  daysSinceJ2000,
  elementsAt,
  heliocentricPosition,
  orbitPath,
  periodDaysFromA,
  solveKepler,
} from "../orbits.js";

const planets = BODIES.filter((b) => b.elements);

test("catalog: Sun + 8 planets + Pluto, unique ids, complete elements", () => {
  assert.equal(BODIES.length, 10);
  assert.equal(BODIES[0].id, "sun");
  assert.equal(new Set(BODIES.map((b) => b.id)).size, BODIES.length);
  assert.deepEqual(
    planets.map((b) => b.id),
    ["mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"]
  );
  for (const b of planets) {
    for (const k of ["a0", "aDot", "e0", "eDot", "i0", "iDot", "L0", "LDot", "lp0", "lpDot", "node0", "nodeDot"]) {
      assert.equal(typeof b.elements[k], "number", `${b.id} missing element ${k}`);
    }
    assert.ok(b.elements.a0 > 0 && b.radius > 0);
    assert.ok(b.elements.e0 >= 0 && b.elements.e0 < 1, `${b.id} eccentricity out of range`);
  }
});

test("daysSinceJ2000 is anchored at the J2000 epoch", () => {
  assert.equal(daysSinceJ2000(new Date(J2000_MS)), 0);
  assert.ok(Math.abs(daysSinceJ2000(new Date(Date.UTC(2001, 0, 1, 12))) - 366) < 1e-9);
});

test("Kepler solver converges even at high eccentricity (comet e=0.84)", () => {
  const wrap = (M) => ((M % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
  for (const [Mdeg, e] of [[10, 0.84], [179, 0.84], [359, 0.84], [45, 0.249], [0, 0.0167], [270, 0.206]]) {
    const M = wrap(Mdeg * DEG); // solver works on the wrapped angle
    const E = solveKepler(M, e);
    assert.ok(Math.abs(M - (E - e * Math.sin(E))) < 1e-10, `residual at M=${Mdeg}, e=${e}`);
  }
});

test("Earth at J2000: ~1 AU from the Sun at ~100.46° heliocentric longitude", () => {
  const earth = BODIES.find((b) => b.id === "earth");
  const p = heliocentricPosition(earth.elements, 0);
  const r = Math.hypot(p.x, p.y, p.z);
  assert.ok(r > 0.98 && r < 1.02, `Earth distance ${r}`);
  const lon = Math.atan2(p.y, p.x) / DEG;
  assert.ok(Math.abs(lon - 100.46457166) < 2, `Earth longitude ${lon}°`);
});

test("orbital distances stay inside each body's perihelion–aphelion range", () => {
  for (const b of planets) {
    const { a, e } = elementsAt(b.elements, daysSinceJ2000());
    for (const days of [0, 5000, 10000]) {
      const p = heliocentricPosition(b.elements, days);
      const r = Math.hypot(p.x, p.y, p.z);
      assert.ok(
        r > a * (1 - e) * 0.99 && r < a * (1 + e) * 1.01,
        `${b.id} at +${days}d: r=${r.toFixed(3)} outside [${(a * (1 - e)).toFixed(3)}, ${(a * (1 + e)).toFixed(3)}]`
      );
    }
  }
});

test("inclination is really applied — Pluto's orbit leaves the ecliptic plane", () => {
  const pluto = BODIES.find((b) => b.id === "pluto");
  const pts = orbitPath(pluto.elements, 0);
  const maxZ = Math.max(...pts.map((p) => Math.abs(p.z)));
  const { a, e, i } = elementsAt(pluto.elements, 0);
  assert.ok(maxZ > a * Math.sin(i) * 0.5, `Pluto max |z| ${maxZ} too flat`);
  assert.ok(maxZ <= a * (1 + e) * Math.sin(i) * 1.01, `Pluto max |z| ${maxZ} too tall`);
  // Earth, by contrast, stays within ~0.001 AU of the plane
  const earthPts = orbitPath(BODIES.find((b) => b.id === "earth").elements, 0);
  assert.ok(Math.max(...earthPts.map((p) => Math.abs(p.z))) < 0.001);
});

test("orbit paths close on themselves", () => {
  for (const b of planets) {
    const pts = orbitPath(b.elements, 0, 128);
    const first = pts[0];
    const last = pts[pts.length - 1];
    const gap = Math.hypot(first.x - last.x, first.y - last.y, first.z - last.z);
    assert.ok(gap < 1e-9, `${b.id} orbit path open by ${gap}`);
  }
});

test("periods from Kepler's third law match the known years", () => {
  const expected = { mercury: 87.97, earth: 365.26, jupiter: 4332.6, neptune: 60190, pluto: 90550 };
  for (const [id, days] of Object.entries(expected)) {
    const body = BODIES.find((b) => b.id === id);
    const p = periodDaysFromA(body.elements.a0);
    assert.ok(Math.abs(p - days) / days < 0.01, `${id}: ${p.toFixed(1)} vs ${days}`);
  }
});

test("comet elements produce a bound, eccentric, inclined path", () => {
  const { a, e, i } = elementsAt(COMET.elements, 0);
  assert.ok(e > 0.8 && e < 1);
  assert.ok(i > 5 * DEG);
  const pts = orbitPath(COMET.elements, 0);
  const peri = Math.min(...pts.map((p) => Math.hypot(p.x, p.y, p.z)));
  assert.ok(Math.abs(peri - a * (1 - e)) < 0.02, `comet perihelion ${peri}`);
});

test("positions evolve smoothly (no frame-to-frame jumps)", () => {
  for (const b of planets) {
    const p0 = heliocentricPosition(b.elements, 10000);
    const p1 = heliocentricPosition(b.elements, 10000 + 1);
    const step = Math.hypot(p1.x - p0.x, p1.y - p0.y, p1.z - p0.z);
    // Mercury at perihelion genuinely moves ~0.03 AU/day; allow up to 10% of a
    assert.ok(step < 0.1 * b.elements.a0 + 1e-6, `${b.id} moved ${step} AU in a day`);
  }
});
