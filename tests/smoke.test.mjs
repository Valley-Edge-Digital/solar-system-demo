import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import test from "node:test";

const readSrc = (name) => readFile(new URL(`../${name}`, import.meta.url), "utf8");

test("tour and pooled comet stay wired into the simulation", async () => {
  const [html, main] = await Promise.all([readSrc("index.html"), readSrc("main.js")]);
  assert.match(html, /id="btn-tour"/);
  assert.match(main, /cometTrailPositions\.copyWithin/);
  assert.doesNotMatch(main, /void i;/);
});

test("every DOM id referenced from main.js exists in index.html", async () => {
  const [html, main] = await Promise.all([readSrc("index.html"), readSrc("main.js")]);
  const ids = new Set([...main.matchAll(/getElementById\("([^"]+)"\)/g)].map((m) => m[1]));
  ids.delete("focus-dist"); // created dynamically inside the focus card
  assert.ok(ids.size > 10, "expected to find HUD id references");
  for (const id of ids) {
    assert.ok(html.includes(`id="${id}"`), `index.html is missing #${id}`);
  }
});

test("every JS module parses as an ES module", async () => {
  for (const file of ["main.js", "orbits.js", "bodies.js", "textures.js"]) {
    const src = await readSrc(file);
    const res = spawnSync(process.execPath, ["--input-type=module", "--check"], {
      input: src,
      encoding: "utf8",
    });
    assert.equal(res.status, 0, `${file} failed syntax check:\n${res.stderr}`);
  }
});
