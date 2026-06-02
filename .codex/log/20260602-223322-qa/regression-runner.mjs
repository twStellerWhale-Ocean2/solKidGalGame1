import { createRequire } from "node:module";
import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";

const require = createRequire(import.meta.url);
const { chromium } = require("C:/Users/User/AppData/Local/Temp/codex-playwright-issue53/node_modules/playwright");

const repoRoot = "C:/Users/User/Documents/Github/solKidGalGame";
const runId = "20260602-223322";
const qaDir = path.join(repoRoot, ".codex/log", `${runId}-qa`);
const regressionDir = path.join(qaDir, "regression-surfaces");
await fs.mkdir(regressionDir, { recursive: true });

function makeUrl(selftest) {
  const q = new URLSearchParams({
    selftest,
    fresh: "1",
    v: `issue53-regression-${Date.now()}-${Math.random().toString(16).slice(2)}`
  });
  return `http://127.0.0.1:4174/?${q.toString()}#home`;
}

function relative(file) {
  return path.relative(repoRoot, file).replaceAll("\\", "/");
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

const tests = [
  { id: "save-load", selector: "#selfTestResult" },
  { id: "monkey", selector: "#monkeyTestResult" }
];
const results = [];
for (const test of tests) {
  console.log(`selftest ${test.id}`);
  const beforeConsoleCount = consoleMessages.length;
  await page.goto(makeUrl(test.id), { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForSelector(test.selector, { timeout: 12000 });
  await page.waitForTimeout(200);
  const raw = await page.locator(test.selector).textContent();
  const parsed = JSON.parse(raw);
  const screenshotPath = path.join(regressionDir, `${test.id}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: false });
  results.push({
    id: test.id,
    passed: Boolean(parsed.passed),
    result: parsed,
    screenshot: relative(screenshotPath),
    newConsoleMessages: consoleMessages.slice(beforeConsoleCount)
  });
}

await browser.close();

const screenshots = results.map((row) => path.join(repoRoot, row.screenshot));
const contactPath = path.join(qaDir, "regression-surfaces-contact.png");
execFileSync("magick", ["montage", ...screenshots, "-tile", "2x", "-geometry", "195x422+10+10", "-background", "#f7f3ff", contactPath], { cwd: repoRoot });

const report = {
  runId,
  tool: "fallback Playwright/Chromium after in-app Browser iab attach timeout",
  viewport: { width: 390, height: 844 },
  tests: results,
  passedCount: results.filter((row) => row.passed && row.newConsoleMessages.length === 0).length,
  failures: results.filter((row) => !row.passed || row.newConsoleMessages.length),
  consoleMessages,
  contact: relative(contactPath)
};

await fs.writeFile(path.join(qaDir, "regression-report.json"), JSON.stringify(report, null, 2), "utf8");
console.log(JSON.stringify({
  tests: report.tests.length,
  passed: report.passedCount,
  failures: report.failures.length,
  consoleMessages: report.consoleMessages.length,
  contact: report.contact
}, null, 2));
