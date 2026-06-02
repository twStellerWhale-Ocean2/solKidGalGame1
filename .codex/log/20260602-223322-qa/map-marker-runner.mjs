import { createRequire } from "node:module";
import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";

const require = createRequire(import.meta.url);
const { chromium } = require("C:/Users/User/AppData/Local/Temp/codex-playwright-issue53/node_modules/playwright");

const repoRoot = "C:/Users/User/Documents/Github/solKidGalGame";
const runId = "20260602-223322";
const qaDir = path.join(repoRoot, ".codex/log", `${runId}-qa`);
const markerDir = path.join(qaDir, "map-marker-surfaces");
await fs.mkdir(markerDir, { recursive: true });

function makeUrl(area) {
  const q = new URLSearchParams({
    fresh: "1",
    v: `issue53-marker-${Date.now()}-${Math.random().toString(16).slice(2)}`
  });
  return `http://127.0.0.1:4174/?${q.toString()}#${area === "castle" ? "home" : "map"}`;
}

function relative(file) {
  return path.relative(repoRoot, file).replaceAll("\\", "/");
}

function safeName(value) {
  return value.replace(/[^a-zA-Z0-9_.-]/g, "-");
}

const focusMethodByArea = {
  castle: "focusCastle",
  kingdom: "focusKingdom",
  forest: "focusForest"
};

async function markerList(page, area) {
  await page.evaluate((areaId) => {
    window.LuminaraTest.openArea(areaId);
  }, area);
  await page.waitForTimeout(240);
  return page.evaluate(() => {
    const activeView = document.querySelector(".view.active") || document;
    return [...activeView.querySelectorAll(".map-marker.hotspot[data-hotspot-id]")]
    .map((button) => ({
      id: button.dataset.hotspotId,
      label: button.dataset.label || button.getAttribute("aria-label") || button.textContent.trim(),
      ariaLabel: button.getAttribute("aria-label") || "",
      className: String(button.className || "")
    }));
  });
}

async function markerState(page, markerId) {
  return page.evaluate((id) => {
    const activeView = document.querySelector(".view.active") || document;
    const button = activeView.querySelector(`.map-marker.hotspot[data-hotspot-id="${id}"]`);
    const rect = button?.getBoundingClientRect();
    const centerX = rect ? rect.left + (rect.width / 2) : -1;
    const centerY = rect ? rect.top + (rect.height / 2) : -1;
    const top = rect && centerX >= 0 && centerY >= 0 && centerX <= innerWidth && centerY <= innerHeight
      ? document.elementFromPoint(centerX, centerY)
      : null;
    return {
      exists: Boolean(button),
      label: button?.dataset.label || button?.getAttribute("aria-label") || "",
      className: String(button?.className || ""),
      box: rect ? {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        w: Math.round(rect.width),
        h: Math.round(rect.height),
        inViewport: rect.x >= 0 && rect.y >= 0 && rect.right <= innerWidth && rect.bottom <= innerHeight
      } : null,
      hitTarget: Boolean(top && button && (top === button || button.contains(top) || top.closest("button") === button)),
      activeView: [...document.querySelectorAll(".view")].find((view) => view.classList.contains("active"))?.id || "",
      advOpen: document.querySelector("#advModal")?.getAttribute("aria-hidden") === "false",
      advMode: document.querySelector("#advScene")?.dataset.mode || "",
      advTitle: document.querySelector("#advTitle")?.textContent || "",
      statusMessage: document.querySelector("#statusMessage")?.textContent || "",
      hash: location.hash
    };
  }, markerId);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  isMobile: true
});
const page = await context.newPage();
const consoleMessages = [];
page.on("console", (msg) => {
  if (["error", "warning"].includes(msg.type())) {
    consoleMessages.push({ type: msg.type(), text: msg.text(), url: page.url() });
  }
});

const results = [];
for (const area of ["castle", "kingdom", "forest"]) {
  console.log(`area ${area}`);
  await page.goto(makeUrl(area), { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForFunction(() => Boolean(window.LuminaraTest), null, { timeout: 12000 });
  const markers = await markerList(page, area);
  for (const marker of markers) {
    console.log(`  marker ${area}/${marker.id}`);
    await page.goto(makeUrl(area), { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForFunction(() => Boolean(window.LuminaraTest), null, { timeout: 12000 });
    await page.evaluate(({ method, id }) => {
      window.LuminaraTest[method](id);
    }, { method: focusMethodByArea[area], id: marker.id });
    await page.waitForTimeout(260);
    const screenshotPath = path.join(markerDir, `${safeName(area)}-${safeName(marker.id)}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    const before = await markerState(page, marker.id);
    const beforeConsoleCount = consoleMessages.length;
    const result = {
      area,
      markerId: marker.id,
      label: marker.label,
      ariaLabel: marker.ariaLabel,
      screenshot: relative(screenshotPath),
      before,
      status: "pending"
    };
    if (!before.exists) {
      result.status = "missing";
    } else if (!before.box?.inViewport || !before.hitTarget) {
      result.status = "not-user-clickable-after-focus";
    } else {
      try {
        await page.locator(`.map-marker.hotspot[data-hotspot-id="${marker.id}"]`).click({ timeout: 4000 });
        await page.waitForTimeout(260);
        result.after = await markerState(page, marker.id);
        result.status = "clicked";
      } catch (error) {
        result.status = "click-failed";
        result.error = String(error);
      }
    }
    result.newConsoleMessages = consoleMessages.slice(beforeConsoleCount);
    result.conclusion = result.status === "clicked" && result.newConsoleMessages.length === 0 ? "Accept" : "Needs Review";
    results.push(result);
  }
}

await browser.close();

const screenshots = results.map((row) => path.join(repoRoot, row.screenshot));
const contactPath = path.join(qaDir, "map-marker-surfaces-contact.png");
execFileSync("magick", ["montage", ...screenshots, "-tile", "5x", "-geometry", "156x338+8+8", "-background", "#eef7ff", contactPath], { cwd: repoRoot });

const report = {
  runId,
  tool: "fallback Playwright/Chromium after in-app Browser iab attach timeout",
  viewport: { width: 390, height: 844 },
  markerCount: results.length,
  clickedCount: results.filter((row) => row.status === "clicked").length,
  failures: results.filter((row) => row.conclusion !== "Accept"),
  consoleMessages,
  contact: relative(contactPath),
  results
};

await fs.writeFile(path.join(qaDir, "map-marker-action-report.json"), JSON.stringify(report, null, 2), "utf8");
console.log(JSON.stringify({
  markers: report.markerCount,
  clicked: report.clickedCount,
  failures: report.failures.length,
  consoleMessages: report.consoleMessages.length,
  contact: report.contact
}, null, 2));
