#!/usr/bin/env node
// scripts/assetLint.mjs — issue #197：圖像資產標準尺寸與檔重預算之「檔案系統」gate（intTest#49）。
// 掃描 content-base/ 與 content-package/ 下「全部」圖像檔（不只 registry/CSS 引用者），
// 依 classifyAssetPath 歸類，比對 assetStandards（exact 等於／bound 容於 ＋ maxKB 檔重預算）；
// 未分類即報為漏網（orphan／CSS-only／裝飾資產也須登記類別），杜絕過大圖檔以未引用檔形式 ship。
// 與瀏覽器 data-audit 共用同一 SSOT（content-package/_shared/asset-standards.js）。
// 用法：node scripts/assetLint.mjs ；0 違規 → exit 0，否則列出並 exit 違規數。
import { readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { assetStandards, classifyAssetPath, assetSizeExemptions } from "../content-package/_shared/asset-standards.js";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const IMG = /\.(webp|png|jpe?g)$/i;
const ROOTS = ["content-base", "content-package"];

function walk(dir, acc) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (IMG.test(e.name)) acc.push(p);
  }
  return acc;
}

function imageDims(file) {
  // 取第一幀尺寸；ImageMagick 對 webp/png/jpg 皆可。
  const out = execFileSync("magick", ["identify", "-format", "%w %h\n", file], { encoding: "utf8" });
  const [w, h] = out.trim().split("\n")[0].trim().split(/\s+/).map(Number);
  return { w, h };
}

const files = [];
for (const r of ROOTS) walk(join(root, r), files);

const violations = [];
let checked = 0;
for (const abs of files) {
  const rel = abs.slice(root.length + 1).split(/[\\/]/).join("/");
  const cls = classifyAssetPath(rel);
  if (!cls) { violations.push(`未涵蓋漏網類別：${rel}（請於 asset-standards.js 登記其類別）`); continue; }
  const std = assetStandards[cls];
  const exempt = Object.entries(assetSizeExemptions).find(([sfx]) => rel.endsWith(sfx))?.[1];
  const bytes = statSync(abs).size;
  let dims;
  try { dims = imageDims(abs); } catch (e) { violations.push(`${rel} 無法讀取尺寸：${e.message}`); continue; }
  checked += 1;
  if (exempt) continue;
  const sizeOk = std.mode === "bound" ? (dims.w <= std.width && dims.h <= std.height) : (dims.w === std.width && dims.h === std.height);
  const weightOk = bytes <= std.maxKB * 1024;
  if (!sizeOk) {
    violations.push(`${cls} ${rel} 為 ${dims.w}x${dims.h}，${std.mode === "bound" ? `超出畫布 ${std.width}x${std.height}` : `應為 ${std.width}x${std.height}`}`);
  }
  if (!weightOk) {
    violations.push(`${cls} ${rel} 為 ${(bytes / 1024).toFixed(1)}KB，超出 ${std.maxKB}KB 預算`);
  }
}

console.log(`assetLint（issue #197）── 掃描 ${files.length} 圖像檔、檢查 ${checked}、登記類別 ${Object.keys(assetStandards).length}`);
if (violations.length === 0) {
  console.log("結果：PASS（0 違規）");
  process.exit(0);
}
console.log(`結果：FAIL（${violations.length} 違規）`);
violations.forEach((v) => console.log("  ✗ " + v));
process.exit(violations.length);
