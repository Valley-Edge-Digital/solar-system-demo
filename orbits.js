/**
 * orbits.js — pure Keplerian ephemeris math. No three.js, no DOM.
 * Unit-testable in plain Node.
 *
 * Source of element tables: JPL "Approximate Positions of the Planets"
 * (Standish & Williams), https://ssd.jpl.nasa.gov/planets/approx_pos.html
 * Table 1, valid 1800–2050 AD, mean ecliptic and equinox of J2000.
 */

export const DEG = Math.PI / 180;

// J2000.0 = 2000-01-01 12:00 TT (≈ UTC for this demo's purposes)
export const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0);

export function daysSinceJ2000(date = new Date()) {
  return (date.getTime() - J2000_MS) / 86400000;
}

/**
 * Solve Kepler's equation M = E - e·sin(E) for E.
 * Newton iteration per the JPL recipe; start E0 = M + e·sin(M).
 * M in radians (any range), e dimensionless. Returns E in radians.
 */
export function solveKepler(M, e) {
  const TWO_PI = Math.PI * 2;
  M = ((M % TWO_PI) + 3 * Math.PI) % TWO_PI - Math.PI; // wrap to [-π, π]
  let E = M + e * Math.sin(M);
  for (let i = 0; i < 30; i++) {
    const dE = (M - (E - e * Math.sin(E))) / (1 - e * Math.cos(E));
    E += dE;
    if (Math.abs(dE) < 1e-12) break;
  }
  return E;
}

/** Elements at `days` past J2000. Angles returned in radians. */
export function elementsAt(el, days) {
  const T = days / 36525; // Julian centuries
  return {
    a: el.a0 + el.aDot * T,
    e: el.e0 + el.eDot * T,
    i: (el.i0 + el.iDot * T) * DEG,
    L: (el.L0 + el.LDot * T) * DEG,
    lp: (el.lp0 + el.lpDot * T) * DEG,
    node: (el.node0 + el.nodeDot * T) * DEG,
  };
}

/**
 * Heliocentric position in AU, J2000 ecliptic frame (z = ecliptic north).
 * Implements step 5 of the JPL formulae (r_ecl = Rz(-Ω)Rx(-I)Rz(-ω) r').
 */
export function heliocentricPosition(el, days) {
  const { a, e, i, L, lp, node } = elementsAt(el, days);
  const M = L - lp;
  const w = lp - node; // argument of perihelion
  const E = solveKepler(M, e);

  const xp = a * (Math.cos(E) - e);
  const yp = a * Math.sqrt(1 - e * e) * Math.sin(E);

  const cw = Math.cos(w), sw = Math.sin(w);
  const cn = Math.cos(node), sn = Math.sin(node);
  const ci = Math.cos(i), si = Math.sin(i);

  return {
    x: (cw * cn - sw * sn * ci) * xp + (-sw * cn - cw * sn * ci) * yp,
    y: (cw * sn + sw * cn * ci) * xp + (-sw * sn + cw * cn * ci) * yp,
    z: sw * si * xp + cw * si * yp,
  };
}

/**
 * Sampled closed orbit path in AU (ecliptic frame), evaluated with the
 * epoch's constant rotation terms. `segments` points, last == first.
 */
export function orbitPath(el, days, segments = 256) {
  const { a, e, i, lp, node } = elementsAt(el, days);
  const w = lp - node;
  const cw = Math.cos(w), sw = Math.sin(w);
  const cn = Math.cos(node), sn = Math.sin(node);
  const ci = Math.cos(i), si = Math.sin(i);
  const b = a * Math.sqrt(1 - e * e);

  const pts = [];
  for (let s = 0; s <= segments; s++) {
    const M = (s / segments) * Math.PI * 2;
    const E = solveKepler(M, e);
    const xp = a * (Math.cos(E) - e);
    const yp = b * Math.sin(E);
    pts.push({
      x: (cw * cn - sw * sn * ci) * xp + (-sw * cn - cw * sn * ci) * yp,
      y: (cw * sn + sw * cn * ci) * xp + (-sw * sn + cw * cn * ci) * yp,
      z: sw * si * xp + cw * si * yp,
    });
  }
  return pts;
}

/** Kepler's third law around 1 M☉: P(days) from a(AU). */
export function periodDaysFromA(a) {
  return 365.2568983 * Math.pow(a, 1.5);
}
