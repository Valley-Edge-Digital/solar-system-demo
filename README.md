# COSMOS — Solar System Simulation

xAI showcase-style demo built from the announcement prompt:

> Make a beautiful simulation of the universe and solar system. should be sped up with adjustable time, realistic motion, orbits, stars. use threejs. Make the HUD well styled and conform to modern design principles.

## Run

No build step. Serve the folder over HTTP (ES modules + CDN Three.js):

```bash
cd solar-system-demo
python3 -m http.server 8791
```

Open **http://localhost:8791** (any free port works; 8765 is often occupied on this machine).

## Features

- **Real ephemeris** — planets sit at their actual positions for the displayed date, computed from JPL Keplerian elements ([Approximate Positions of the Planets, Table 1](https://ssd.jpl.nasa.gov/planets/approx_pos.html)); the sim opens on today's real sky and `N` jumps back to it
- **Sun + 8 planets + Pluto**, with inclined orbits (Pluto's 17° tilt is visible), eccentricity, axial tilt, and spin
- **Earth's Moon, the Galilean moons, and Titan**; Saturn / Uranus rings with ringlet structure and Cassini-style gaps
- **Procedural surfaces** — seamless 3D value-noise fBm textures: Earth continents + drifting cloud layer, Jupiter/Saturn turbulence-warped bands + Great Red Spot, cratered Mercury/Moon/Pluto, ice-giant banding
- **Fresnel atmosphere rims**, animated sun granulation with corona + glow, Milky Way sky sphere, 14k-star field, asteroid belt, and a Halley-like comet with a fading pooled trail
- **Bloom** post-processing for a cinematic glow
- **Adjustable time scale** from near-real-time to ~10 years/sec
- **Modern glass HUD**: body list, live focus stats (incl. current Sun distance), display toggles, real-date clock
- **Tour control**: click Tour or press T to visit each body in order
- **Keyboard**: Space pause · R reset view · N today · T tour · 1–9 bodies · 0 overview · ? shortcuts
- **Robustness**: WebGL support + context-loss overlays, `prefers-reduced-motion` respected

## Stack

- Three.js r170 (CDN import map)
- OrbitControls + UnrealBloomPass
- Vanilla HTML / CSS / JS, no build step

## Code layout

| File | Role |
|---|---|
| `bodies.js` | Pure data: JPL orbital elements + visual params (Node-testable) |
| `orbits.js` | Pure ephemeris math: Kepler solver, element propagation, orbit paths |
| `textures.js` | Procedural texture engine (fBm noise → canvas textures) |
| `main.js` | Scene, HUD wiring, animation loop |

## Tests

```bash
node --test tests/*.test.mjs
```

Covers the ephemeris math against known values (Earth at ~1 AU / ~100.46° longitude at J2000, Kepler-solver residuals to 1e-10, perihelion–aphelion bounds, Pluto's inclination), data integrity, DOM-id cross-checks, and ES-module syntax.

Browser QA harness (dev-only; needs the shared `playwright-core` install and local Chrome):

```bash
python3 -m http.server 8791 &
node tests/qa_browser.mjs
```

Screenshots land in `docs/qa-screenshots-*/`.
