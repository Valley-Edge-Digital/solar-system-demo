import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("tour and pooled comet stay wired into the simulation", async () => {
  const [html, main] = await Promise.all([
    readFile(new URL("../index.html", import.meta.url), "utf8"),
    readFile(new URL("../main.js", import.meta.url), "utf8"),
  ]);
  assert.match(html, /id="btn-tour"/);
  assert.match(main, /cometTrailPositions\.copyWithin/);
  assert.doesNotMatch(main, /void i;/);
});
