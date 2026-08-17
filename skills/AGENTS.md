# AGENTS.md — skills available in this project

For Codex, Kimi, Gemini, and any other agent reading this repo. Claude Code loads these from
`~/.claude/skills/` automatically; you probably cannot, so read them from `skills/` here.

## Project

WebGL/Three.js showcase demo.

## How to use a skill

1. Read `skills/<name>/SKILL.md` **before** writing code for that subject.
2. `skills/<name>/agents/openai.yaml` carries the OpenAI/Codex invocation contract
   (`display_name`, `short_description`, `default_prompt`) — use its `default_prompt` verbatim
   when registering the skill.
3. `references/` and `scripts/` are the skill's own supporting material; `demo/` holds a
   working implementation (`index.html`, `PROMPT.md`) with its imagery stripped.

## House rules that outrank any skill here

- These are **borrowed, unvetted** third-party skills (MengTo/Skills, 2026-07-27). They carry no
  accessibility or reduced-motion guarantee. Audit their output; do not ship it as-is.
- The project's own `CLAUDE.md` / `AGENTS.md` / doctrine skills **always win** on conflict.
- Provenance rule: never claim a skill's procedure was followed or verified unless it was.

## Roster (23)

| Skill | Codex agent file | What it does |
|---|---|---|
| `threejs` | — | Use when building or debugging interactive 3D scenes on the web with Three.js (scene/camera/renderer, lights/materials, GLTF loading, contro |
| `webgl-3d-object` | — | Create a real 3D WebGL object with geometric mesh depth, physically based material, directional and ambient lighting, perspective camera, su |
| `webgl-landing-steering` | — | Use when creating or refining WebGL-heavy landing pages and you need to steer toward a specific visual outcome (premium, technical, playful, |
| `webgl-laser` | — | Create a fixed full-screen WebGL laser background effect with a thin white-hot vertical core, restrained brand-colored halo, and soft smoky  |
| `background-grid-webgl` | — | "Create a perspective WebGL background grid with fading lines, subtle particle haze, slow forward drift, and gentle camera parallax." |
| `globe-gl` | — | Use when implementing globe.gl (Globe.GL) for 3D globe data visualization with WebGL/ThreeJS, including setup, data layers (points, arcs, po |
| `globe-particles` | — | Create a globe-like 3D particle visualization with a dense luminous spherical core and thinner orbital ring or flattened disc. Use when a de |
| `dither-background` | — | Create a dark monochrome procedural background with enlarged square pixels and visible Bayer-style ordered dithering. Use when a page needs  |
| `shaders-cursor-ripples` | `agents/openai.yaml` | Add cursor-following fluid WebGPU distortion over an existing image with the Shaders library's ImageTexture and CursorRipples components. Us |
| `add-shader-cursor-trail` | `agents/openai.yaml` | "Add the Shaders WebGPU mouse effect used for the Tidal Commons hero: a white twinkling halftone cursor trail driven by ChromaFlow, masked t |
| `thinking-orbs` | `agents/openai.yaml` | Add accessible animated AI loading and agent-status indicators with the React thinking-orbs library. Use when a chat, copilot, voice, search |
| `gooey-blob-system` | — | "Create a gooey blob system using SVG filters where multiple shapes merge into a single fluid form. Use overlapping circles combined with a  |
| `liquid-metal-border` | `agents/openai.yaml` | Add and tune animated liquid-metal WebGL borders with the React `metal-fx` package. Use when buttons, icon controls, chips, tabs, cards, or  |
| `ambient-section-particles` | `agents/openai.yaml` | Add a restrained particle atmosphere inside one section with configurable shapes, density, gravity, wind, sway, rotation, recycling or settl |
| `vantajs` | — | Use when adding animated WebGL background effects with Vanta.js (setup, parameters, resizing, performance, integration in React/Next.js). |
| `cobejs` | — | Use when adding a lightweight interactive globe with cobe (canvas setup, markers, interaction, performance, integration with React/Next.js). |
| `matterjs` | — | Use when implementing 2D physics interactions with Matter.js, including Engine/World setup, Render/Runner configuration, adding bodies and c |
| `unicorn-studio` | — | Use when embedding and customizing Unicorn Studio interactive animations on the web (embed, responsive sizing, performance, layering with UI |
| `atmosphere-background` | — | "Create a dark atmospheric background with drifting vertical light folds, screen-blended glow, and a concentrated luminous corner or lower-e |
| `optimize-threejs-games` | `agents/openai.yaml` | Profile, diagnose, and improve Three.js or WebGL game performance without regressing gameplay. Use for frame-time drops, CPU/GPU pressure, d |
| `design-first-ui-prompting` | — | Use when you need design-first, spec-driven, skimmable prompts for UI generation. Covers prompt structure, constraints, variations, typograp |
| `audit-verify-explain-grade-5` | `agents/openai.yaml` | Audit work, verify claims with concrete evidence, and explain the result in simple grade-5 language. Use when the user asks to review, audit |
| `article-prompts-to-skills` | `agents/openai.yaml` | Convert an article, tutorial, or prompt pack into focused reusable AgentSkills, one independent capability per skill, with portable instruct |
