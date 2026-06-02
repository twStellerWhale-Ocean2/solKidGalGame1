import { createRequire } from "node:module";
import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("C:/Users/User/AppData/Local/Temp/codex-playwright-issue53/node_modules/playwright");

const repoRoot = "C:/Users/User/Documents/Github/solKidGalGame";
const runId = "20260602-223322";
const qaDir = path.join(repoRoot, ".codex/log", `${runId}-qa`);
const surfaceDir = path.join(qaDir, "full-flow-surfaces");
await fs.mkdir(surfaceDir, { recursive: true });

const categoryIds = ["hairstyle", "top", "bottom", "dress", "outer", "shoes", "accessory"];
const scenePlaces = [
  "accessoryShop",
  "boutique",
  "cave",
  "dwarfCottage",
  "farm",
  "forestEdge",
  "forestExit",
  "garden",
  "harbor",
  "lighthouse",
  "luminaraCastle",
  "market",
  "mountainPeak",
  "port",
  "shoeShop",
  "treeSpirit"
];
const shopPlaces = ["accessoryShop", "boutique", "dwarfCottage", "market", "shoeShop"];
const questPlaces = [
  "accessoryShop",
  "boutique",
  "cave",
  "dwarfCottage",
  "farm",
  "garden",
  "harbor",
  "lighthouse",
  "market",
  "mountainPeak",
  "shoeShop",
  "treeSpirit"
];

function makeUrl(params = {}, hash = "home") {
  const q = new URLSearchParams({
    ...params,
    v: `issue53-flow-${Date.now()}-${Math.random().toString(16).slice(2)}`
  });
  return `http://127.0.0.1:4174/?${q.toString()}#${hash}`;
}

const surfaces = [
  { id: "home-castle-map", kind: "map", url: () => makeUrl({ fresh: "1" }, "home") },
  { id: "castle-map-selftest", kind: "map", url: () => makeUrl({ selftest: "visual-qa", surface: "castle-map", fresh: "1" }, "home") },
  { id: "kingdom-map", kind: "map", url: () => makeUrl({ selftest: "visual-qa", surface: "kingdom-map", fresh: "1" }, "map") },
  { id: "forest-map", kind: "map", url: () => makeUrl({ selftest: "visual-qa", surface: "forest-map", fresh: "1" }, "map") },
  { id: "princess-room-scene", kind: "scene", url: () => makeUrl({ selftest: "visual-qa", surface: "princess-room-scene", fresh: "1", owned: "all" }, "home") },
  ...categoryIds.map((category) => ({
    id: `wardrobe-${category}`,
    kind: "wardrobe",
    url: () => makeUrl({ selftest: "visual-qa", surface: "wardrobe-detail", fresh: "1", owned: "all", category }, "home")
  })),
  ...scenePlaces.map((place) => ({
    id: `scene-${place}`,
    kind: "scene",
    url: () => makeUrl({ selftest: "visual-qa", surface: "shop-scene", fresh: "1", place, owned: "all", coins: "999" }, "map")
  })),
  ...shopPlaces.map((place) => ({
    id: `shop-${place}`,
    kind: "shop",
    url: () => makeUrl({ selftest: "visual-qa", surface: "shop-detail", fresh: "1", place, owned: "softBrownHair,starterPajama", coins: "999" }, "map")
  })),
  ...shopPlaces.map((place) => ({
    id: `refund-${place}`,
    kind: "refund",
    url: () => makeUrl({ selftest: "visual-qa", surface: "refund-detail", fresh: "1", place, owned: "all", coins: "999" }, "map")
  })),
  ...questPlaces.map((place) => ({
    id: `quest-${place}`,
    kind: "quest",
    url: () => makeUrl({ selftest: "visual-qa", surface: "quest", fresh: "1", place }, "map")
  })),
  { id: "hint-garden", kind: "hint", url: () => makeUrl({ selftest: "visual-qa", surface: "hint", fresh: "1", place: "garden" }, "map") },
  { id: "system-diary", kind: "system", url: () => makeUrl({ fresh: "1" }, "diary") },
  { id: "system-settings", kind: "system", url: () => makeUrl({ fresh: "1" }, "settings") },
  { id: "system-save-load", kind: "system", url: () => makeUrl({ fresh: "1" }, "save") }
];

function relative(file) {
  return path.relative(repoRoot, file).replaceAll("\\", "/");
}

function safeName(value) {
  return value.replace(/[^a-zA-Z0-9_.-]/g, "-");
}

async function visibleButtons(page) {
  return page.evaluate(() => {
    const visible = (el) => {
      const box = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      if (box.width <= 0 || box.height <= 0 || style.visibility === "hidden" || style.display === "none" || el.closest("[hidden], [aria-hidden='true']")) {
        return false;
      }
      const centerX = box.left + (box.width / 2);
      const centerY = box.top + (box.height / 2);
      if (centerX < 0 || centerY < 0 || centerX > innerWidth || centerY > innerHeight) {
        return false;
      }
      const top = document.elementFromPoint(centerX, centerY);
      return Boolean(top && (top === el || el.contains(top) || top.closest("button") === el));
    };
    const buttons = [...document.querySelectorAll("button")].filter(visible);
    buttons.forEach((button, index) => {
      button.dataset.qaClickIndex = String(index);
    });
    return buttons.map((button, index) => ({
      index,
      label: button.getAttribute("aria-label") || button.textContent.replace(/\s+/g, " ").trim() || button.dataset.hotspotId || button.dataset.destinationId || button.dataset.itemId || button.id || button.className,
      text: button.textContent.replace(/\s+/g, " ").trim(),
      id: button.id || "",
      className: String(button.className || ""),
      disabled: button.disabled,
      box: (() => {
        const b = button.getBoundingClientRect();
        return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height), inViewport: b.x >= 0 && b.y >= 0 && b.right <= innerWidth && b.bottom <= innerHeight };
      })()
    }));
  });
}

