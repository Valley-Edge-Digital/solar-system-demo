# Skills — solar-system-demo

**WebGL/Three.js showcase demo.**

23 skills, sorted here from [MengTo/Skills](https://github.com/MengTo/Skills) on 2026-07-27.

Each folder holds `SKILL.md` (the procedure), usually `agents/openai.yaml` (the Codex/OpenAI
agent definition), and where they exist `references/`, `scripts/`, and `demo/` code.
**Demo images and video were left out** — they are ~75% of the source repo's bytes and add
nothing an agent can read. The complete originals with imagery live in `~/.claude/skills/`.

## Why this folder is not `.claude/skills/`

All 121 skills are already installed at personal scope in `~/.claude/skills/`, so Claude Code
sees them in every project. A second copy under `.claude/skills/` would shadow those by name.
This folder exists so that **Claude Desktop uploads, Codex, and any other agent** can read the
same material from inside the project.

## For Claude Desktop

Upload `UPLOAD-BUNDLE.md` — every skill in this folder concatenated into one file.

## Roster

- **`threejs`** — Use when building or debugging interactive 3D scenes on the web with Three.js (scene/camera/renderer, lights/materials, GLTF loading, controls, performance). He
- **`webgl-3d-object`** — Create a real 3D WebGL object with geometric mesh depth, physically based material, directional and ambient lighting, perspective camera, subtle rotation, and f
- **`webgl-landing-steering`** — Use when creating or refining WebGL-heavy landing pages and you need to steer toward a specific visual outcome (premium, technical, playful, cinematic) while ba
- **`webgl-laser`** — Create a fixed full-screen WebGL laser background effect with a thin white-hot vertical core, restrained brand-colored halo, and soft smoky fog around the beam.
- **`background-grid-webgl`** — "Create a perspective WebGL background grid with fading lines, subtle particle haze, slow forward drift, and gentle camera parallax."
- **`globe-gl`** — Use when implementing globe.gl (Globe.GL) for 3D globe data visualization with WebGL/ThreeJS, including setup, data layers (points, arcs, polygons, labels), and
- **`globe-particles`** — Create a globe-like 3D particle visualization with a dense luminous spherical core and thinner orbital ring or flattened disc. Use when a design needs a premium
- **`dither-background`** — Create a dark monochrome procedural background with enlarged square pixels and visible Bayer-style ordered dithering. Use when a page needs an atmospheric near-
- **`shaders-cursor-ripples`** — Add cursor-following fluid WebGPU distortion over an existing image with the Shaders library's ImageTexture and CursorRipples components. Use when a hero, galle
- **`add-shader-cursor-trail`** — "Add the Shaders WebGPU mouse effect used for the Tidal Commons hero: a white twinkling halftone cursor trail driven by ChromaFlow, masked through a DotGrid, fi
- **`thinking-orbs`** — Add accessible animated AI loading and agent-status indicators with the React thinking-orbs library. Use when a chat, copilot, voice, search, generation, or too
- **`gooey-blob-system`** — "Create a gooey blob system using SVG filters where multiple shapes merge into a single fluid form. Use overlapping circles combined with a Gaussian blur and co
- **`liquid-metal-border`** — Add and tune animated liquid-metal WebGL borders with the React `metal-fx` package. Use when buttons, icon controls, chips, tabs, cards, or selected surfaces ne
- **`ambient-section-particles`** — Add a restrained particle atmosphere inside one section with configurable shapes, density, gravity, wind, sway, rotation, recycling or settling, pointer disturb
- **`vantajs`** — Use when adding animated WebGL background effects with Vanta.js (setup, parameters, resizing, performance, integration in React/Next.js).
- **`cobejs`** — Use when adding a lightweight interactive globe with cobe (canvas setup, markers, interaction, performance, integration with React/Next.js).
- **`matterjs`** — Use when implementing 2D physics interactions with Matter.js, including Engine/World setup, Render/Runner configuration, adding bodies and constraints, and scro
- **`unicorn-studio`** — Use when embedding and customizing Unicorn Studio interactive animations on the web (embed, responsive sizing, performance, layering with UI, fallbacks).
- **`atmosphere-background`** — "Create a dark atmospheric background with drifting vertical light folds, screen-blended glow, and a concentrated luminous corner or lower-edge bloom."
- **`optimize-threejs-games`** — Profile, diagnose, and improve Three.js or WebGL game performance without regressing gameplay. Use for frame-time drops, CPU/GPU pressure, draw calls, texture a
- **`design-first-ui-prompting`** — Use when you need design-first, spec-driven, skimmable prompts for UI generation. Covers prompt structure, constraints, variations, typography/spacing rules, an
- **`audit-verify-explain-grade-5`** — Audit work, verify claims with concrete evidence, and explain the result in simple grade-5 language. Use when the user asks to review, audit, check, verify, exp
- **`article-prompts-to-skills`** — Convert an article, tutorial, or prompt pack into focused reusable AgentSkills, one independent capability per skill, with portable instructions, example prompt

---
See also `AGENTS.md` in this folder (same roster, written for Codex and other agents).
