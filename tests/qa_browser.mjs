/**
 * QA pass for COSMOS: console errors, HUD wiring, interactions, FPS, screenshots.
 * Run: node tests/qa_browser.mjs  (expects the demo served on :8765)
 * Uses the shared playwright-core install in ~/.scratch/pw-qs.
 */
import { chromium } from "/home/itzswazi/.scratch/pw-qs/node_modules/playwright-core/index.mjs";
import fs from "node:fs";

const BASE = "http://localhost:8791";
const OUT = "/home/itzswazi/Documents/Projects/solar-system-demo/docs/qa-screenshots-2026-09-13";
fs.mkdirSync(OUT, { recursive: true });

const errors = [];
const failures = [];
const check = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}: ${name}${detail ? " — " + detail : ""}`);
  if (!cond) failures.push(name);
};

const browser = await chromium.launch({
  executablePath: "/usr/bin/google-chrome",
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--use-angle=vulkan",
    "--enable-features=Vulkan",
    "--enable-gpu",
    "--ignore-gpu-blocklist",
  ],
});

const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
page.on("pageerror", (e) => errors.push(`pageerror: ${e}`));
page.on("console", (m) => m.type() === "error" && errors.push(`console.error: ${m.text()}`));

await page.goto(BASE, { waitUntil: "networkidle" });
try {
  await page.waitForSelector("#loading.done", { state: "attached", timeout: 45000 });
} catch (e) {
  console.log("LOADING NEVER COMPLETED. Errors captured so far:");
  errors.forEach((e2) => console.log("  " + e2));
  await page.screenshot({ path: `${OUT}/00-stuck.png` });
  await browser.close();
  process.exit(1);
}
await page.waitForTimeout(2500);

check("no fatal overlay", (await page.locator("#fatal-overlay.visible").count()) === 0);
check("canvas present", (await page.locator("#canvas-container canvas").count()) === 1);

const simDate = await page.textContent("#sim-date");
check("sim date opens on the real sky", simDate?.startsWith("2026-"), simDate ?? "");

const bodyCount = await page.locator(".body-item").count();
check("body list has 10 entries", bodyCount === 10, `got ${bodyCount}`);
check("badge count is 10", (await page.textContent("#body-count")) === "10");

await page.screenshot({ path: `${OUT}/01-overview.png` });

// Focus Earth via the body list
await page.click('.body-item[data-id="earth"]');
await page.waitForTimeout(1800);
check("focus card shows Earth", (await page.textContent("#focus-name")) === "Earth");
await page.screenshot({ path: `${OUT}/02-earth-focus.png` });

// Help overlay
await page.click("#btn-help");
await page.waitForTimeout(400);
check("help overlay opens", (await page.locator("#help-overlay.visible").count()) === 1);
await page.screenshot({ path: `${OUT}/03-help.png` });
await page.keyboard.press("Escape");
await page.waitForTimeout(400);
check("help overlay closes on Escape", (await page.locator("#help-overlay.visible").count()) === 0);

// Pause / resume
await page.keyboard.press("Space");
await page.waitForTimeout(300);
check("space pauses", (await page.textContent("#status-text")) === "Paused");
await page.keyboard.press("Space");
await page.waitForTimeout(300);
check("space resumes", (await page.textContent("#status-text")) === "Running");

// Tour
await page.keyboard.press("t");
await page.waitForTimeout(1500);
check("tour focuses a body", (await page.textContent("#focus-name")) !== "Solar System");

// Visual spot checks
await page.click('.body-item[data-id="jupiter"]');
await page.waitForTimeout(1800);
await page.screenshot({ path: `${OUT}/04-jupiter.png` });

await page.click('.body-item[data-id="saturn"]');
await page.waitForTimeout(1800);
await page.screenshot({ path: `${OUT}/05-saturn.png` });

await page.click('.body-item[data-id="pluto"]');
await page.waitForTimeout(1800);
check("focus card shows Pluto", (await page.textContent("#focus-name")) === "Pluto");
check("Pluto type is dwarf planet", (await page.textContent("#focus-type")) === "Dwarf planet");
await page.screenshot({ path: `${OUT}/06-pluto.png` });

const dist = await page.textContent("#focus-dist");
check("live sun-distance stat", !!dist && dist.includes("AU"), dist ?? "empty");

// Back to overview, then fast-forward and check FPS
await page.keyboard.press("0");
await page.waitForTimeout(1500);
await page.locator("#speed-slider").evaluate((el) => {
  el.value = 55;
  el.dispatchEvent(new Event("input"));
});
await page.waitForTimeout(3000);
const fpsText = await page.textContent("#fps-counter");
const fps = parseInt(fpsText ?? "0", 10);
check("FPS healthy at ~30 days/sec", fps >= 30, fpsText ?? "");
await page.screenshot({ path: `${OUT}/07-fast-forward.png` });

// Labels toggle
await page.locator("#toggle-labels").evaluate((el) => el.click());
await page.waitForTimeout(600);
const visibleLabels = await page.locator(".world-label.visible").count();
check("labels toggle hides all labels", visibleLabels === 0, `${visibleLabels} still visible`);

// Mobile viewport
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT}/08-mobile.png` });

check("zero console/page errors overall", errors.length === 0, errors.slice(0, 5).join("; "));

await browser.close();

console.log();
if (failures.length) {
  console.log("FAILURES:", failures.join(", "));
  process.exit(1);
}
console.log("ALL CHECKS PASSED");
