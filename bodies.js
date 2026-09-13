/**
 * bodies.js — pure data: orbital elements + visual/aesthetic parameters.
 * No three.js, no DOM. Unit-testable in plain Node.
 *
 * Orbital elements: JPL "Approximate Positions of the Planets", Table 1
 * (valid 1800–2050 AD), https://ssd.jpl.nasa.gov/planets/approx_pos.html
 * Pluto: elements from the historical version of the same table (Pluto was
 * removed from the current publication) — treated as aesthetic accuracy.
 *
 * Radii are aesthetic (readability), not to scale. Distances are real
 * (in AU) at a compressed scene scale set in main.js.
 */

export const BODIES = [
  {
    id: "sun",
    name: "Sun",
    type: "G-type main-sequence star",
    color: 0xffc266,
    emissive: 0xffaa33,
    radius: 4.2,
    rotationDays: 25.4,
    tilt: 7.25,
    info: { mass: "1 M☉", diameter: "1.39M km", temp: "5,772 K" },
  },
  {
    id: "mercury",
    name: "Mercury",
    type: "Terrestrial planet",
    color: 0xb5a89a,
    radius: 0.38,
    rotationDays: 58.6,
    tilt: 0.03,
    texture: "cratered",
    elements: {
      a0: 0.38709927, aDot: 0.00000037,
      e0: 0.20563593, eDot: 0.00001906,
      i0: 7.00497902, iDot: -0.00594749,
      L0: 252.25032350, LDot: 149472.67411175,
      lp0: 77.45779628, lpDot: 0.16047689,
      node0: 48.33076593, nodeDot: -0.12534081,
    },
    info: { mass: "0.055 M⊕", diameter: "4,879 km", day: "176 Earth days" },
  },
  {
    id: "venus",
    name: "Venus",
    type: "Terrestrial planet",
    color: 0xe8cda0,
    radius: 0.95,
    rotationDays: -243, // retrograde
    tilt: 177.4,
    texture: "venus",
    atmosphere: 0xffe0b0,
    elements: {
      a0: 0.72333566, aDot: 0.00000390,
      e0: 0.00677672, eDot: -0.00004107,
      i0: 3.39467605, iDot: -0.00078890,
      L0: 181.97909950, LDot: 58517.81538729,
      lp0: 131.60246718, lpDot: 0.00268329,
      node0: 76.67984255, nodeDot: -0.27769418,
    },
    info: { mass: "0.815 M⊕", diameter: "12,104 km", day: "243 Earth days" },
  },
  {
    id: "earth",
    name: "Earth",
    type: "Terrestrial planet",
    color: 0x4a90d9,
    radius: 1.0,
    rotationDays: 0.997,
    tilt: 23.44,
    texture: "earth",
    atmosphere: 0x6eb6ff,
    clouds: true,
    moons: [
      {
        id: "moon",
        name: "Moon",
        color: 0xc8c8c8,
        radius: 0.27,
        orbitDist: 2.4,
        periodDays: 27.3,
        texture: "cratered",
      },
    ],
    elements: {
      a0: 1.00000261, aDot: 0.00000562,
      e0: 0.01671123, eDot: -0.00004392,
      i0: -0.00001531, iDot: -0.01294668,
      L0: 100.46457166, LDot: 35999.37244981,
      lp0: 102.93768193, lpDot: 0.32327364,
      node0: 0.0, nodeDot: 0.0,
    },
    info: { mass: "1 M⊕", diameter: "12,742 km", day: "24 hours" },
  },
  {
    id: "mars",
    name: "Mars",
    type: "Terrestrial planet",
    color: 0xc1440e,
    radius: 0.53,
    rotationDays: 1.026,
    tilt: 25.19,
    texture: "mars",
    elements: {
      a0: 1.52371034, aDot: 0.00001847,
      e0: 0.09339410, eDot: 0.00007882,
      i0: 1.84969142, iDot: -0.00813131,
      L0: -4.55343205, LDot: 19140.30268499,
      lp0: -23.94362959, lpDot: 0.44441088,
      node0: 49.55953891, nodeDot: -0.29257343,
    },
    info: { mass: "0.107 M⊕", diameter: "6,779 km", day: "24.6 hours" },
  },
  {
    id: "jupiter",
    name: "Jupiter",
    type: "Gas giant",
    color: 0xd4a574,
    radius: 2.8,
    rotationDays: 0.414,
    tilt: 3.13,
    texture: "bands",
    bands: { colors: ["#c8a97e", "#e8d3ae", "#a67c52", "#f0e2c4", "#8f6844", "#d9bf94"] },
    moons: [
      { id: "io", name: "Io", color: 0xf0e68c, radius: 0.22, orbitDist: 4.2, periodDays: 1.77 },
      { id: "europa", name: "Europa", color: 0xd8cfc0, radius: 0.19, orbitDist: 5.4, periodDays: 3.55 },
      { id: "ganymede", name: "Ganymede", color: 0xa09080, radius: 0.28, orbitDist: 6.8, periodDays: 7.15 },
      { id: "callisto", name: "Callisto", color: 0x6b6b6b, radius: 0.25, orbitDist: 8.5, periodDays: 16.7, texture: "cratered" },
    ],
    elements: {
      a0: 5.20288700, aDot: -0.00011607,
      e0: 0.04838624, eDot: -0.00013253,
      i0: 1.30439695, iDot: -0.00183714,
      L0: 34.39644051, LDot: 3034.74612775,
      lp0: 14.72847983, lpDot: 0.21252668,
      node0: 100.47390909, nodeDot: 0.20469106,
    },
    info: { mass: "318 M⊕", diameter: "139,820 km", day: "9.9 hours" },
  },
  {
    id: "saturn",
    name: "Saturn",
    type: "Gas giant",
    color: 0xe8d5a3,
    radius: 2.35,
    rotationDays: 0.444,
    tilt: 26.73,
    texture: "bands",
    bands: { colors: ["#e3d3a8", "#f0e3bd", "#cbb784", "#f5ecd0", "#b9a26e", "#e8d9b0"], soft: true },
    rings: { inner: 1.4, outer: 2.35, color: 0xc9b896 },
    moons: [
      { id: "titan", name: "Titan", color: 0xd8a24a, radius: 0.26, orbitDist: 5.6, periodDays: 15.9 },
    ],
    elements: {
      a0: 9.53667594, aDot: -0.00125060,
      e0: 0.05386179, eDot: -0.00050991,
      i0: 2.48599187, iDot: 0.00193609,
      L0: 49.95424423, LDot: 1222.49362201,
      lp0: 92.59887831, lpDot: -0.41897216,
      node0: 113.66242448, nodeDot: -0.28867794,
    },
    info: { mass: "95 M⊕", diameter: "116,460 km", day: "10.7 hours" },
  },
  {
    id: "uranus",
    name: "Uranus",
    type: "Ice giant",
    color: 0x7de3e0,
    radius: 1.55,
    rotationDays: -0.718,
    tilt: 97.77,
    texture: "ice",
    atmosphere: 0x7de3e0,
    rings: { inner: 1.25, outer: 1.7, color: 0x9ad4d2, opacity: 0.35 },
    elements: {
      a0: 19.18916464, aDot: -0.00196176,
      e0: 0.04725744, eDot: -0.00004397,
      i0: 0.77263783, iDot: -0.00242939,
      L0: 313.23810451, LDot: 428.48202785,
      lp0: 170.95427630, lpDot: 0.40805281,
      node0: 74.01692503, nodeDot: 0.04240589,
    },
    info: { mass: "14.5 M⊕", diameter: "50,724 km", day: "17.2 hours" },
  },
  {
    id: "neptune",
    name: "Neptune",
    type: "Ice giant",
    color: 0x4166f5,
    radius: 1.5,
    rotationDays: 0.671,
    tilt: 28.32,
    texture: "ice",
    atmosphere: 0x5f7dff,
    elements: {
      a0: 30.06992276, aDot: 0.00026291,
      e0: 0.00859048, eDot: 0.00005105,
      i0: 1.77004347, iDot: 0.00035372,
      L0: -55.12002969, LDot: 218.45945325,
      lp0: 44.96476227, lpDot: -0.32241464,
      node0: 131.78422574, nodeDot: -0.00508664,
    },
    info: { mass: "17 M⊕", diameter: "49,244 km", day: "16.1 hours" },
  },
  {
    id: "pluto",
    name: "Pluto",
    type: "Dwarf planet",
    color: 0xcbb8a3,
    radius: 0.19,
    rotationDays: -6.39,
    tilt: 122.5,
    texture: "cratered",
    elements: {
      a0: 39.48211675, aDot: -0.00031596,
      e0: 0.24882730, eDot: 0.00005170,
      i0: 17.14001206, iDot: 0.00004818,
      L0: 238.92903833, LDot: 145.20780515,
      lp0: 224.06891629, lpDot: -0.04062942,
      node0: 110.30393684, nodeDot: -0.01183482,
    },
    info: { mass: "0.002 M⊕", diameter: "2,377 km", day: "6.4 Earth days" },
  },
];

/**
 * Stylized long-period visitor. Elements are aesthetic (Halley-flavored:
 * high eccentricity, inclined) but evaluated through the same ephemeris
 * pipeline as the planets.
 */
export const COMET = {
  name: "Halley-like comet",
  color: 0xe8fbff,
  trailColor: 0x9bdcff,
  elements: {
    a0: 5.8, aDot: 0,
    e0: 0.84, eDot: 0,
    i0: 12.0, iDot: 0,
    L0: 180.0, LDot: 64.97, // ~3490-day period
    lp0: 60.0, lpDot: 0,
    node0: 300.0, nodeDot: 0,
  },
};