async function visibleState(page) {
  return page.evaluate(() => ({
    url: location.href,
    hash: location.hash,
    innerWidth,
    innerHeight,
    visualViewport: window.visualViewport ? { width: window.visualViewport.width, height: window.visualViewport.height, scale: window.visualViewport.scale } : null,
    bodyClasses: document.body.className,
    activeView: [...document.querySelectorAll(".view")].find((view) => view.classList.contains("active"))?.id || "",
    advOpen: document.querySelector("#advModal")?.getAttribute("aria-hidden") === "false",
    advMode: document.querySelector("#advScene")?.dataset.mode || "",
    advTitle: document.querySelector("#advTitle")?.textContent || "",
    visibleText: document.body.textContent.replace(/\s+/g, " ").trim().slice(0, 220),
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1
  }));
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  isMobile: true,
  acceptDownloads: true
});
const page = await context.newPage();
const consoleMessages = [];
const dialogs = [];
const downloads = [];

page.on("console", (msg) => {
  if (["error", "warning"].includes(msg.type())) {
    consoleMessages.push({ type: msg.type(), text: msg.text(), url: page.url() });
  }
});
page.on("dialog", async (dialog) => {
  dialogs.push({ type: dialog.type(), message: dialog.message(), url: page.url() });
  await dialog.dismiss();
});
page.on("download", (download) => {
  downloads.push({ suggestedFilename: download.suggestedFilename(), url: page.url() });
});

const surfaceResults = [];
for (let si = 0; si < surfaces.length; si += 1) {
  const surface = surfaces[si];
  console.log(`surface ${si + 1}/${surfaces.length}: ${surface.id}`);
  const url = surface.url();
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForTimeout(300);
  const screenshotName = safeName(`${String(si + 1).padStart(2, "0")}-${surface.id}.png`);
  const screenshotPath = path.join(surfaceDir, screenshotName);
  await page.screenshot({ path: screenshotPath, fullPage: false });
  const initialState = await visibleState(page);
  const buttons = await visibleButtons(page);
  const buttonResults = [];
  for (const button of buttons) {
    await page.goto(surface.url(), { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(180);
    const refreshedButtons = await visibleButtons(page);
    const target = refreshedButtons.find((candidate) => candidate.index === button.index);
    const beforeConsoleCount = consoleMessages.length;
    const result = { index: button.index, label: button.label, beforeBox: button.box, status: "pending" };
    if (!target) {
      result.status = "missing-on-reload";
    } else if (target.disabled) {
      result.status = "disabled-visible";
    } else {
      try {
        await page.locator(`[data-qa-click-index="${button.index}"]`).click({ timeout: 3500, force: true });
        await page.waitForTimeout(220);
        result.status = "clicked";
        result.after = await visibleState(page);
      } catch (error) {
        result.status = "click-failed";
        result.error = String(error);
      }
    }
    result.newConsoleMessages = consoleMessages.slice(beforeConsoleCount);
    buttonResults.push(result);
  }
  surfaceResults.push({
    id: surface.id,
    kind: surface.kind,
    url,
    screenshot: relative(screenshotPath),
    initialState,
    buttons,
    buttonResults,
    conclusion: buttonResults.some((item) => item.status === "click-failed" || item.status === "missing-on-reload" || item.newConsoleMessages.length) || initialState.horizontalOverflow ? "Needs Review" : "Accept"
  });
}

await browser.close();

const surfacePngs = surfaceResults.map((row) => path.join(repoRoot, row.screenshot));
const surfaceContact = path.join(qaDir, "full-flow-surfaces-contact.png");
execFileSync("magick", ["montage", ...surfacePngs, "-tile", "5x", "-geometry", "156x338+8+8", "-background", "#fff4f8", surfaceContact], { cwd: repoRoot });

const failures = surfaceResults.flatMap((surface) => surface.buttonResults
  .filter((button) => button.status === "click-failed" || button.status === "missing-on-reload" || button.newConsoleMessages.length)
  .map((button) => ({ surface: surface.id, ...button })));

const report = {
  runId,
  tool: "fallback Playwright/Chromium after in-app Browser iab attach timeout",
  viewport: { width: 390, height: 844 },
  surfacesCount: surfaceResults.length,
  buttonsCount: surfaceResults.reduce((sum, surface) => sum + surface.buttons.length, 0),
  clickedCount: surfaceResults.reduce((sum, surface) => sum + surface.buttonResults.filter((button) => button.status === "clicked").length, 0),
  disabledVisibleCount: surfaceResults.reduce((sum, surface) => sum + surface.buttonResults.filter((button) => button.status === "disabled-visible").length, 0),
  failures,
  dialogs,
  downloads,
  consoleMessages,
  surfaceContact: relative(surfaceContact),
  surfaces: surfaceResults
};

await fs.writeFile(path.join(qaDir, "full-flow-action-report.json"), JSON.stringify(report, null, 2), "utf8");
console.log(JSON.stringify({
  surfaces: report.surfacesCount,
  buttons: report.buttonsCount,
  clicked: report.clickedCount,
  disabledVisible: report.disabledVisibleCount,
  failures: report.failures.length,
  consoleMessages: report.consoleMessages.length,
  dialogs: report.dialogs.length,
  downloads: report.downloads.length,
  surfaceContact: report.surfaceContact
}, null, 2));
