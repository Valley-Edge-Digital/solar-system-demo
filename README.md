# COSMOS — Solar System Simulation

xAI showcase-style demo built from the announcement prompt:

> Make a beautiful simulation of the universe and solar system. should be sped up with adjustable time, realistic motion, orbits, stars. use threejs. Make the HUD well styled and conform to modern design principles.

## Run

No build step. Serve the folder over HTTP (ES modules + CDN Three.js):

```bash
cd solar-system-demo
python3 -m http.server 8765
```

Open **http://localhost:8765**

## Features

- **Sun + 8 planets** with procedural textures, axial tilt, and spin
- **Keplerian orbits** (eccentricity + mean anomaly)
- **Earth’s Moon** and **Galilean moons of Jupiter**
- **Saturn / Uranus rings**, asteroid belt, deep starfield, and a pooled glowing comet trail
- **Bloom** post-processing for a cinematic glow
- **Adjustable time scale** from paused → years per second
- **Modern glass HUD**: body list, focus stats, display toggles, clock
- **Tour control**: click Tour or press T to visit each body in order
- **Keyboard**: Space pause, R reset, T tour, 1–9 jump to body, 0 overview

## Stack

- Three.js r170 (CDN import map)
- OrbitControls + UnrealBloomPass
- Vanilla HTML / CSS / JS
